module.exports = {
  apps: [
    {
      name: 'mapasaude-api',
      cwd: '/home/elizael/Mapa_Saude_Corumba',
      script: 'apps/api/src/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
};
