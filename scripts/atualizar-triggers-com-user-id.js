/**
 * Script para executar o SQL que atualiza os triggers
 * Usa mysql2 diretamente porque Prisma não suporta CREATE TRIGGER
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function executarSQL() {
  console.log('🔧 Atualizando triggers para incluir user_id...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  });

  try {
    console.log('📋 Removendo triggers antigos...\n');
    
    // Dropar triggers existentes
    const triggersToRemove = [
      'audit_unidade_insert',
      'audit_unidade_update', 
      'audit_unidade_delete',
      'audit_medico_insert',
      'audit_medico_update',
      'audit_medico_delete',
      'audit_especialidade_insert',
      'audit_especialidade_update',
      'audit_especialidade_delete',
    ];

    for (const trigger of triggersToRemove) {
      await connection.query(`DROP TRIGGER IF EXISTS ${trigger}`);
      console.log(`  ✓ ${trigger}`);
    }

    console.log('\n📝 Criando triggers com user_id...\n');

    // Criar triggers atualizados (sem DELIMITER, direto)
    const triggers = [
      {
        name: 'audit_unidade_insert',
        sql: `CREATE TRIGGER audit_unidade_insert
          AFTER INSERT ON PROD_Unidade_Saude
          FOR EACH ROW
          INSERT INTO AUDIT_LOG (tabela, operacao, registro_id, valor_novo, user_id, timestamp)
          VALUES (
            'PROD_Unidade_Saude',
            'INSERT',
            NEW.id,
            JSON_OBJECT(
              'id', NEW.id,
              'nome', NEW.nome,
              'endereco', NEW.endereco,
              'latitude', NEW.latitude,
              'longitude', NEW.longitude,
              'id_origem', NEW.id_origem,
              'ativo', NEW.ativo
            ),
            @current_user_id,
            NOW()
          )`
      },
      {
        name: 'audit_unidade_update',
        sql: `CREATE TRIGGER audit_unidade_update
          AFTER UPDATE ON PROD_Unidade_Saude
          FOR EACH ROW
          INSERT INTO AUDIT_LOG (tabela, operacao, registro_id, valor_antigo, valor_novo, user_id, timestamp)
          VALUES (
            'PROD_Unidade_Saude',
            'UPDATE',
            NEW.id,
            JSON_OBJECT(
              'id', OLD.id,
              'nome', OLD.nome,
              'endereco', OLD.endereco,
              'latitude', OLD.latitude,
              'longitude', OLD.longitude,
              'id_origem', OLD.id_origem,
              'ativo', OLD.ativo
            ),
            JSON_OBJECT(
              'id', NEW.id,
              'nome', NEW.nome,
              'endereco', NEW.endereco,
              'latitude', NEW.latitude,
              'longitude', NEW.longitude,
              'id_origem', NEW.id_origem,
              'ativo', NEW.ativo
            ),
            @current_user_id,
            NOW()
          )`
      },
      {
        name: 'audit_unidade_delete',
        sql: `CREATE TRIGGER audit_unidade_delete
          AFTER DELETE ON PROD_Unidade_Saude
          FOR EACH ROW
          INSERT INTO AUDIT_LOG (tabela, operacao, registro_id, valor_antigo, user_id, timestamp)
          VALUES (
            'PROD_Unidade_Saude',
            'DELETE',
            OLD.id,
            JSON_OBJECT(
              'id', OLD.id,
              'nome', OLD.nome,
              'endereco', OLD.endereco,
              'latitude', OLD.latitude,
              'longitude', OLD.longitude,
              'id_origem', OLD.id_origem,
              'ativo', OLD.ativo
            ),
            @current_user_id,
            NOW()
          )`
      },
      {
        name: 'audit_medico_insert',
        sql: `CREATE TRIGGER audit_medico_insert
          AFTER INSERT ON PROD_Medico
          FOR EACH ROW
          INSERT INTO AUDIT_LOG (tabela, operacao, registro_id, valor_novo, user_id, timestamp)
          VALUES (
            'PROD_Medico',
            'INSERT',
            NEW.id,
            JSON_OBJECT(
              'id', NEW.id,
              'nome', NEW.nome,
              'id_origem', NEW.id_origem,
              'ativo', NEW.ativo
            ),
            @current_user_id,
            NOW()
          )`
      },
      {
        name: 'audit_medico_update',
        sql: `CREATE TRIGGER audit_medico_update
          AFTER UPDATE ON PROD_Medico
          FOR EACH ROW
          INSERT INTO AUDIT_LOG (tabela, operacao, registro_id, valor_antigo, valor_novo, user_id, timestamp)
          VALUES (
            'PROD_Medico',
            'UPDATE',
            NEW.id,
            JSON_OBJECT(
              'id', OLD.id,
              'nome', OLD.nome,
              'id_origem', OLD.id_origem,
              'ativo', OLD.ativo
            ),
            JSON_OBJECT(
              'id', NEW.id,
              'nome', NEW.nome,
              'id_origem', NEW.id_origem,
              'ativo', NEW.ativo
            ),
            @current_user_id,
            NOW()
          )`
      },
      {
        name: 'audit_medico_delete',
        sql: `CREATE TRIGGER audit_medico_delete
          AFTER DELETE ON PROD_Medico
          FOR EACH ROW
          INSERT INTO AUDIT_LOG (tabela, operacao, registro_id, valor_antigo, user_id, timestamp)
          VALUES (
            'PROD_Medico',
            'DELETE',
            OLD.id,
            JSON_OBJECT(
              'id', OLD.id,
              'nome', OLD.nome,
              'id_origem', OLD.id_origem,
              'ativo', OLD.ativo
            ),
            @current_user_id,
            NOW()
          )`
      },
      {
        name: 'audit_especialidade_insert',
        sql: `CREATE TRIGGER audit_especialidade_insert
          AFTER INSERT ON PROD_Especialidade
          FOR EACH ROW
          INSERT INTO AUDIT_LOG (tabela, operacao, registro_id, valor_novo, user_id, timestamp)
          VALUES (
            'PROD_Especialidade',
            'INSERT',
            NEW.id,
            JSON_OBJECT(
              'id', NEW.id,
              'nome', NEW.nome,
              'ativo', NEW.ativo
            ),
            @current_user_id,
            NOW()
          )`
      },
      {
        name: 'audit_especialidade_update',
        sql: `CREATE TRIGGER audit_especialidade_update
          AFTER UPDATE ON PROD_Especialidade
          FOR EACH ROW
          INSERT INTO AUDIT_LOG (tabela, operacao, registro_id, valor_antigo, valor_novo, user_id, timestamp)
          VALUES (
            'PROD_Especialidade',
            'UPDATE',
            NEW.id,
            JSON_OBJECT(
              'id', OLD.id,
              'nome', OLD.nome,
              'ativo', OLD.ativo
            ),
            JSON_OBJECT(
              'id', NEW.id,
              'nome', NEW.nome,
              'ativo', NEW.ativo
            ),
            @current_user_id,
            NOW()
          )`
      },
      {
        name: 'audit_especialidade_delete',
        sql: `CREATE TRIGGER audit_especialidade_delete
          AFTER DELETE ON PROD_Especialidade
          FOR EACH ROW
          INSERT INTO AUDIT_LOG (tabela, operacao, registro_id, valor_antigo, user_id, timestamp)
          VALUES (
            'PROD_Especialidade',
            'DELETE',
            OLD.id,
            JSON_OBJECT(
              'id', OLD.id,
              'nome', OLD.nome,
              'ativo', OLD.ativo
            ),
            @current_user_id,
            NOW()
          )`
      }
    ];

    for (const trigger of triggers) {
      await connection.query(trigger.sql);
      console.log(`  ✓ ${trigger.name}`);
    }

    console.log('\n✅ Triggers atualizados com sucesso!\n');
    console.log('📌 Como funciona agora:');
    console.log('   - Middleware de autenticação seta @current_user_id na sessão MySQL');
    console.log('   - Triggers capturam esse valor e salvam no campo user_id do AUDIT_LOG');
    console.log('   - user_id será NULL apenas para ações sem autenticação (triggers antigos, ETL, etc.)\n');

    // Verificar triggers criados
    const [triggersResult] = await connection.query(`
      SELECT TRIGGER_NAME 
      FROM information_schema.TRIGGERS 
      WHERE TRIGGER_SCHEMA = ? 
      AND TRIGGER_NAME LIKE 'audit_%'
      ORDER BY TRIGGER_NAME
    `, [process.env.DB_NAME]);

    console.log(`📊 Total de triggers de auditoria: ${triggersResult.length}`);
    triggersResult.forEach(t => console.log(`   - ${t.TRIGGER_NAME}`));
    console.log('');

  } catch (error) {
    console.error('❌ Erro ao executar SQL:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

// Executar
executarSQL()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
