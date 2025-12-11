/**
 * Script para verificar e corrigir DEFINERs no banco de dados
 * Remove definers antigos que impedem updates
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function corrigirDefiners() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║           CORREÇÃO DE DEFINERS NO BANCO DE DADOS             ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  try {
    console.log('🔍 Verificando triggers com DEFINER antigo...\n');

    // Listar todos os triggers
    const [triggers] = await connection.query(`
      SELECT 
        TRIGGER_NAME,
        EVENT_OBJECT_TABLE,
        DEFINER,
        ACTION_TIMING,
        EVENT_MANIPULATION,
        ACTION_STATEMENT
      FROM information_schema.TRIGGERS
      WHERE TRIGGER_SCHEMA = ?
    `, [process.env.DB_NAME]);

    console.log(`📋 ${triggers.length} trigger(s) encontrado(s):\n`);

    // Lista de definers conhecidamente problemáticos
    const definersProblematicos = ['elizaelramos@localhost', 'sigls_user@localhost'];
    
    const triggersComProblema = triggers.filter(t => 
      t.DEFINER && definersProblematicos.some(definer => t.DEFINER.includes(definer))
    );

    if (triggersComProblema.length === 0) {
      console.log('✅ Nenhum trigger com DEFINER problemático encontrado!\n');
    } else {
      console.log(`⚠️  ${triggersComProblema.length} trigger(s) com DEFINER antigo:\n`);
      
      for (const trigger of triggersComProblema) {
        console.log(`   - ${trigger.TRIGGER_NAME} (${trigger.EVENT_OBJECT_TABLE})`);
        console.log(`     DEFINER: ${trigger.DEFINER}\n`);
      }

      // Recriar triggers sem DEFINER (ou com o novo usuário)
      console.log('🔧 Recriando triggers...\n');

      for (const trigger of triggersComProblema) {
        try {
          // Drop trigger antigo
          await connection.query(`DROP TRIGGER IF EXISTS ${trigger.TRIGGER_NAME}`);
          console.log(`   ✅ Removido: ${trigger.TRIGGER_NAME}`);

          // Recriar trigger sem DEFINER específico
          const createTriggerSQL = `
            CREATE TRIGGER ${trigger.TRIGGER_NAME}
            ${trigger.ACTION_TIMING} ${trigger.EVENT_MANIPULATION}
            ON ${trigger.EVENT_OBJECT_TABLE}
            FOR EACH ROW
            ${trigger.ACTION_STATEMENT}
          `;

          await connection.query(createTriggerSQL);
          console.log(`   ✅ Recriado: ${trigger.TRIGGER_NAME}\n`);

        } catch (error) {
          console.log(`   ❌ Erro ao recriar ${trigger.TRIGGER_NAME}: ${error.message}\n`);
        }
      }
    }

    // Verificar views
    console.log('\n🔍 Verificando views com DEFINER antigo...\n');

    const [views] = await connection.query(`
      SELECT 
        TABLE_NAME,
        DEFINER,
        VIEW_DEFINITION
      FROM information_schema.VIEWS
      WHERE TABLE_SCHEMA = ?
    `, [process.env.DB_NAME]);

    if (views.length === 0) {
      console.log('ℹ️  Nenhuma view encontrada.\n');
    } else {
      console.log(`📋 ${views.length} view(s) encontrada(s):\n`);

      // Lista de definers conhecidamente problemáticos
      const definersProblematicos = ['elizaelramos@localhost', 'sigls_user@localhost'];
      
      const viewsComProblema = views.filter(v => 
        v.DEFINER && definersProblematicos.some(definer => v.DEFINER.includes(definer))
      );

      if (viewsComProblema.length === 0) {
        console.log('✅ Nenhuma view com DEFINER problemático encontrada!\n');
      } else {
        console.log(`⚠️  ${viewsComProblema.length} view(s) com DEFINER antigo:\n`);
        
        for (const view of viewsComProblema) {
          console.log(`   - ${view.TABLE_NAME}`);
          console.log(`     DEFINER: ${view.DEFINER}\n`);
        }

        console.log('🔧 Recriando views...\n');

        for (const view of viewsComProblema) {
          try {
            // Drop view antiga
            await connection.query(`DROP VIEW IF EXISTS ${view.TABLE_NAME}`);
            console.log(`   ✅ Removida: ${view.TABLE_NAME}`);

            // Recriar view sem DEFINER específico
            const createViewSQL = `
              CREATE VIEW ${view.TABLE_NAME} AS
              ${view.VIEW_DEFINITION}
            `;

            await connection.query(createViewSQL);
            console.log(`   ✅ Recriada: ${view.TABLE_NAME}\n`);

          } catch (error) {
            console.log(`   ❌ Erro ao recriar ${view.TABLE_NAME}: ${error.message}\n`);
          }
        }
      }
    }

    // Verificar stored procedures
    console.log('\n🔍 Verificando stored procedures com DEFINER antigo...\n');

    const [procedures] = await connection.query(`
      SELECT 
        ROUTINE_NAME,
        DEFINER,
        ROUTINE_DEFINITION
      FROM information_schema.ROUTINES
      WHERE ROUTINE_SCHEMA = ?
      AND ROUTINE_TYPE = 'PROCEDURE'
    `, [process.env.DB_NAME]);

    if (procedures.length === 0) {
      console.log('ℹ️  Nenhum stored procedure encontrado.\n');
    } else {
      console.log(`📋 ${procedures.length} stored procedure(s) encontrado(s):\n`);

      // Lista de definers conhecidamente problemáticos
      const definersProblematicos = ['elizaelramos@localhost', 'sigls_user@localhost'];
      
      const procsComProblema = procedures.filter(p => 
        p.DEFINER && definersProblematicos.some(definer => p.DEFINER.includes(definer))
      );

      if (procsComProblema.length > 0) {
        console.log(`⚠️  ${procsComProblema.length} procedure(s) com DEFINER antigo encontrado(s).\n`);
        console.log('💡 Stored procedures precisam ser recriados manualmente.\n');
      } else {
        console.log('✅ Nenhum procedure com DEFINER problemático encontrado!\n');
      }
    }

    console.log('═'.repeat(80));
    console.log('\n✅ VERIFICAÇÃO E CORREÇÃO CONCLUÍDA!\n');

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

corrigirDefiners()
  .catch(error => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });
