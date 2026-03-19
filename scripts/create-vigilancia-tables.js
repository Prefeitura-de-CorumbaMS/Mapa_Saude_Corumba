// Script temporário para criar tabelas de vigilância
// Executar com: node scripts/create-vigilancia-tables.js

const mysql = require('mysql2/promise');
require('dotenv').config();

async function createVigilanciaTables() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '172.16.0.117',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'tableau',
    password: process.env.DB_PASSWORD || 'dose25_teq2',
    database: process.env.DB_NAME || 'sigls_db',
  });

  console.log('✓ Conectado ao banco de dados MySQL');

  try {
    // Tabela principal de Semana Epidemiológica
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`vigilancia_dengue_se\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`ano\` INT NOT NULL,
        \`semana_epidemiologica\` INT NOT NULL,
        \`casos_notificados\` INT NOT NULL DEFAULT 0,
        \`casos_confirmados\` INT NOT NULL DEFAULT 0,
        \`sorotipo_tipo1\` INT NOT NULL DEFAULT 0,
        \`sorotipo_tipo2\` INT NOT NULL DEFAULT 0,
        \`sorotipo_tipo3\` INT NOT NULL DEFAULT 0,
        \`sorotipo_tipo4\` INT NOT NULL DEFAULT 0,
        \`isolamentos_virais\` INT NOT NULL DEFAULT 0,
        \`obitos\` INT NOT NULL DEFAULT 0,
        \`fonte\` VARCHAR(100) NULL,
        \`data_publicacao\` DATETIME NULL,
        \`observacoes\` TEXT NULL,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`vigilancia_dengue_se_ano_semana_epidemiologica_key\` (\`ano\`, \`semana_epidemiologica\`),
        INDEX \`vigilancia_dengue_se_ano_idx\` (\`ano\`),
        INDEX \`vigilancia_dengue_se_semana_epidemiologica_idx\` (\`semana_epidemiologica\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ Tabela vigilancia_dengue_se criada');

    // Tabela de perfil demográfico
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`vigilancia_dengue_perfil\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`ano\` INT NOT NULL,
        \`semana_epidemiologica\` INT NOT NULL,
        \`faixa_etaria\` VARCHAR(20) NOT NULL,
        \`sexo\` VARCHAR(1) NOT NULL,
        \`casos\` INT NOT NULL DEFAULT 0,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`dengue_se_id\` INT NOT NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`vigilancia_dengue_perfil_ano_semana_epidemiologica_idx\` (\`ano\`, \`semana_epidemiologica\`),
        INDEX \`vigilancia_dengue_perfil_dengue_se_id_idx\` (\`dengue_se_id\`),
        FOREIGN KEY (\`dengue_se_id\`) REFERENCES \`vigilancia_dengue_se\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ Tabela vigilancia_dengue_perfil criada');

    // Tabela de distribuição por bairro
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`vigilancia_dengue_bairro\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`ano\` INT NOT NULL,
        \`semana_epidemiologica\` INT NOT NULL,
        \`bairro\` VARCHAR(100) NOT NULL,
        \`notificados\` INT NOT NULL DEFAULT 0,
        \`confirmados\` INT NOT NULL DEFAULT 0,
        \`latitude\` DECIMAL(10, 8) NULL,
        \`longitude\` DECIMAL(11, 8) NULL,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`dengue_se_id\` INT NOT NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`vigilancia_dengue_bairro_ano_semana_epidemiologica_idx\` (\`ano\`, \`semana_epidemiologica\`),
        INDEX \`vigilancia_dengue_bairro_bairro_idx\` (\`bairro\`),
        INDEX \`vigilancia_dengue_bairro_dengue_se_id_idx\` (\`dengue_se_id\`),
        FOREIGN KEY (\`dengue_se_id\`) REFERENCES \`vigilancia_dengue_se\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ Tabela vigilancia_dengue_bairro criada');

    console.log('\n✅ Todas as tabelas de vigilância foram criadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

createVigilanciaTables()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
