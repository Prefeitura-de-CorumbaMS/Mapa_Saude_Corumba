/**
 * Script para aplicar a migração da tabela analytics_event
 * e regenerar o cliente Prisma.
 *
 * Uso: node scripts/apply-analytics-migration.js
 */

const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const { execSync } = require('child_process')
const mysql = require('mysql2/promise')

async function main() {
  console.log('=== Aplicando migração analytics_event ===\n')

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  })

  try {
    // Verificar se a tabela já existe
    const [rows] = await connection.execute(
      `SELECT COUNT(*) as count FROM information_schema.tables
       WHERE table_schema = ? AND table_name = 'analytics_event'`,
      [process.env.DB_NAME]
    )

    if (rows[0].count > 0) {
      console.log('✅ Tabela analytics_event já existe — nada a fazer.')
    } else {
      console.log('📦 Criando tabela analytics_event...')
      await connection.execute(`
        CREATE TABLE \`analytics_event\` (
          \`id\`         INT AUTO_INCREMENT NOT NULL,
          \`tipo\`       VARCHAR(100) NOT NULL,
          \`dados\`      TEXT NULL,
          \`ip_hash\`    VARCHAR(64) NULL,
          \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          PRIMARY KEY (\`id\`),
          INDEX \`analytics_event_tipo_idx\` (\`tipo\`),
          INDEX \`analytics_event_created_at_idx\` (\`created_at\`),
          INDEX \`analytics_event_tipo_created_at_idx\` (\`tipo\`, \`created_at\`)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
      `)
      console.log('✅ Tabela analytics_event criada com sucesso!')
    }
  } finally {
    await connection.end()
  }

  // Regenerar cliente Prisma
  console.log('\n🔄 Regenerando cliente Prisma...')
  execSync('npm run db:generate', {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
  })
  console.log('✅ Cliente Prisma regenerado!\n')
  console.log('=== Migração concluída ===')
}

main().catch((err) => {
  console.error('Erro ao aplicar migração:', err)
  process.exit(1)
})
