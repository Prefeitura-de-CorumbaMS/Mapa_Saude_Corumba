/**
 * Verifica se a tabela vigilancia_dengue_caso existe
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { buildDatabaseUrl } = require('../packages/database/build-database-url');
const mysql = require('mysql2/promise');

async function checkTable() {
  const conn = await mysql.createConnection(buildDatabaseUrl());

  try {
    console.log('\n🔍 Verificando se a tabela vigilancia_dengue_caso existe...\n');

    const [rows] = await conn.execute(`
      SELECT COUNT(*) as existe
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      AND table_name = 'vigilancia_dengue_caso'
    `);

    if (rows[0].existe > 0) {
      console.log('✅ Tabela vigilancia_dengue_caso EXISTE no banco de dados\n');

      // Mostrar estrutura
      const [columns] = await conn.execute(`
        DESCRIBE vigilancia_dengue_caso
      `);

      console.log('📋 Estrutura da tabela:');
      console.table(columns);
    } else {
      console.log('❌ Tabela vigilancia_dengue_caso NÃO EXISTE no banco de dados\n');
      console.log('Você precisa executar a migration novamente.\n');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await conn.end();
  }
}

checkTable()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
