require('dotenv').config();
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
const auditRoutes = require('./routes/audit.routes');
const etlRoutes = require('./routes/etl.routes');

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
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use('/api/audit', auditRoutes);
app.use('/api/etl', etlRoutes);

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
