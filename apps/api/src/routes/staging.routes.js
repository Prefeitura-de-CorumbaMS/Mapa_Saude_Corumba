const express = require('express');
const { prisma } = require('@sigls/database');
const { logger, auditLog } = require('@sigls/logger');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

// Todas as rotas requerem autenticação de Admin
router.use(authenticate);
router.use(requireAdmin);

// ============================================================================
// STAGING ROUTES - Gerenciamento de dados em staging
// ============================================================================

/**
 * GET /api/staging
 * Lista registros em staging com filtros
 */
router.get('/', asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  
  const where = {};
  if (status) {
    where.status_processamento = status;
  }
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [records, total] = await Promise.all([
    prisma.sTAGING_Info_Origem.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { created_at: 'desc' },
    }),
    prisma.sTAGING_Info_Origem.count({ where }),
  ]);
  
  res.json({
    success: true,
    data: records,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
}));

/**
 * GET /api/staging/:id
 * Busca registro em staging por ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const record = await prisma.sTAGING_Info_Origem.findUnique({
    where: { id: parseInt(id) },
  });
  
  if (!record) {
    return res.status(404).json({
      success: false,
      error: 'Record not found',
    });
  }
  
  // Se tem link para PROD, buscar também
  let prodRecord = null;
  if (record.id_prod_link) {
    prodRecord = await prisma.pROD_Unidade_Saude.findUnique({
      where: { id: record.id_prod_link },
      include: {
        especialidades: {
          include: {
            especialidade: true,
          },
        },
      },
    });
  }
  
  res.json({
    success: true,
    data: {
      staging: record,
      production: prodRecord,
    },
  });
}));

/**
 * PUT /api/staging/:id/enrich
 * Enriquece registro em staging (adiciona dados manuais)
 * APLICA os mesmos dados para TODOS os registros da mesma unidade
 */
router.put('/:id/enrich', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nome_familiar, endereco_manual, latitude_manual, longitude_manual, imagem_url, observacoes } = req.body;

  // Buscar o registro para pegar o nome da unidade
  const stagingRecord = await prisma.sTAGING_Info_Origem.findUnique({
    where: { id: parseInt(id) },
  });

  if (!stagingRecord) {
    return res.status(404).json({
      success: false,
      error: 'Record not found',
    });
  }

  const updateData = {};
  if (nome_familiar) updateData.nome_familiar = nome_familiar;
  if (endereco_manual) updateData.endereco_manual = endereco_manual;
  if (latitude_manual !== undefined) updateData.latitude_manual = latitude_manual;
  if (longitude_manual !== undefined) updateData.longitude_manual = longitude_manual;
  if (imagem_url !== undefined) updateData.imagem_url = imagem_url;
  if (observacoes !== undefined) updateData.observacoes = observacoes;

  // ATUALIZAR TODOS OS REGISTROS DA MESMA UNIDADE
  const result = await prisma.sTAGING_Info_Origem.updateMany({
    where: {
      nome_unidade_bruto: stagingRecord.nome_unidade_bruto,
    },
    data: updateData,
  });

  // Buscar o registro atualizado para retornar
  const record = await prisma.sTAGING_Info_Origem.findUnique({
    where: { id: parseInt(id) },
  });

  logger.info('Staging records enriched (grouped by unit)', {
    user_id: req.user.id,
    staging_id: record.id,
    records_updated: result.count,
    unidade_nome: stagingRecord.nome_unidade_bruto,
    fields: Object.keys(updateData),
  });

  res.json({
    success: true,
    data: record,
    records_updated: result.count,
    message: `${result.count} registros da mesma unidade foram atualizados`,
  });
}));

/**
 * POST /api/staging/:id/validate
 * Valida e promove registro de staging para produção
 * AGRUPA automaticamente todos os registros da mesma unidade
 */
