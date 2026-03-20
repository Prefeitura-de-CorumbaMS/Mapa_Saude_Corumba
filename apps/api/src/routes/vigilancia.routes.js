// Rotas da API de Vigilância em Saúde
// Endpoints públicos para dados epidemiológicos

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { logger } = require('@sigls/logger');
const { asyncHandler } = require('../middleware/error.middleware');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

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

// ============================================================================
// ADMIN ENDPOINTS - Importação de Dados
// ============================================================================

/**
 * POST /api/vigilancia/dengue/importar
 * Importa dados de vigilância de dengue
 *
 * Body: {
 *   tipo: 'notificados' | 'perfil' | 'kpis',
 *   ano: number,
 *   dados: Array
 * }
 */
router.post('/dengue/importar', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { tipo, ano, dados } = req.body;
  const userId = req.user.id;

  // Validações
  if (!tipo || !ano || !dados || !Array.isArray(dados)) {
    return res.status(400).json({
      success: false,
      error: 'Parâmetros inválidos: tipo, ano e dados são obrigatórios',
    });
  }

  if (!['notificados', 'perfil', 'kpis', 'casos'].includes(tipo)) {
    return res.status(400).json({
      success: false,
      error: 'Tipo inválido. Valores aceitos: notificados, perfil, kpis, casos',
    });
  }

  const anoAtual = new Date().getFullYear();
  if (ano < 2020 || ano > anoAtual + 1) {
    return res.status(400).json({
      success: false,
      error: `Ano inválido. Deve estar entre 2020 e ${anoAtual + 1}`,
    });
  }

  if (dados.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Array de dados está vazio',
    });
  }

  // Processar importação
  let resultado;

  try {
    if (tipo === 'notificados') {
      resultado = await importarNotificados(ano, dados, userId);
    } else if (tipo === 'perfil') {
      resultado = await importarPerfil(ano, dados, userId);
    } else if (tipo === 'kpis') {
      resultado = await importarKPIs(ano, dados, userId);
    } else if (tipo === 'casos') {
      resultado = await importarCasosIndividuais(ano, dados, userId);
    }

    // Log de auditoria (simplificado - pode ser expandido)
    logger.info('Importação de vigilância realizada', {
      user_id: userId,
      tipo,
      ano,
      registros: dados.length,
      resultado,
    });

    res.json({
      success: true,
      data: resultado,
    });

  } catch (error) {
    logger.error('Erro na importação de vigilância', {
      error: error.message,
      stack: error.stack,
      user_id: userId,
      tipo,
      ano,
    });

    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao importar dados',
    });
  }
}));

/**
 * Importa dados da aba NOTIFICADOS (casos por bairro)
 */
async function importarNotificados(ano, dados, userId) {
  return await prisma.$transaction(async (tx) => {
    // Agrupar dados por SE
    const dadosPorSE = dados.reduce((acc, item) => {
      if (!acc[item.se]) {
        acc[item.se] = [];
      }
      acc[item.se].push(item);
      return acc;
    }, {});

    const sesProcessadas = [];
    let bairrosInseridos = 0;

    for (const [se, registrosSE] of Object.entries(dadosPorSE)) {
      const seNum = parseInt(se);

      // Calcular totais da SE
      const totais = registrosSE.reduce(
        (acc, r) => ({
          notificados: acc.notificados + r.notificados,
          confirmados: acc.confirmados + r.confirmados,
        }),
        { notificados: 0, confirmados: 0 }
      );

      // 1. Upsert registro da SE
      const dengueSE = await tx.vIGILANCIA_Dengue_SE.upsert({
        where: {
          ano_semana_epidemiologica: {
            ano: ano,
            semana_epidemiologica: seNum,
          },
        },
        update: {
          casos_notificados: totais.notificados,
          casos_confirmados: totais.confirmados,
          updated_at: new Date(),
        },
        create: {
          ano,
          semana_epidemiologica: seNum,
          casos_notificados: totais.notificados,
          casos_confirmados: totais.confirmados,
          sorotipo_tipo1: 0,
          sorotipo_tipo2: 0,
          sorotipo_tipo3: 0,
          sorotipo_tipo4: 0,
          isolamentos_virais: 0,
          obitos: 0,
          fonte: 'Importação Manual',
          data_publicacao: new Date(),
        },
      });

      sesProcessadas.push(dengueSE);

      // 2. Deletar dados de bairro existentes para esta SE
      await tx.vIGILANCIA_Dengue_Bairro.deleteMany({
        where: {
          ano,
          semana_epidemiologica: seNum,
        },
      });

      // 3. Inserir novos dados de bairro
      for (const registro of registrosSE) {
        await tx.vIGILANCIA_Dengue_Bairro.create({
          data: {
            ano,
            semana_epidemiologica: seNum,
            bairro: registro.bairro,
            notificados: registro.notificados,
            confirmados: registro.confirmados,
            dengue_se_id: dengueSE.id,
          },
        });
        bairrosInseridos++;
      }
    }

    return {
      semanas_processadas: sesProcessadas.length,
      bairros_inseridos: bairrosInseridos,
    };
  });
}

