const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  const connection = await mysql.createConnection({
    host: '172.16.0.117',
    user: 'tableau',
    password: 'dose25_teq2',
    database: 'sigls_db'
  });

  try {
    console.log('Conectado ao banco de dados...');

    // Lê o arquivo SQL
    const migrationPath = path.join(__dirname, '..', 'packages', 'database', 'prisma', 'migrations', 'add_diretor_adjunto.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Aplicando migration:');
    console.log(sql);

    // Executa a migration
    await connection.query(sql);

    console.log('✅ Migration aplicada com sucesso!');

    // Verifica se a coluna foi criada
    const [columns] = await connection.query("DESCRIBE prod_unidade_saude");
    const diretorAdjunto = columns.find(col => col.Field === 'diretor_adjunto');

    if (diretorAdjunto) {
      console.log('✅ Coluna diretor_adjunto foi criada com sucesso:');
      console.log(diretorAdjunto);
    } else {
      console.log('❌ Coluna diretor_adjunto não foi encontrada!');
    }

  } catch (error) {
    console.error('❌ Erro ao aplicar migration:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

applyMigration()
  .then(() => {
    console.log('Processo concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erro:', error);
    process.exit(1);
  });
