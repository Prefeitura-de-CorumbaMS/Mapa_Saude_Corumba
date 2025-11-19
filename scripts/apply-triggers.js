require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function applyTriggers() {
  let connection = null;
  
  try {
    console.log('\n=== Aplicando Triggers de Auditoria ===\n');
    
    // Verificar se DATABASE_URL está configurado
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL não encontrado no arquivo .env');
    }
    
    // Importar mysql2 dinamicamente
    let mysql;
    try {
      mysql = require('mysql2/promise');
    } catch (error) {
      throw new Error('mysql2 não está instalado. Execute: npm install mysql2');
    }
    
    // Conectar ao banco
    console.log('1. Conectando ao banco de dados...');
    console.log(`   URL: ${process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@')}`);
    connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log('✅ Conectado!\n');
    
    // Ler arquivo de triggers
    console.log('2. Lendo arquivo de triggers...');
    const triggersPath = path.join(__dirname, '..', 'packages', 'database', 'prisma', 'triggers.sql');
    const triggersSQL = fs.readFileSync(triggersPath, 'utf8');
    console.log('✅ Arquivo lido!\n');
    
    // Separar os comandos (split por DELIMITER ;)
    console.log('3. Aplicando triggers...');
    
    // Remover comentários e linhas vazias
    const lines = triggersSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim() !== '');
    
    let currentSQL = '';
    let delimiter = ';';
    let triggerCount = 0;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Detectar mudança de delimiter
      if (trimmedLine.startsWith('DELIMITER')) {
        const newDelimiter = trimmedLine.split(' ')[1];
        if (newDelimiter) {
          delimiter = newDelimiter;
        }
        continue;
      }
      
      currentSQL += line + '\n';
      
      // Se encontrou o delimiter atual, executar
      if (trimmedLine.endsWith(delimiter)) {
        // Remover o delimiter do final
        const sqlToExecute = currentSQL.replace(new RegExp(delimiter + '\\s*$'), '').trim();
        
        if (sqlToExecute) {
          try {
            // Verificar se é um DROP TRIGGER (para recriar)
            if (sqlToExecute.toUpperCase().includes('CREATE TRIGGER')) {
              const triggerName = sqlToExecute.match(/CREATE TRIGGER\s+(\w+)/i)?.[1];
              
              // Tentar dropar o trigger se já existir
              if (triggerName) {
                try {
                  await connection.query(`DROP TRIGGER IF EXISTS ${triggerName}`);
                } catch (e) {
                  // Ignorar erro se trigger não existir
                }
              }
              
              await connection.query(sqlToExecute);
              triggerCount++;
              console.log(`   ✅ Trigger criado: ${triggerName}`);
            }
          } catch (error) {
            console.error(`   ❌ Erro ao executar SQL:`, error.message);
            console.error(`   SQL: ${sqlToExecute.substring(0, 100)}...`);
          }
        }
        
        currentSQL = '';
      }
    }
    
    console.log(`\n✅ ${triggerCount} triggers aplicados com sucesso!\n`);
    
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

applyTriggers();
