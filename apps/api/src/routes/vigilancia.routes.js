// Rotas da API de Vigilância em Saúde
// Endpoints públicos para dados epidemiológicos

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { logger } = require('@sigls/logger');

const router = express.Router();
const prisma = new PrismaClient();

// ============================================================================
// DENGUE - ENDPOINTS
// ============================================================================

/**
 * GET /api/vigilancia/dengue/se?ano=2026&se=9
 * Retorna KPIs + metadados de uma Semana Epidemiológica específica
 * IMPORTANTE: KPIs retornam valores ACUMULADOS desde SE 1 até a SE solicitada
 */
router.get('/dengue/se', async (req, res) => {
  try {
    const { ano, se } = req.query;

    if (!ano || !se) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros obrigatórios: ano e se (semana epidemiológica)',
      });
    }

    // Buscar todas as SE desde o início do ano até a SE solicitada
    const serieAcumulada = await prisma.vIGILANCIA_Dengue_SE.findMany({
      where: {
        ano: parseInt(ano),
        semana_epidemiologica: {
          lte: parseInt(se), // Menor ou igual à SE solicitada
        },
      },
      orderBy: {
        semana_epidemiologica: 'asc',
      },
    });

    if (serieAcumulada.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Dados não encontrados para SE ${se}/${ano}`,
      });
    }

    // Calcular totais acumulados
    const totais = serieAcumulada.reduce(
      (acc, se) => ({
        casos_notificados: acc.casos_notificados + se.casos_notificados,
        casos_confirmados: acc.casos_confirmados + se.casos_confirmados,
        sorotipo_tipo1: acc.sorotipo_tipo1 + se.sorotipo_tipo1,
        sorotipo_tipo2: acc.sorotipo_tipo2 + se.sorotipo_tipo2,
        sorotipo_tipo3: acc.sorotipo_tipo3 + se.sorotipo_tipo3,
        sorotipo_tipo4: acc.sorotipo_tipo4 + se.sorotipo_tipo4,
        isolamentos_virais: acc.isolamentos_virais + se.isolamentos_virais,
        obitos: acc.obitos + se.obitos,
      }),
      {
        casos_notificados: 0,
        casos_confirmados: 0,
        sorotipo_tipo1: 0,
        sorotipo_tipo2: 0,
        sorotipo_tipo3: 0,
        sorotipo_tipo4: 0,
        isolamentos_virais: 0,
        obitos: 0,
      }
    );

    // Pegar metadados da última SE
    const ultimaSE = serieAcumulada[serieAcumulada.length - 1];

    res.json({
      success: true,
      data: {
        ano: ultimaSE.ano,
        semana_epidemiologica: ultimaSE.semana_epidemiologica,
        periodo: `SE 01 a SE ${ultimaSE.semana_epidemiologica.toString().padStart(2, '0')}`,
        kpis: totais,
        fonte: ultimaSE.fonte,
        data_publicacao: ultimaSE.data_publicacao,
        observacoes: ultimaSE.observacoes,
      },
    });
  } catch (error) {
    logger.error('Erro ao buscar dados de dengue por SE', {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * GET /api/vigilancia/dengue/serie?ano=2026&se_inicio=1&se_fim=9
 * Retorna série histórica de múltiplas Semanas Epidemiológicas
 */
router.get('/dengue/serie', async (req, res) => {
  try {
    const { ano, se_inicio, se_fim } = req.query;

    if (!ano || !se_inicio || !se_fim) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros obrigatórios: ano, se_inicio, se_fim',
      });
    }

    const serieHistorica = await prisma.vIGILANCIA_Dengue_SE.findMany({
      where: {
        ano: parseInt(ano),
        semana_epidemiologica: {
          gte: parseInt(se_inicio),
          lte: parseInt(se_fim),
        },
      },
      orderBy: {
        semana_epidemiologica: 'asc',
      },
    });

    const serie = serieHistorica.map((se) => ({
      semana: se.semana_epidemiologica,
      notificados: se.casos_notificados,
      confirmados: se.casos_confirmados,
    }));

    res.json({
      success: true,
      data: serie,
    });
  } catch (error) {
    logger.error('Erro ao buscar série histórica de dengue', {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * GET /api/vigilancia/dengue/perfil?ano=2026&se=9
 * Retorna distribuição por faixa etária e sexo
 */
router.get('/dengue/perfil', async (req, res) => {
  try {
    const { ano, se } = req.query;

    if (!ano || !se) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros obrigatórios: ano e se',
      });
    }

    const perfil = await prisma.vIGILANCIA_Dengue_Perfil.findMany({
      where: {
        ano: parseInt(ano),
        semana_epidemiologica: parseInt(se),
      },
    });

    // Agregar por faixa etária
    const faixaEtariaMap = new Map();
    perfil.forEach((p) => {
      const atual = faixaEtariaMap.get(p.faixa_etaria) || 0;
      faixaEtariaMap.set(p.faixa_etaria, atual + p.casos);
    });

    const faixaEtaria = {
      labels: Array.from(faixaEtariaMap.keys()),
      valores: Array.from(faixaEtariaMap.values()),
    };

    // Agregar por sexo
    let feminino = 0;
    let masculino = 0;
    perfil.forEach((p) => {
      if (p.sexo === 'F') feminino += p.casos;
      if (p.sexo === 'M') masculino += p.casos;
    });

    res.json({
      success: true,
      data: {
        faixa_etaria: faixaEtaria,
        sexo: {
          feminino,
          masculino,
        },
      },
    });
  } catch (error) {
    logger.error('Erro ao buscar perfil de dengue', {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * GET /api/vigilancia/dengue/bairros?ano=2026&se=9&tipo=notificados
 * Retorna casos por bairro (notificados ou confirmados)
 */
router.get('/dengue/bairros', async (req, res) => {
  try {
    const { ano, se, tipo = 'notificados' } = req.query;

    if (!ano || !se) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros obrigatórios: ano e se',
      });
    }

    if (!['notificados', 'confirmados'].includes(tipo)) {
      return res.status(400).json({
        success: false,
        error: 'Tipo deve ser "notificados" ou "confirmados"',
      });
    }

    const bairros = await prisma.vIGILANCIA_Dengue_Bairro.findMany({
      where: {
        ano: parseInt(ano),
        semana_epidemiologica: parseInt(se),
      },
      orderBy: {
        [tipo]: 'desc', // Ordenar por notificados ou confirmados
      },
    });

    const dados = bairros
      .filter((b) => b[tipo] > 0) // Filtrar apenas com casos
      .map((b) => ({
        bairro: b.bairro,
        casos: b[tipo],
      }));

    res.json({
      success: true,
      data: dados,
    });
  } catch (error) {
    logger.error('Erro ao buscar bairros de dengue', {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

module.exports = router;
