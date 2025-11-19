const express = require('express');
const { prisma } = require('@sigls/database');
const { logger, auditLog } = require('@sigls/logger');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

// ============================================================================
// MÉDICO ROUTES
// ============================================================================

/**
 * GET /api/medicos
 * Lista todos os médicos
 */
router.get('/', asyncHandler(async (req, res) => {
  const { ativo = 'true', page = 1, limit = 100 } = req.query;
  
  const where = {};
  if (ativo === 'true') {
    where.ativo = true;
  }
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [medicos, total] = await Promise.all([
    prisma.pROD_Medico.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        especialidades: {
          include: {
            especialidade: true,
          },
        },
      },
      orderBy: { nome: 'asc' },
    }),
    prisma.pROD_Medico.count({ where }),
  ]);
  
  const medicosFormatted = medicos.map(m => ({
    ...m,
    especialidades: m.especialidades.map(e => e.especialidade),
  }));
  
  res.json({
    success: true,
    data: medicosFormatted,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
}));

/**
 * GET /api/medicos/:id
 * Busca médico por ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const medico = await prisma.pROD_Medico.findUnique({
    where: { id: parseInt(id) },
    include: {
      especialidades: {
        include: {
          especialidade: true,
        },
      },
    },
  });
  
  if (!medico) {
    return res.status(404).json({
      success: false,
      error: 'Médico not found',
    });
  }
  
  res.json({
    success: true,
    data: {
      ...medico,
      especialidades: medico.especialidades.map(e => e.especialidade),
    },
  });
}));

/**
 * POST /api/medicos
 * Cria novo médico (requer autenticação)
 */
router.post('/', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { nome, id_origem, especialidades = [] } = req.body;
  
  if (!nome || !id_origem) {
    return res.status(400).json({
      success: false,
      error: 'Nome and id_origem are required',
    });
  }
  
  const medico = await prisma.pROD_Medico.create({
    data: {
      nome,
      id_origem,
    },
  });
  
  if (especialidades.length > 0) {
    await prisma.junction_Medico_Especialidade.createMany({
      data: especialidades.map(esp_id => ({
        id_medico: medico.id,
        id_especialidade: esp_id,
      })),
    });
  }
  
  auditLog('CREATE', 'PROD_Medico', medico.id, req.user.id, req.user.role);
  
  logger.info('Médico created', {
    user_id: req.user.id,
    medico_id: medico.id,
    nome: medico.nome,
  });
  
  res.status(201).json({
    success: true,
    data: medico,
  });
}));

/**
 * PUT /api/medicos/:id
 * Atualiza médico (requer autenticação)
 */
router.put('/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nome, ativo, especialidades } = req.body;
  
  const updateData = {};
  if (nome) updateData.nome = nome;
  if (typeof ativo === 'boolean') updateData.ativo = ativo;
  
  const medico = await prisma.pROD_Medico.update({
    where: { id: parseInt(id) },
    data: updateData,
  });
  
  if (especialidades !== undefined) {
    await prisma.junction_Medico_Especialidade.deleteMany({
      where: { id_medico: parseInt(id) },
    });
    
    if (especialidades.length > 0) {
      await prisma.junction_Medico_Especialidade.createMany({
        data: especialidades.map(esp_id => ({
          id_medico: parseInt(id),
          id_especialidade: esp_id,
        })),
      });
    }
  }
  
  auditLog('UPDATE', 'PROD_Medico', parseInt(id), req.user.id, req.user.role, {
    updated_fields: Object.keys(updateData),
  });
  
  logger.info('Médico updated', {
    user_id: req.user.id,
    medico_id: parseInt(id),
    updated_fields: Object.keys(updateData),
  });
  
  res.json({
    success: true,
    data: medico,
  });
}));

/**
 * DELETE /api/medicos/:id
 * Deleta médico (requer autenticação)
 */
router.delete('/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  await prisma.pROD_Medico.delete({
    where: { id: parseInt(id) },
  });
  
  auditLog('DELETE', 'PROD_Medico', parseInt(id), req.user.id, req.user.role);
  
  logger.info('Médico deleted', {
    user_id: req.user.id,
    medico_id: parseInt(id),
  });
  
  res.json({
    success: true,
    message: 'Médico deleted successfully',
  });
}));

module.exports = router;
