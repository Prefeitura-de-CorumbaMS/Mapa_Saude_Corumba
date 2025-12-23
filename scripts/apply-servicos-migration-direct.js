const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { buildDatabaseUrl } = require('../packages/database/build-database-url');
const mysql = require('mysql2/promise');

async function applyMigration() {
  const conn = await mysql.createConnection(buildDatabaseUrl());

  try {
    console.log('\n' + '='.repeat(80));
    console.log('APLICANDO MIGRATION: CREATE TABLE prod_unidade_servico');
    console.log('='.repeat(80));
    console.log();

    // Executar a SQL da migration
    await conn.execute(`
      CREATE TABLE prod_unidade_servico (
        id INTEGER NOT NULL AUTO_INCREMENT,
        id_unidade INTEGER NOT NULL,
        descricao VARCHAR(500) NOT NULL,
        ordem INTEGER NOT NULL DEFAULT 0,
        ativo BOOLEAN NOT NULL DEFAULT true,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        INDEX prod_unidade_servico_id_unidade_idx (id_unidade),
        INDEX prod_unidade_servico_ordem_idx (ordem),
        INDEX prod_unidade_servico_ativo_idx (ativo),
        FOREIGN KEY (id_unidade) REFERENCES prod_unidade_saude(id) ON DELETE CASCADE ON UPDATE CASCADE
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

    console.log('✓ Tabela prod_unidade_servico criada com sucesso!');
    console.log('='.repeat(80));
    console.log();

  } catch (error) {
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('⚠ Tabela prod_unidade_servico já existe!');
    } else {
      console.error('\n❌ Erro ao aplicar migration:', error.message);
      throw error;
    }
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