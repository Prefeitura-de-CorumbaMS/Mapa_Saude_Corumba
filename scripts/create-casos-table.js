/**
 * Script para criar tabela vigilancia_dengue_caso com verificação
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { buildDatabaseUrl } = require('../packages/database/build-database-url');
const mysql = require('mysql2/promise');

async function createTable() {
  const conn = await mysql.createConnection(buildDatabaseUrl());

  try {
    console.log('\n' + '='.repeat(80));
    console.log('CRIANDO TABELA: vigilancia_dengue_caso');
    console.log('='.repeat(80) + '\n');

    // 1. Verificar se já existe
    console.log('📋 Verificando se a tabela já existe...');
    const [check] = await conn.execute(`
      SELECT COUNT(*) as existe
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      AND table_name = 'vigilancia_dengue_caso'
    `);

    if (check[0].existe > 0) {
      console.log('⚠️  Tabela já existe! Removendo...\n');
      await conn.execute('DROP TABLE vigilancia_dengue_caso');
      console.log('✓ Tabela antiga removida\n');
    } else {
      console.log('✓ Tabela não existe. Prosseguindo...\n');
    }

    // 2. Criar tabela
    console.log('📝 Criando tabela vigilancia_dengue_caso...');
    await conn.execute(`
      CREATE TABLE vigilancia_dengue_caso (
        id INTEGER NOT NULL AUTO_INCREMENT,
        ano INTEGER NOT NULL,
        numero_caso VARCHAR(20) NULL,

        unidade VARCHAR(200) NULL,
        sinan VARCHAR(50) NULL,
        data_notificacao DATETIME(3) NULL,
        data_sintomas DATETIME(3) NULL,

        paciente VARCHAR(200) NOT NULL,
        data_nascimento DATETIME(3) NULL,
        sexo VARCHAR(1) NULL,

        endereco VARCHAR(500) NULL,
        bairro VARCHAR(100) NULL,

        semana_epidemiologica INTEGER NOT NULL,

        observacoes TEXT NULL,

        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

        PRIMARY KEY (id)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
    console.log('✓ Tabela criada com sucesso\n');

    // 3. Criar índices
    console.log('📊 Criando índices...');

    await conn.execute('CREATE INDEX vigilancia_dengue_caso_ano_idx ON vigilancia_dengue_caso(ano)');
    console.log('  ✓ Índice: ano');

    await conn.execute('CREATE INDEX vigilancia_dengue_caso_semana_epidemiologica_idx ON vigilancia_dengue_caso(semana_epidemiologica)');
    console.log('  ✓ Índice: semana_epidemiologica');

    await conn.execute('CREATE INDEX vigilancia_dengue_caso_ano_semana_epidemiologica_idx ON vigilancia_dengue_caso(ano, semana_epidemiologica)');
    console.log('  ✓ Índice: ano + semana_epidemiologica');

    await conn.execute('CREATE INDEX vigilancia_dengue_caso_bairro_idx ON vigilancia_dengue_caso(bairro)');
    console.log('  ✓ Índice: bairro');

    await conn.execute('CREATE INDEX vigilancia_dengue_caso_data_notificacao_idx ON vigilancia_dengue_caso(data_notificacao)');
    console.log('  ✓ Índice: data_notificacao\n');

    // 4. Verificar criação
    console.log('🔍 Verificando estrutura criada...');
    const [columns] = await conn.execute('DESCRIBE vigilancia_dengue_caso');
    console.log(`✓ Tabela criada com ${columns.length} colunas\n`);

    console.log('='.repeat(80));
    console.log('✅ TABELA CRIADA COM SUCESSO!');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    await conn.end();
  }
}

createTable()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
