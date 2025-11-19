const express = require('express');
const { prisma } = require('@sigls/database');
const { logger, auditLog } = require('@sigls/logger');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

// ============================================================================
// ESPECIALIDADE ROUTES
// ============================================================================

/**
 * GET /api/especialidades
 * Lista todas as especialidades (público)
 */
router.get('/', asyncHandler(async (req, res) => {
  const { ativo = 'true' } = req.query;
  
  const where = {};
  if (ativo === 'true') {
    where.ativo = true;
  }
  
  const especialidades = await prisma.pROD_Especialidade.findMany({
    where,
    orderBy: { nome: 'asc' },
  });
  
  res.json({
    success: true,
    data: especialidades,
  });
}));

/**
 * GET /api/especialidades/:id
 * Busca especialidade por ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const especialidade = await prisma.pROD_Especialidade.findUnique({
    where: { id: parseInt(id) },
  });
  
  if (!especialidade) {
    return res.status(404).json({
      success: false,
      error: 'Especialidade not found',
    });
  }
  
  res.json({
    success: true,
    data: especialidade,
  });
}));

/**
 * POST /api/especialidades
 * Cria nova especialidade (requer autenticação)
 */
router.post('/', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { nome } = req.body;
  
  if (!nome) {
    return res.status(400).json({
      success: false,
      error: 'Nome is required',
    });
  }
  
  const especialidade = await prisma.pROD_Especialidade.create({
    data: { nome: nome.toUpperCase() },
  });
  
  auditLog('CREATE', 'PROD_Especialidade', especialidade.id, req.user.id, req.user.role);
  
  logger.info('Especialidade created', {
    user_id: req.user.id,
    especialidade_id: especialidade.id,
    nome: especialidade.nome,
  });
  
  res.status(201).json({
    success: true,
    data: especialidade,
  });
}));

/**
 * PUT /api/especialidades/:id
 * Atualiza especialidade (requer autenticação)
 */
router.put('/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nome, ativo } = req.body;
  
  const updateData = {};
  if (nome) updateData.nome = nome.toUpperCase();
  if (typeof ativo === 'boolean') updateData.ativo = ativo;
  
  const especialidade = await prisma.pROD_Especialidade.update({
    where: { id: parseInt(id) },
    data: updateData,
  });
  
  auditLog('UPDATE', 'PROD_Especialidade', parseInt(id), req.user.id, req.user.role, {
    updated_fields: Object.keys(updateData),
  });
  
  logger.info('Especialidade updated', {
    user_id: req.user.id,
    especialidade_id: parseInt(id),
    updated_fields: Object.keys(updateData),
  });
  
  res.json({
    success: true,
    data: especialidade,
  });
}));

/**
 * DELETE /api/especialidades/:id
 * Deleta especialidade (requer autenticação)
 */
router.delete('/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  await prisma.pROD_Especialidade.delete({
    where: { id: parseInt(id) },
  });
  
  auditLog('DELETE', 'PROD_Especialidade', parseInt(id), req.user.id, req.user.role);
  
  logger.info('Especialidade deleted', {
    user_id: req.user.id,
    especialidade_id: parseInt(id),
  });
  
  res.json({
    success: true,
    message: 'Especialidade deleted successfully',
  });
}));

module.exports = router;
