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
        redes_sociais: true,
      },
      orderBy: { nome: 'asc' },
    }),
    prisma.pROD_Unidade_Saude.count({ where }),
  ]);

  // Transformar dados para incluir especialidades e redes sociais diretamente
  const unidadesFormatted = unidades.map(u => ({
    ...u,
    // Filtrar apenas especialidades ativas E visíveis para o usuário
    especialidades: u.especialidades
      .map(e => e.especialidade)
      .filter(e => e.ativo && e.visivel_para_usuario),
    redes_sociais: u.redes_sociais,
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
      redes_sociais: true,
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
      // Filtrar apenas especialidades ativas E visíveis para o usuário
      especialidades: unidade.especialidades
        .map(e => e.especialidade)
        .filter(e => e.ativo && e.visivel_para_usuario),
      redes_sociais: unidade.redes_sociais,
    },
  });
}));

/**
 * POST /api/unidades
 * Cria nova unidade (requer autenticação)
 */
router.post('/', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { nome, endereco, bairro, latitude, longitude, telefone, whatsapp, enfermeiro_responsavel, horario_atendimento, sala_vacina, id_origem, especialidades = [], medicos = [] } = req.body;

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
      bairro,
      latitude,
      longitude,
      telefone,
      whatsapp,
      enfermeiro_responsavel,
      horario_atendimento,
      sala_vacina: sala_vacina || false,
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

  // Adicionar médicos se fornecidos
  if (medicos.length > 0) {
    await prisma.junction_Unidade_Medico.createMany({
      data: medicos.map(medico_id => ({
        id_unidade: unidade.id,
        id_medico: medico_id,
      })),
    });

    // Calcular automaticamente as especialidades oferecidas baseado nos médicos da equipe
    const medicosComEspecialidades = await prisma.pROD_Medico.findMany({
      where: { id: { in: medicos } },
      include: {
        especialidades: {
          include: {
            especialidade: true, // Incluir dados completos da especialidade para filtrar
          },
        },
      },
    });

    // Obter IDs únicos de especialidades dos médicos (apenas visíveis para usuário)
    const especialidadesUnicas = new Set();
    medicosComEspecialidades.forEach(medico => {
      medico.especialidades.forEach(esp => {
        // Filtrar apenas especialidades ativas E visíveis para o usuário
        if (esp.especialidade.ativo && esp.especialidade.visivel_para_usuario) {
          especialidadesUnicas.add(esp.id_especialidade);
        }
      });
    });

    // Adicionar especialidades oferecidas automaticamente
    if (especialidadesUnicas.size > 0) {
      await prisma.junction_Unidade_Especialidade.createMany({
        data: Array.from(especialidadesUnicas).map(esp_id => ({
          id_unidade: unidade.id,
          id_especialidade: esp_id,
        })),
      });
    }
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
  const { nome, endereco, bairro, latitude, longitude, telefone, whatsapp, enfermeiro_responsavel, horario_atendimento, sala_vacina, ativo, imagem_url, icone_url, especialidades, medicos } = req.body;

  const updateData = {};
  if (nome) updateData.nome = nome;
  if (endereco !== undefined) updateData.endereco = endereco;
  if (bairro !== undefined) updateData.bairro = bairro;
  if (latitude !== undefined) updateData.latitude = latitude;
  if (longitude !== undefined) updateData.longitude = longitude;
  if (telefone !== undefined) updateData.telefone = telefone;
  if (whatsapp !== undefined) updateData.whatsapp = whatsapp;
  if (enfermeiro_responsavel !== undefined) updateData.enfermeiro_responsavel = enfermeiro_responsavel;
  if (horario_atendimento !== undefined) updateData.horario_atendimento = horario_atendimento;
  if (typeof sala_vacina === 'boolean') updateData.sala_vacina = sala_vacina;
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

  // Atualizar médicos se fornecidos
  if (medicos !== undefined) {
    // Remover médicos antigos
    await prisma.junction_Unidade_Medico.deleteMany({
      where: { id_unidade: parseInt(id) },
    });

    // Remover especialidades antigas (serão recalculadas baseado nos médicos)
    await prisma.junction_Unidade_Especialidade.deleteMany({
      where: { id_unidade: parseInt(id) },
    });

    // Adicionar novos médicos
    if (medicos.length > 0) {
      await prisma.junction_Unidade_Medico.createMany({
        data: medicos.map(medico_id => ({
          id_unidade: parseInt(id),
          id_medico: medico_id,
        })),
      });

      // Calcular automaticamente as especialidades oferecidas baseado nos médicos da equipe
      const medicosComEspecialidades = await prisma.pROD_Medico.findMany({
        where: { id: { in: medicos } },
        include: {
          especialidades: {
            include: {
              especialidade: true, // Incluir dados completos da especialidade para filtrar
            },
          },
        },
      });

      // Obter IDs únicos de especialidades dos médicos (apenas visíveis para usuário)
      const especialidadesUnicas = new Set();
      medicosComEspecialidades.forEach(medico => {
        medico.especialidades.forEach(esp => {
          // Filtrar apenas especialidades ativas E visíveis para o usuário
          if (esp.especialidade.ativo && esp.especialidade.visivel_para_usuario) {
            especialidadesUnicas.add(esp.id_especialidade);
          }
        });
      });

      // Adicionar especialidades oferecidas automaticamente
      if (especialidadesUnicas.size > 0) {
        await prisma.junction_Unidade_Especialidade.createMany({
          data: Array.from(especialidadesUnicas).map(esp_id => ({
            id_unidade: parseInt(id),
            id_especialidade: esp_id,
          })),
        });
      }
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
 * GET /api/unidades/bairros/list
 * Lista todos os bairros cadastrados (público)
 */
router.get('/bairros/list', asyncHandler(async (req, res) => {
  const bairros = await prisma.pROD_Bairro.findMany({
    where: { ativo: true },
    select: { nome: true },
    orderBy: { nome: 'asc' },
  });

  // Retornar apenas os nomes
  const bairrosNomes = bairros.map(b => b.nome);

  res.json({
    success: true,
    data: bairrosNomes,
  });
}));

/**
 * GET /api/unidades/stats/last-update
 * Retorna a data da última atualização das unidades (público)
 */
router.get('/stats/last-update', asyncHandler(async (req, res) => {
  // Buscar o último registro de UPDATE na tabela PROD_Unidade_Saude
  const lastUpdate = await prisma.aUDIT_LOG.findFirst({
    where: {
      tabela: 'PROD_Unidade_Saude',
      operacao: 'UPDATE',
    },
    orderBy: {
      timestamp: 'desc',
    },
    select: {
      timestamp: true,
    },
  });

  res.json({
    success: true,
    data: {
      lastUpdate: lastUpdate?.timestamp || null,
    },
  });
}));

/**
 * GET /api/unidades/:id/medicos
 * Busca médicos que atendem em uma unidade (baseado na relação direta unidade-médico)
 */
router.get('/:id/medicos', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Buscar médicos que atendem nesta unidade através da junction table
  const junctionRecords = await prisma.junction_Unidade_Medico.findMany({
    where: { id_unidade: parseInt(id) },
    include: {
      medico: {
        include: {
          especialidades: {
            include: {
              especialidade: true,
            },
          },
        },
      },
    },
  });

  // Filtrar apenas médicos ativos e formatar dados
  const medicosAtivos = junctionRecords
    .map(j => j.medico)
    .filter(m => m.ativo)
    .map(m => ({
      ...m,
      // Filtrar apenas especialidades ativas E visíveis para o usuário
      especialidades: m.especialidades
        .map(e => e.especialidade)
        .filter(e => e.ativo && e.visivel_para_usuario),
    }));

  // Ordenar por nome
  medicosAtivos.sort((a, b) => a.nome.localeCompare(b.nome));

  res.json({
    success: true,
    data: medicosAtivos,
  });
}));

/**
 * GET /api/unidades/:id/redes-sociais
 * Busca redes sociais de uma unidade
 */
router.get('/:id/redes-sociais', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const redesSociais = await prisma.pROD_Unidade_RedeSocial.findMany({
    where: { id_unidade: parseInt(id) },
    orderBy: { created_at: 'asc' },
  });

  res.json({
    success: true,
    data: redesSociais,
  });
}));

