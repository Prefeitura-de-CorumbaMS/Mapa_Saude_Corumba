const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { logger } = require('@sigls/logger');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

// ============================================================================
// CONFIGURAÇÃO DO MULTER
// ============================================================================

// Garantir que a pasta uploads/unidades existe
const uploadsDir = path.join(__dirname, '../../../../uploads/unidades');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  logger.info('Created uploads directory', { path: uploadsDir });
}

// Configuração de armazenamento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Gerar nome único: timestamp-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '-');
    cb(null, sanitizedName + '-' + uniqueSuffix + ext);
  }
});

// Filtro de tipos de arquivo (apenas imagens)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido. Apenas JPG, PNG e WEBP são aceitos.'), false);
  }
};

// Configuração do multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  }
});

// ============================================================================
// ROTAS DE UPLOAD
// ============================================================================

/**
 * POST /api/upload/unidade-imagem
 * Upload de imagem de unidade de saúde
 * Requer autenticação (Admin)
 */
router.post('/unidade-imagem', authenticate, requireAdmin, (req, res) => {
  const uploadSingle = upload.single('imagem');

  uploadSingle(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Erros do Multer
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'Arquivo muito grande. Tamanho máximo: 2MB',
        });
      }

      logger.error('Multer error during upload', {
        error: err.message,
        code: err.code,
        user_id: req.user.id,
      });

      return res.status(400).json({
        success: false,
        error: `Erro no upload: ${err.message}`,
      });

    } else if (err) {
      // Outros erros
      logger.error('Upload error', {
        error: err.message,
        user_id: req.user.id,
      });

      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }

    // Upload bem-sucedido
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum arquivo foi enviado',
      });
    }

    // Construir URL relativa para o arquivo
    const imageUrl = `/uploads/unidades/${req.file.filename}`;

    logger.info('Image uploaded successfully', {
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      user_id: req.user.id,
      url: imageUrl,
    });

    res.json({
      success: true,
      message: 'Upload realizado com sucesso',
      data: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: imageUrl,
      },
    });
  });
});

/**
 * DELETE /api/upload/unidade-imagem/:filename
 * Deleta uma imagem de unidade
 * Requer autenticação (Admin)
 */
router.delete('/unidade-imagem/:filename', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { filename } = req.params;

  // Validar filename (evitar path traversal)
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({
      success: false,
      error: 'Nome de arquivo inválido',
    });
  }

  const filePath = path.join(uploadsDir, filename);

  // Verificar se arquivo existe
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      error: 'Arquivo não encontrado',
    });
  }

  // Deletar arquivo
  fs.unlinkSync(filePath);

  logger.info('Image deleted', {
    filename,
    user_id: req.user.id,
  });

  res.json({
    success: true,
    message: 'Imagem deletada com sucesso',
  });
}));

module.exports = router;