/**
 * Importa dados de perfil demográfico
 */
async function importarPerfil(ano, dados, userId) {
  return await prisma.$transaction(async (tx) => {
    // Agrupar por SE
    const dadosPorSE = dados.reduce((acc, item) => {
      if (!acc[item.se]) {
        acc[item.se] = [];
      }
      acc[item.se].push(item);
      return acc;
    }, {});

    let perfisInseridos = 0;

    for (const [se, registrosSE] of Object.entries(dadosPorSE)) {
      const seNum = parseInt(se);

      // Buscar SE
      const dengueSE = await tx.vIGILANCIA_Dengue_SE.findUnique({
        where: {
          ano_semana_epidemiologica: {
            ano,
            semana_epidemiologica: seNum,
          },
        },
      });

      if (!dengueSE) {
        throw new Error(
          `SE ${seNum}/${ano} não encontrada. Importe os dados notificados primeiro.`
        );
      }

      // Deletar perfil existente
      await tx.vIGILANCIA_Dengue_Perfil.deleteMany({
        where: {
          ano,
          semana_epidemiologica: seNum,
        },
      });

      // Inserir novo perfil
      for (const registro of registrosSE) {
        await tx.vIGILANCIA_Dengue_Perfil.create({
          data: {
            ano,
            semana_epidemiologica: seNum,
            faixa_etaria: registro.faixa_etaria,
            sexo: registro.sexo,
            casos: registro.casos,
            dengue_se_id: dengueSE.id,
          },
        });
        perfisInseridos++;
      }
    }

    return {
      perfis_inseridos: perfisInseridos,
    };
  });
}

/**
 * Importa KPIs da SE (sorotipos, óbitos, isolamentos)
 */
async function importarKPIs(ano, dados, userId) {
  return await prisma.$transaction(async (tx) => {
    let sesAtualizadas = 0;

    for (const registro of dados) {
      const dengueSE = await tx.vIGILANCIA_Dengue_SE.update({
        where: {
          ano_semana_epidemiologica: {
            ano,
            semana_epidemiologica: registro.se,
          },
        },
        data: {
          sorotipo_tipo1: registro.tipo1 || 0,
          sorotipo_tipo2: registro.tipo2 || 0,
          sorotipo_tipo3: registro.tipo3 || 0,
          sorotipo_tipo4: registro.tipo4 || 0,
          isolamentos_virais: registro.isolamentos || 0,
          obitos: registro.obitos || 0,
          updated_at: new Date(),
        },
      });

      sesAtualizadas++;
    }

    return {
      semanas_atualizadas: sesAtualizadas,
    };
  });
}

/**
 * Importa casos individuais (registros do laboratório)
 */
async function importarCasosIndividuais(ano, dados, userId) {
  return await prisma.$transaction(async (tx) => {
    let casosInseridos = 0;

    for (const caso of dados) {
      await tx.vIGILANCIA_Dengue_Caso.create({
        data: {
          ano,
          numero_caso: caso.numero_caso || null,
          unidade: caso.unidade || null,
          sinan: caso.sinan || null,
          data_notificacao: caso.data_notificacao || null,
          data_sintomas: caso.data_sintomas || null,
          paciente: caso.paciente,
          data_nascimento: caso.data_nascimento || null,
          sexo: caso.sexo || null,
          endereco: caso.endereco || null,
          bairro: caso.bairro || null,
          semana_epidemiologica: caso.semana_epidemiologica,
          observacoes: caso.observacoes || null,
        },
      });
      casosInseridos++;
    }

    return {
      casos_inseridos: casosInseridos,
    };
  });
}

