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
 */
router.put('/:id/enrich', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nome_familiar, endereco_manual, latitude_manual, longitude_manual, observacoes } = req.body;
  
  const updateData = {};
  if (nome_familiar) updateData.nome_familiar = nome_familiar;
  if (endereco_manual) updateData.endereco_manual = endereco_manual;
  if (latitude_manual !== undefined) updateData.latitude_manual = latitude_manual;
  if (longitude_manual !== undefined) updateData.longitude_manual = longitude_manual;
  if (observacoes !== undefined) updateData.observacoes = observacoes;
  
  const record = await prisma.sTAGING_Info_Origem.update({
    where: { id: parseInt(id) },
    data: updateData,
  });
  
  logger.info('Staging record enriched', {
    user_id: req.user.id,
    staging_id: record.id,
    fields: Object.keys(updateData),
  });
  
  res.json({
    success: true,
    data: record,
  });
}));

/**
 * POST /api/staging/:id/validate
 * Valida e promove registro de staging para produção
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
  
  // Criar ou atualizar na produção
  const prodUnidade = await prisma.pROD_Unidade_Saude.upsert({
    where: { id_origem: stagingRecord.id_origem },
    create: {
      nome: stagingRecord.nome_familiar || stagingRecord.nome_unidade_bruto || 'Nome não informado',
      endereco: stagingRecord.endereco_manual,
      latitude: stagingRecord.latitude_manual,
      longitude: stagingRecord.longitude_manual,
      id_origem: stagingRecord.id_origem,
    },
    update: {
      nome: stagingRecord.nome_familiar || stagingRecord.nome_unidade_bruto || 'Nome não informado',
      endereco: stagingRecord.endereco_manual,
      latitude: stagingRecord.latitude_manual,
      longitude: stagingRecord.longitude_manual,
    },
  });
  
  // Atualizar staging
  await prisma.sTAGING_Info_Origem.update({
    where: { id: parseInt(id) },
    data: {
      status_processamento: 'validado',
      id_prod_link: prodUnidade.id,
    },
  });
  
  auditLog('VALIDATE', 'STAGING_Info_Origem', parseInt(id), req.user.id, req.user.role, {
    promoted_to_prod: prodUnidade.id,
  });
  
  logger.info('Staging record validated and promoted', {
    user_id: req.user.id,
    staging_id: parseInt(id),
    prod_id: prodUnidade.id,
  });
  
  res.json({
    success: true,
    data: {
      staging: stagingRecord,
      production: prodUnidade,
    },
    message: 'Record validated and promoted to production',
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
