const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { requestLogger, errorLogger, logger } = require('@sigls/logger');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const stagingRoutes = require('./routes/staging.routes');
const unidadeRoutes = require('./routes/unidade.routes');
const medicoRoutes = require('./routes/medico.routes');
const especialidadeRoutes = require('./routes/especialidade.routes');
const bairroRoutes = require('./routes/bairro.routes');
const iconeRoutes = require('./routes/icone.routes');
const auditRoutes = require('./routes/audit.routes');
const etlRoutes = require('./routes/etl.routes');
const uploadRoutes = require('./routes/upload.routes');

const { errorHandler } = require('./middleware/error.middleware');

// ============================================================================
// EXPRESS APP SETUP
// ============================================================================

const app = express();
const PORT = process.env.API_PORT || 3001;

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "http://localhost:3001", "http://localhost:5173"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// CORS - aceitar múltiplas origens
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sem origin (como curl, postman, etc)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos da pasta uploads
app.use('/uploads', express.static(path.join(__dirname, '../../../uploads')));

// Request logging
app.use(requestLogger);

// ============================================================================
// ROUTES
// ============================================================================

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/staging', stagingRoutes);
app.use('/api/unidades', unidadeRoutes);
app.use('/api/medicos', medicoRoutes);
app.use('/api/especialidades', especialidadeRoutes);
app.use('/api/bairros', bairroRoutes);
app.use('/api/icones', iconeRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/etl', etlRoutes);
app.use('/api/upload', uploadRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use(errorLogger);
app.use(errorHandler);

// ============================================================================
// SERVER START
// ============================================================================

app.listen(PORT, () => {
  logger.info(`SIGLS API Server running on port ${PORT}`, {
    port: PORT,
    env: process.env.NODE_ENV || 'development',
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

module.exports = app;



