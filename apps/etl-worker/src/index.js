const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
const cron = require('node-cron');
const { logger, etlLog } = require('@sigls/logger');
const { runETLPipeline } = require('./pipeline');

// ============================================================================
// ETL WORKER - Agendador e executor do pipeline ETL
// ============================================================================

const CRON_SCHEDULE = process.env.ETL_SCHEDULE_CRON || '0 2 * * *'; // Padrão: 2h da manhã

logger.info('ETL Worker starting', {
  schedule: CRON_SCHEDULE,
  env: process.env.NODE_ENV || 'development',
});

// Executar ETL imediatamente ao iniciar (apenas em desenvolvimento)
if (process.env.NODE_ENV === 'development' && process.env.ETL_RUN_ON_START === 'true') {
  logger.info('Running ETL immediately (development mode)');
  runETLPipeline().catch(error => {
    logger.error('ETL execution failed on startup', { error: error.message });
  });
}

// Agendar execução do ETL
cron.schedule(CRON_SCHEDULE, async () => {
  logger.info('ETL scheduled execution starting', {
    schedule: CRON_SCHEDULE,
    timestamp: new Date().toISOString(),
  });
  
  try {
    await runETLPipeline();
    logger.info('ETL scheduled execution completed successfully');
  } catch (error) {
    logger.error('ETL scheduled execution failed', {
      error: error.message,
      stack: error.stack,
    });
  }
});

logger.info('ETL Worker ready', {
  message: `ETL will run on schedule: ${CRON_SCHEDULE}`,
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: shutting down ETL Worker');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: shutting down ETL Worker');
  process.exit(0);
});
