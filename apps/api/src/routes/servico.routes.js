const express = require('express');
const { prisma } = require('@sigls/database');
const { logger, auditLog } = require('@sigls/logger');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

// ============================================================================
// SERVIÇOS DE UNIDADES ROUTES
// ============================================================================

/**
 * GET /api/servicos/unidade/:id_unidade
 * Lista todos os serviços de uma unidade específica
 */
router.get('/unidade/:id_unidade', asyncHandler(async (req, res) => {
  const { id_unidade } = req.params;
  const { ativo = 'true' } = req.query;

  const where = { id_unidade: parseInt(id_unidade) };
  if (ativo === 'true') {
    where.ativo = true;
  }

  const servicos = await prisma.pROD_Unidade_Servico.findMany({
    where,
    orderBy: { ordem: 'asc' },
  });

  res.json({
    success: true,
    data: servicos,
  });
}));

/**
 * GET /api/servicos/:id
 * Busca serviço por ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const servico = await prisma.pROD_Unidade_Servico.findUnique({
    where: { id: parseInt(id) },
  });

  if (!servico) {
    return res.status(404).json({
      success: false,
      error: 'Serviço não encontrado',
    });
  }

  res.json({
    success: true,
    data: servico,
  });
}));

/**
 * POST /api/servicos
 * Cria um novo serviço (admin)
 */
router.post('/', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id_unidade, descricao, ordem = 0, ativo = true } = req.body;

  // Validação
  if (!id_unidade || !descricao) {
    return res.status(400).json({
      success: false,
      error: 'id_unidade e descricao são obrigatórios',
    });
  }

  // Verificar se a unidade existe
  const unidade = await prisma.pROD_Unidade_Saude.findUnique({
    where: { id: parseInt(id_unidade) },
  });

  if (!unidade) {
    return res.status(404).json({
      success: false,
      error: 'Unidade não encontrada',
    });
  }

  const servico = await prisma.pROD_Unidade_Servico.create({
    data: {
      id_unidade: parseInt(id_unidade),
      descricao,
      ordem: parseInt(ordem),
      ativo,
    },
  });

  await auditLog('pROD_Unidade_Servico', 'INSERT', servico.id, null, servico, req.user.id);

  logger.info('Serviço criado', {
    servico_id: servico.id,
    unidade_id: id_unidade,
    user_id: req.user.id,
  });

  res.status(201).json({
    success: true,
    data: servico,
  });
}));

/**
 * PUT /api/servicos/:id
 * Atualiza um serviço (admin)
 */
router.put('/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { descricao, ordem, ativo } = req.body;

  const servicoAntigo = await prisma.pROD_Unidade_Servico.findUnique({
    where: { id: parseInt(id) },
  });

  if (!servicoAntigo) {
    return res.status(404).json({
      success: false,
      error: 'Serviço não encontrado',
    });
  }

  const servicoNovo = await prisma.pROD_Unidade_Servico.update({
    where: { id: parseInt(id) },
    data: {
      ...(descricao !== undefined && { descricao }),
      ...(ordem !== undefined && { ordem: parseInt(ordem) }),
      ...(ativo !== undefined && { ativo }),
    },
  });

  await auditLog('pROD_Unidade_Servico', 'UPDATE', servicoNovo.id, servicoAntigo, servicoNovo, req.user.id);

  logger.info('Serviço atualizado', {
    servico_id: servicoNovo.id,
    user_id: req.user.id,
  });

  res.json({
    success: true,
    data: servicoNovo,
  });
}));

/**
 * DELETE /api/servicos/:id
 * Deleta um serviço (admin)
 */
router.delete('/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const servico = await prisma.pROD_Unidade_Servico.findUnique({
    where: { id: parseInt(id) },
  });

  if (!servico) {
    return res.status(404).json({
      success: false,
      error: 'Serviço não encontrado',
    });
  }

  await prisma.pROD_Unidade_Servico.delete({
    where: { id: parseInt(id) },
  });

  await auditLog('pROD_Unidade_Servico', 'DELETE', servico.id, servico, null, req.user.id);

  logger.info('Serviço deletado', {
    servico_id: servico.id,
    user_id: req.user.id,
  });

  res.json({
    success: true,
    message: 'Serviço deletado com sucesso',
  });
}));

module.exports = router;