router.post('/:id/validate', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const stagingRecord = await prisma.sTAGING_Info_Origem.findUnique({
    where: { id: parseInt(id) },
  });

  if (!stagingRecord) {
    return res.status(404).json({
      success: false,
      error: 'Record not found',
    });
  }

  if (stagingRecord.status_processamento === 'validado') {
    return res.status(400).json({
      success: false,
      error: 'Record already validated',
    });
  }

  // Validar dados obrigatórios
  if (!stagingRecord.latitude_manual || !stagingRecord.longitude_manual) {
    return res.status(400).json({
      success: false,
      error: 'Latitude and longitude are required for validation',
    });
  }

  // BUSCAR TODOS OS REGISTROS DA MESMA UNIDADE
  const allRecordsFromUnidade = await prisma.sTAGING_Info_Origem.findMany({
    where: {
      nome_unidade_bruto: stagingRecord.nome_unidade_bruto,
    },
  });

  // Gerar ID único para a unidade baseado no nome
  const unidadeIdOrigem = `unidade_${Buffer.from(stagingRecord.nome_unidade_bruto).toString('base64').substring(0, 50)}`;

  // Criar ou atualizar a unidade na produção
  const prodUnidade = await prisma.pROD_Unidade_Saude.upsert({
    where: { id_origem: unidadeIdOrigem },
    create: {
      nome: stagingRecord.nome_familiar || stagingRecord.nome_unidade_bruto || 'Nome não informado',
      endereco: stagingRecord.endereco_manual,
      latitude: stagingRecord.latitude_manual,
      longitude: stagingRecord.longitude_manual,
      imagem_url: stagingRecord.imagem_url,
      id_origem: unidadeIdOrigem,
    },
    update: {
      nome: stagingRecord.nome_familiar || stagingRecord.nome_unidade_bruto || 'Nome não informado',
      endereco: stagingRecord.endereco_manual,
      latitude: stagingRecord.latitude_manual,
      longitude: stagingRecord.longitude_manual,
      imagem_url: stagingRecord.imagem_url,
    },
  });

  // Coletar todos os médicos e especialidades únicos
  const medicosMap = new Map();
  const especialidadesSet = new Set();

  for (const record of allRecordsFromUnidade) {
    if (record.nome_medico_bruto) {
      const medicoKey = record.nome_medico_bruto.trim().toLowerCase();
      if (!medicosMap.has(medicoKey)) {
        medicosMap.set(medicoKey, {
          nome: record.nome_medico_bruto.trim(),
          especialidade: record.nome_especialidade_bruto?.trim(),
        });
      }
    }

    if (record.nome_especialidade_bruto) {
      especialidadesSet.add(record.nome_especialidade_bruto.trim());
    }
  }

  // Criar/buscar médicos e vincular à unidade
  for (const [, medicoData] of medicosMap) {
    // Buscar ou criar médico
    let medico = await prisma.pROD_Medico.findFirst({
      where: { nome: medicoData.nome },
    });

    if (!medico) {
      const medicoIdOrigem = `medico_${Buffer.from(medicoData.nome).toString('base64').substring(0, 50)}`;
      medico = await prisma.pROD_Medico.create({
        data: {
          nome: medicoData.nome,
          id_origem: medicoIdOrigem,
        },
      });
    }

    // Buscar especialidade normalizada
    if (medicoData.especialidade) {
      const especialidadeNormalizada = await prisma.pROD_Especialidade.findFirst({
        where: {
          mapeamentos: {
            some: {
              nome_bruto: medicoData.especialidade,
            },
          },
        },
      });

      if (especialidadeNormalizada) {
        // Vincular médico à especialidade (se ainda não vinculado)
        await prisma.junction_Medico_Especialidade.upsert({
          where: {
            id_medico_id_especialidade: {
              id_medico: medico.id,
              id_especialidade: especialidadeNormalizada.id,
            },
          },
          create: {
            id_medico: medico.id,
            id_especialidade: especialidadeNormalizada.id,
          },
          update: {},
        });

        // Vincular unidade à especialidade (se ainda não vinculado)
        await prisma.junction_Unidade_Especialidade.upsert({
          where: {
            id_unidade_id_especialidade: {
              id_unidade: prodUnidade.id,
              id_especialidade: especialidadeNormalizada.id,
            },
          },
          create: {
            id_unidade: prodUnidade.id,
            id_especialidade: especialidadeNormalizada.id,
          },
          update: {},
        });
      }
    }
  }

  // Marcar TODOS os registros da unidade como validados
  await prisma.sTAGING_Info_Origem.updateMany({
    where: {
      nome_unidade_bruto: stagingRecord.nome_unidade_bruto,
    },
    data: {
      status_processamento: 'validado',
      id_prod_link: prodUnidade.id,
    },
  });

  auditLog('VALIDATE_GROUPED', 'STAGING_Info_Origem', parseInt(id), req.user.id, req.user.role, {
    promoted_to_prod: prodUnidade.id,
    records_grouped: allRecordsFromUnidade.length,
    medicos_count: medicosMap.size,
    especialidades_count: especialidadesSet.size,
  });

  logger.info('Staging records validated and promoted (grouped by unit)', {
    user_id: req.user.id,
    staging_id: parseInt(id),
    prod_id: prodUnidade.id,
    total_records: allRecordsFromUnidade.length,
    medicos: medicosMap.size,
    especialidades: especialidadesSet.size,
  });
  
  res.json({
    success: true,
    data: {
      staging: stagingRecord,
      production: prodUnidade,
    },
    records_grouped: allRecordsFromUnidade.length,
    medicos_count: medicosMap.size,
    especialidades_count: especialidadesSet.size,
    message: `${allRecordsFromUnidade.length} registros validados e agrupados. ${medicosMap.size} médicos e ${especialidadesSet.size} especialidades processadas.`,
  });
}));

/**
 * PUT /api/staging/:id/status
 * Atualiza status do registro em staging
 */
router.put('/:id/status', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!['pendente', 'validado', 'erro', 'ignorado'].includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid status',
    });
  }
  
  const record = await prisma.sTAGING_Info_Origem.update({
    where: { id: parseInt(id) },
    data: { status_processamento: status },
  });
  
  logger.info('Staging record status updated', {
    user_id: req.user.id,
    staging_id: record.id,
    new_status: status,
  });
  
  res.json({
    success: true,
    data: record,
  });
}));

module.exports = router;