/**
 * POST /api/unidades/:id/redes-sociais
 * Adiciona rede social a uma unidade (requer autenticação)
 */
router.post('/:id/redes-sociais', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nome_rede, url_perfil } = req.body;

  if (!nome_rede || !url_perfil) {
    return res.status(400).json({
      success: false,
      error: 'nome_rede and url_perfil are required',
    });
  }

  // Verificar se a unidade existe
  const unidade = await prisma.pROD_Unidade_Saude.findUnique({
    where: { id: parseInt(id) },
  });

  if (!unidade) {
    return res.status(404).json({
      success: false,
      error: 'Unidade not found',
    });
  }

  // Verificar se já não existe uma rede social com o mesmo nome para esta unidade
  const existingRede = await prisma.pROD_Unidade_RedeSocial.findFirst({
    where: {
      id_unidade: parseInt(id),
      nome_rede: nome_rede,
    },
  });

  if (existingRede) {
    return res.status(400).json({
      success: false,
      error: 'Esta rede social já está cadastrada para esta unidade',
    });
  }

  // Verificar limite de 3 redes sociais por unidade
  const totalRedes = await prisma.pROD_Unidade_RedeSocial.count({
    where: { id_unidade: parseInt(id) },
  });

  if (totalRedes >= 3) {
    return res.status(400).json({
      success: false,
      error: 'Limite máximo de 3 redes sociais por unidade atingido',
    });
  }

  const redeSocial = await prisma.pROD_Unidade_RedeSocial.create({
    data: {
      id_unidade: parseInt(id),
      nome_rede,
      url_perfil,
    },
  });

  auditLog('INSERT', 'PROD_Unidade_RedeSocial', redeSocial.id, req.user.id, req.user.role);

  logger.info('Rede social added to unidade', {
    user_id: req.user.id,
    unidade_id: parseInt(id),
    rede_social_id: redeSocial.id,
    nome_rede: nome_rede,
  });

  res.status(201).json({
    success: true,
    data: redeSocial,
  });
}));