/**
 * GET /api/vigilancia/dengue/ano?ano=2026
 * Retorna TODOS os dados de um ano (SEs e Bairros)
 * Para gerenciamento e relatórios
 */
router.get('/dengue/ano', async (req, res) => {
  try {
    const { ano } = req.query;

    if (!ano) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetro obrigatório: ano',
      });
    }

    // Buscar todas as SEs do ano
    const semanas = await prisma.vIGILANCIA_Dengue_SE.findMany({
      where: {
        ano: parseInt(ano),
      },
      orderBy: {
        semana_epidemiologica: 'asc',
      },
    });

    // Buscar todos os dados de bairros do ano
    const bairros = await prisma.vIGILANCIA_Dengue_Bairro.findMany({
      where: {
        ano: parseInt(ano),
      },
      orderBy: [
        { semana_epidemiologica: 'asc' },
        { bairro: 'asc' },
      ],
    });

    // Buscar todos os casos individuais do ano
    const casos = await prisma.vIGILANCIA_Dengue_Caso.findMany({
      where: {
        ano: parseInt(ano),
      },
      orderBy: [
        { semana_epidemiologica: 'asc' },
        { paciente: 'asc' },
      ],
    });

    res.json({
      success: true,
      data: {
        ano: parseInt(ano),
        semanas,
        bairros,
        casos,
        totais: {
          total_semanas: semanas.length,
          total_registros_bairros: bairros.length,
          total_casos: casos.length,
        },
      },
    });
  } catch (error) {
    logger.error('Erro ao buscar dados do ano', {
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
 * PUT /api/vigilancia/dengue/bairro/:id
 * Atualiza dados de um registro de bairro
 */
router.put('/dengue/bairro/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { bairro, semana_epidemiologica, notificados, confirmados, ano } = req.body;

  // Validações
  if (!bairro || !semana_epidemiologica || notificados === undefined || confirmados === undefined) {
    return res.status(400).json({
      success: false,
      error: 'Campos obrigatórios: bairro, semana_epidemiologica, notificados, confirmados',
    });
  }

  // Atualizar registro do bairro
  const atualizado = await prisma.vIGILANCIA_Dengue_Bairro.update({
    where: { id: parseInt(id) },
    data: {
      bairro: bairro.trim(),
      semana_epidemiologica: parseInt(semana_epidemiologica),
      notificados: parseInt(notificados),
      confirmados: parseInt(confirmados),
      ano: parseInt(ano),
    },
  });

  // Recalcular totais da SE somando todos os bairros
  const totaisBairros = await prisma.vIGILANCIA_Dengue_Bairro.aggregate({
    where: {
      ano: parseInt(ano),
      semana_epidemiologica: parseInt(semana_epidemiologica),
    },
    _sum: {
      notificados: true,
      confirmados: true,
    },
  });

  // Atualizar registro na tabela de SE com os novos totais
  await prisma.vIGILANCIA_Dengue_SE.upsert({
    where: {
      ano_semana_epidemiologica: {
        ano: parseInt(ano),
        semana_epidemiologica: parseInt(semana_epidemiologica),
      },
    },
    update: {
      casos_notificados: totaisBairros._sum.notificados || 0,
      casos_confirmados: totaisBairros._sum.confirmados || 0,
    },
    create: {
      ano: parseInt(ano),
      semana_epidemiologica: parseInt(semana_epidemiologica),
      casos_notificados: totaisBairros._sum.notificados || 0,
      casos_confirmados: totaisBairros._sum.confirmados || 0,
      sorotipo_tipo1: 0,
      sorotipo_tipo2: 0,
      sorotipo_tipo3: 0,
      sorotipo_tipo4: 0,
      isolamentos_virais: 0,
      obitos: 0,
    },
  });

  logger.info('Registro de bairro atualizado e totais da SE recalculados', {
    id,
    bairro,
    se: semana_epidemiologica,
    totais: {
      notificados: totaisBairros._sum.notificados,
      confirmados: totaisBairros._sum.confirmados,
    },
    user: req.user?.username,
  });

  res.json({
    success: true,
    data: atualizado,
    totais_recalculados: {
      notificados: totaisBairros._sum.notificados,
      confirmados: totaisBairros._sum.confirmados,
    },
  });
}));

/**
 * DELETE /api/vigilancia/dengue/bairro/:id
 * Deleta um registro de bairro
 */
router.delete('/dengue/bairro/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Buscar o registro antes de deletar para pegar ano e SE
  const registro = await prisma.vIGILANCIA_Dengue_Bairro.findUnique({
    where: { id: parseInt(id) },
  });

  if (!registro) {
    return res.status(404).json({
      success: false,
      error: 'Registro não encontrado',
    });
  }

  const { ano, semana_epidemiologica } = registro;

  // Deletar o registro
  await prisma.vIGILANCIA_Dengue_Bairro.delete({
    where: { id: parseInt(id) },
  });

  // Recalcular totais agregando todos os bairros restantes desta SE
  const totaisBairros = await prisma.vIGILANCIA_Dengue_Bairro.aggregate({
    where: {
      ano: parseInt(ano),
      semana_epidemiologica: parseInt(semana_epidemiologica),
    },
    _sum: {
      notificados: true,
      confirmados: true,
    },
  });

  // Atualizar a tabela SE com os novos totais
  await prisma.vIGILANCIA_Dengue_SE.update({
    where: {
      ano_semana_epidemiologica: {
        ano: parseInt(ano),
        semana_epidemiologica: parseInt(semana_epidemiologica),
      },
    },
    data: {
      casos_notificados: totaisBairros._sum.notificados || 0,
      casos_confirmados: totaisBairros._sum.confirmados || 0,
      updated_at: new Date(),
    },
  });

  logger.info('Registro de bairro deletado e totais recalculados', {
    id,
    ano,
    semana_epidemiologica,
    user: req.user?.username,
  });

  res.json({
    success: true,
    message: 'Registro deletado com sucesso',
  });
}));

