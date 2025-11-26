const express = require('express');
const { prisma } = require('@sigls/database');
const { logger, auditLog } = require('@sigls/logger');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

// ============================================================================
// UNIDADE SAÚDE ROUTES
// ============================================================================

/**
 * GET /api/unidades
 * Lista todas as unidades de saúde (público)
 */
router.get('/', asyncHandler(async (req, res) => {
  const { ativo = 'true', page = 1, limit = 100 } = req.query;
  
  const where = {};
  if (ativo === 'true') {
    where.ativo = true;
  }
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [unidades, total] = await Promise.all([
    prisma.pROD_Unidade_Saude.findMany({
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
    prisma.pROD_Unidade_Saude.count({ where }),
  ]);
  
  // Transformar dados para incluir especialidades diretamente
  const unidadesFormatted = unidades.map(u => ({
    ...u,
    especialidades: u.especialidades.map(e => e.especialidade),
  }));
  
  res.json({
    success: true,
    data: unidadesFormatted,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
}));

/**
 * GET /api/unidades/:id
 * Busca unidade por ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const unidade = await prisma.pROD_Unidade_Saude.findUnique({
    where: { id: parseInt(id) },
    include: {
      especialidades: {
        include: {
          especialidade: true,
        },
      },
    },
  });
  
  if (!unidade) {
    return res.status(404).json({
      success: false,
      error: 'Unidade not found',
    });
  }
  
  res.json({
    success: true,
    data: {
      ...unidade,
      especialidades: unidade.especialidades.map(e => e.especialidade),
    },
  });
}));

/**
 * POST /api/unidades
 * Cria nova unidade (requer autenticação)
 */
router.post('/', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { nome, endereco, latitude, longitude, id_origem, especialidades = [] } = req.body;
  
  if (!nome || latitude === undefined || longitude === undefined || !id_origem) {
    return res.status(400).json({
      success: false,
      error: 'Nome, latitude, longitude and id_origem are required',
    });
  }
  
  // Criar unidade
  const unidade = await prisma.pROD_Unidade_Saude.create({
    data: {
      nome,
      endereco,
      latitude,
      longitude,
      id_origem,
    },
  });
  
  // Adicionar especialidades se fornecidas
  if (especialidades.length > 0) {
    await prisma.junction_Unidade_Especialidade.createMany({
      data: especialidades.map(esp_id => ({
        id_unidade: unidade.id,
        id_especialidade: esp_id,
      })),
    });
  }
  
  auditLog('CREATE', 'PROD_Unidade_Saude', unidade.id, req.user.id, req.user.role);
  
  logger.info('Unidade created', {
    user_id: req.user.id,
    unidade_id: unidade.id,
    nome: unidade.nome,
  });
  
  res.status(201).json({
    success: true,
    data: unidade,
  });
}));

/**
 * PUT /api/unidades/:id
 * Atualiza unidade (requer autenticação)
 */
router.put('/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nome, endereco, latitude, longitude, ativo, imagem_url, icone_url, especialidades } = req.body;

  const updateData = {};
  if (nome) updateData.nome = nome;
  if (endereco !== undefined) updateData.endereco = endereco;
  if (latitude !== undefined) updateData.latitude = latitude;
  if (longitude !== undefined) updateData.longitude = longitude;
  if (typeof ativo === 'boolean') updateData.ativo = ativo;
  if (imagem_url !== undefined) updateData.imagem_url = imagem_url;
  if (icone_url !== undefined) updateData.icone_url = icone_url;
  
  const unidade = await prisma.pROD_Unidade_Saude.update({
    where: { id: parseInt(id) },
    data: updateData,
  });
  
  // Atualizar especialidades se fornecidas
  if (especialidades !== undefined) {
    // Remover especialidades antigas
    await prisma.junction_Unidade_Especialidade.deleteMany({
      where: { id_unidade: parseInt(id) },
    });
    
    // Adicionar novas especialidades
    if (especialidades.length > 0) {
      await prisma.junction_Unidade_Especialidade.createMany({
        data: especialidades.map(esp_id => ({
          id_unidade: parseInt(id),
          id_especialidade: esp_id,
        })),
      });
    }
  }
  
  auditLog('UPDATE', 'PROD_Unidade_Saude', parseInt(id), req.user.id, req.user.role, {
    updated_fields: Object.keys(updateData),
  });
  
  logger.info('Unidade updated', {
    user_id: req.user.id,
    unidade_id: parseInt(id),
    updated_fields: Object.keys(updateData),
  });
  
  res.json({
    success: true,
    data: unidade,
  });
}));

/**
 * GET /api/unidades/:id/medicos
 * Busca médicos que atendem em uma unidade (baseado em especialidades em comum)
 */
router.get('/:id/medicos', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Buscar especialidades da unidade
  const unidadeEspecialidades = await prisma.junction_Unidade_Especialidade.findMany({
    where: { id_unidade: parseInt(id) },
    select: { id_especialidade: true },
  });

  const especialidadeIds = unidadeEspecialidades.map(e => e.id_especialidade);

  if (especialidadeIds.length === 0) {
    return res.json({
      success: true,
      data: [],
    });
  }

  // Buscar médicos que têm essas especialidades
  const medicos = await prisma.pROD_Medico.findMany({
    where: {
      ativo: true,
      especialidades: {
        some: {
          id_especialidade: {
            in: especialidadeIds,
          },
        },
      },
    },
    include: {
      especialidades: {
        include: {
          especialidade: true,
        },
      },
    },
    orderBy: { nome: 'asc' },
  });

  // Formatar dados
  const medicosFormatted = medicos.map(m => ({
    ...m,
    especialidades: m.especialidades.map(e => e.especialidade),
  }));

  res.json({
    success: true,
    data: medicosFormatted,
  });
}));

/**
 * DELETE /api/unidades/:id
 * Deleta unidade (requer autenticação)
 */
router.delete('/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  await prisma.pROD_Unidade_Saude.delete({
    where: { id: parseInt(id) },
  });

  auditLog('DELETE', 'PROD_Unidade_Saude', parseInt(id), req.user.id, req.user.role);

  logger.info('Unidade deleted', {
    user_id: req.user.id,
    unidade_id: parseInt(id),
  });

  res.json({
    success: true,
    message: 'Unidade deleted successfully',
  });
}));

module.exports = router;
