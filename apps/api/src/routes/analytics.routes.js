const express = require('express');
const crypto = require('crypto');
const { prisma } = require('@sigls/database');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Gera hash SHA-256 anonimizado do IP para nunca armazenar o IP bruto.
 * O salt garante que o hash não seja reversível via rainbow tables.
 */
function hashIp(ip) {
  const salt = process.env.ANALYTICS_SALT || 'mapasaude-default-salt';
  return crypto.createHash('sha256').update(ip + salt).digest('hex');
}

/**
 * Retorna os limites de datas para hoje, mês atual e ano atual.
 */
function getPeriodBounds() {
  const now = new Date();

  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);

  const startOfYear = new Date(now.getFullYear(), 0, 1);
  startOfYear.setHours(0, 0, 0, 0);

  return { startOfDay, startOfMonth, startOfYear };
}

/**
 * Conta eventos de um tipo dentro de um período.
 */
async function countEvents(tipo, since) {
  return prisma.aNALYTICS_Event.count({
    where: { tipo, created_at: { gte: since } },
  });
}

/**
 * Conta ip_hashes distintos (visitantes únicos) dentro de um período.
 */
async function countUniqueVisitors(tipo, since) {
  const result = await prisma.$queryRaw`
    SELECT COUNT(DISTINCT ip_hash) as total
    FROM analytics_event
    WHERE tipo = ${tipo}
      AND ip_hash IS NOT NULL
      AND created_at >= ${since}
  `;
  return Number(result[0]?.total || 0);
}

// ============================================================================
// POST /api/analytics/event  — Público, rate-limited (ver index.js)
// ============================================================================

/**
 * Grava um evento de uso do mapa público.
 * Body: { tipo: string, dados?: object }
 *
 * Tipos válidos:
 *   page_view | busca_realizada | legenda_aberta | visualizacao_unidade
 *   filtro_aplicado | clique_mapa | contato_unidade | rede_social
 */
router.post('/event', asyncHandler(async (req, res) => {
  const TIPOS_VALIDOS = [
    'page_view',
    'busca_realizada',
    'legenda_aberta',
    'visualizacao_unidade',
    'filtro_aplicado',
    'clique_mapa',
    'contato_unidade',
    'rede_social',
  ];

  const { tipo, dados } = req.body;

  if (!tipo || !TIPOS_VALIDOS.includes(tipo)) {
    return res.status(400).json({ success: false, error: 'Tipo de evento inválido.' });
  }

  // Serializar dados (somente campos permitidos — evitar payload inflado)
  let dadosJson = null;
  if (dados && typeof dados === 'object') {
    const sanitized = {};
    const allowedKeys = [
      'termo', 'tipo_busca', 'resultados',
      'unidade_id', 'unidade_nome',
      'tipo_filtro', 'valor_filtro',
      'tipo_contato', 'rede_social',
      'origem',
    ];
    for (const key of allowedKeys) {
      if (dados[key] !== undefined) {
        // Sanitizar strings: max 500 chars
        sanitized[key] = typeof dados[key] === 'string'
          ? dados[key].slice(0, 500)
          : dados[key];
      }
    }
    dadosJson = JSON.stringify(sanitized);
  }

  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  const ipHash = hashIp(ip);

  await prisma.aNALYTICS_Event.create({
    data: { tipo, dados: dadosJson, ip_hash: ipHash },
  });

  res.status(201).json({ success: true });
}));

// ============================================================================
// GET /api/analytics/stats  — Requer autenticação admin
// ============================================================================

router.get('/stats', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { startOfDay, startOfMonth, startOfYear } = getPeriodBounds();

  // Executar todas as queries em paralelo para máxima performance
  const [
    visitasHoje,
    visitasMes,
    visitasAno,
    visitantesUnicos_hoje,
    visitantesUnicos_mes,
    visitantesUnicos_ano,
    legendaHoje,
    legendaMes,
    buscasHoje,
    buscasMes,
    topBuscas,
    topUnidades,
  ] = await Promise.all([
    // Visitas totais
    countEvents('page_view', startOfDay),
    countEvents('page_view', startOfMonth),
    countEvents('page_view', startOfYear),

    // Visitantes únicos (por ip_hash)
    countUniqueVisitors('page_view', startOfDay),
    countUniqueVisitors('page_view', startOfMonth),
    countUniqueVisitors('page_view', startOfYear),

    // Uso da legenda
    countEvents('legenda_aberta', startOfDay),
    countEvents('legenda_aberta', startOfMonth),

    // Buscas realizadas
    countEvents('busca_realizada', startOfDay),
    countEvents('busca_realizada', startOfMonth),

    // Top 10 termos de busca (último mês)
    prisma.$queryRaw`
      SELECT
        JSON_UNQUOTE(JSON_EXTRACT(dados, '$.termo')) AS termo,
        COUNT(*) AS total
      FROM analytics_event
      WHERE tipo = 'busca_realizada'
        AND dados IS NOT NULL
        AND JSON_EXTRACT(dados, '$.termo') IS NOT NULL
        AND created_at >= ${startOfMonth}
      GROUP BY termo
      ORDER BY total DESC
      LIMIT 10
    `,

    // Top 10 unidades mais acessadas (último mês)
    prisma.$queryRaw`
      SELECT
        JSON_UNQUOTE(JSON_EXTRACT(dados, '$.unidade_id'))    AS unidade_id,
        JSON_UNQUOTE(JSON_EXTRACT(dados, '$.unidade_nome'))  AS unidade_nome,
        COUNT(*) AS total
      FROM analytics_event
      WHERE tipo = 'visualizacao_unidade'
        AND dados IS NOT NULL
        AND JSON_EXTRACT(dados, '$.unidade_id') IS NOT NULL
        AND created_at >= ${startOfMonth}
      GROUP BY unidade_id, unidade_nome
      ORDER BY total DESC
      LIMIT 10
    `,
  ]);

  res.json({
    success: true,
    data: {
      visitas: {
        hoje: visitasHoje,
        mes: visitasMes,
        ano: visitasAno,
      },
      visitantes_unicos: {
        hoje: visitantesUnicos_hoje,
        mes: visitantesUnicos_mes,
        ano: visitantesUnicos_ano,
      },
      legenda: {
        hoje: legendaHoje,
        mes: legendaMes,
      },
      buscas: {
        hoje: buscasHoje,
        mes: buscasMes,
        top: topBuscas.map(r => ({
          termo: r.termo,
          total: Number(r.total),
        })),
      },
      unidades_top: topUnidades.map(r => ({
        unidade_id: r.unidade_id,
        unidade_nome: r.unidade_nome,
        total: Number(r.total),
      })),
    },
  });
}));

module.exports = router;