/**
 * PUT /api/vigilancia/dengue/caso/:id
 * Atualiza dados de um caso individual
 */
router.put('/dengue/caso/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    numero_caso,
    unidade,
    sinan,
    data_notificacao,
    data_sintomas,
    paciente,
    data_nascimento,
    sexo,
    endereco,
    bairro,
    semana_epidemiologica,
    observacoes,
  } = req.body;

  const atualizado = await prisma.vIGILANCIA_Dengue_Caso.update({
    where: { id: parseInt(id) },
    data: {
      numero_caso,
      unidade,
      sinan,
      data_notificacao: data_notificacao ? new Date(data_notificacao) : null,
      data_sintomas: data_sintomas ? new Date(data_sintomas) : null,
      paciente,
      data_nascimento: data_nascimento ? new Date(data_nascimento) : null,
      sexo,
      endereco,
      bairro,
      semana_epidemiologica: parseInt(semana_epidemiologica),
      observacoes,
      updated_at: new Date(),
    },
  });

  logger.info('Caso individual atualizado', {
    id,
    paciente: atualizado.paciente,
    user: req.user?.username,
  });

  res.json({
    success: true,
    data: atualizado,
  });
}));

/**
 * DELETE /api/vigilancia/dengue/caso/:id
 * Deleta um caso individual
 */
router.delete('/dengue/caso/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const caso = await prisma.vIGILANCIA_Dengue_Caso.findUnique({
    where: { id: parseInt(id) },
  });

  if (!caso) {
    return res.status(404).json({
      success: false,
      error: 'Caso não encontrado',
    });
  }

  await prisma.vIGILANCIA_Dengue_Caso.delete({
    where: { id: parseInt(id) },
  });

  logger.info('Caso individual deletado', {
    id,
    paciente: caso.paciente,
    user: req.user?.username,
  });

  res.json({
    success: true,
    message: 'Caso deletado com sucesso',
  });
}));

module.exports = router;
