const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { buildDatabaseUrl } = require('../packages/database/build-database-url');
const mysql = require('mysql2/promise');

async function applyMigration() {
  const conn = await mysql.createConnection(buildDatabaseUrl());

  try {
    console.log('\n' + '='.repeat(80));
    console.log('APLICANDO MIGRATION: ADD_UNIDADE_SERVICOS');
    console.log('='.repeat(80));
    console.log();

    // Ler o arquivo SQL da migration
    const migrationPath = path.join(__dirname, '../packages/database/prisma/migrations/20251219124953_add_unidade_servicos/migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Executar cada comando SQL separadamente
    const sqlCommands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    for (const sqlCommand of sqlCommands) {
      console.log('Executando:', sqlCommand.substring(0, 80) + '...');
      await conn.execute(sqlCommand);
      console.log('✓ Executado com sucesso\n');
    }

    console.log('='.repeat(80));
    console.log('✓ Migration aplicada com sucesso!');
    console.log('='.repeat(80));
    console.log();

  } catch (error) {
    console.error('\n❌ Erro ao aplicar migration:', error.message);
    throw error;
  } finally {
    await conn.end();
  }
}

applyMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