/**
 * PUT /api/unidades/:id/redes-sociais/:redeId
 * Atualiza rede social de uma unidade (requer autenticação)
 */
router.put('/:id/redes-sociais/:redeId', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id, redeId } = req.params;
  const { nome_rede, url_perfil } = req.body;

  if (!nome_rede || !url_perfil) {
    return res.status(400).json({
      success: false,
      error: 'nome_rede and url_perfil are required',
    });
  }

  // Verificar se a rede social existe e pertence à unidade
  const redeSocial = await prisma.pROD_Unidade_RedeSocial.findFirst({
    where: {
      id: parseInt(redeId),
      id_unidade: parseInt(id),
    },
  });

  if (!redeSocial) {
    return res.status(404).json({
      success: false,
      error: 'Rede social not found for this unidade',
    });
  }

  // Verificar se já não existe outra rede social com o mesmo nome para esta unidade (exceto a atual)
  if (nome_rede !== redeSocial.nome_rede) {
    const existingRede = await prisma.pROD_Unidade_RedeSocial.findFirst({
      where: {
        id_unidade: parseInt(id),
        nome_rede: nome_rede,
        id: { not: parseInt(redeId) },
      },
    });

    if (existingRede) {
      return res.status(400).json({
        success: false,
        error: 'Esta rede social já está cadastrada para esta unidade',
      });
    }
  }

  const updatedRede = await prisma.pROD_Unidade_RedeSocial.update({
    where: { id: parseInt(redeId) },
    data: {
      nome_rede,
      url_perfil,
    },
  });

  auditLog('UPDATE', 'PROD_Unidade_RedeSocial', parseInt(redeId), req.user.id, req.user.role);

  logger.info('Rede social updated for unidade', {
    user_id: req.user.id,
    unidade_id: parseInt(id),
    rede_social_id: parseInt(redeId),
    nome_rede: nome_rede,
  });

  res.json({
    success: true,
    data: updatedRede,
  });
}));

/**
 * DELETE /api/unidades/:id/redes-sociais/:redeId
 * Remove rede social de uma unidade (requer autenticação)
 */
router.delete('/:id/redes-sociais/:redeId', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id, redeId } = req.params;

  // Verificar se a rede social existe e pertence à unidade
  const redeSocial = await prisma.pROD_Unidade_RedeSocial.findFirst({
    where: {
      id: parseInt(redeId),
      id_unidade: parseInt(id),
    },
  });

  if (!redeSocial) {
    return res.status(404).json({
      success: false,
      error: 'Rede social not found for this unidade',
    });
  }

  await prisma.pROD_Unidade_RedeSocial.delete({
    where: { id: parseInt(redeId) },
  });

  auditLog('DELETE', 'PROD_Unidade_RedeSocial', parseInt(redeId), req.user.id, req.user.role);

  logger.info('Rede social deleted from unidade', {
    user_id: req.user.id,
    unidade_id: parseInt(id),
    rede_social_id: parseInt(redeId),
  });

  res.json({
    success: true,
    message: 'Rede social deleted successfully',
  });
}));

module.exports = router;
