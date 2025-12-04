const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { buildDatabaseUrl } = require('../packages/database/build-database-url');
const mysql = require('mysql2/promise');

// Bairros que devem ser desativados (não existem em Corumbá)
const BAIRROS_DESATIVAR = [
  'Nopulândia',
  'Nova Lima',
  'Novo Horizonte',
  'Progresso',
  'Santa Terezinha',
  'Vila Real'
];

// Novos bairros que devem ser adicionados
const BAIRROS_ADICIONAR = [
  'Guanã II',
  'Cervejaria',
  'Cadweus',
  'Jardim dos Estados',
  'Mato Grande',
  'Taquaral',
  'João de Deus'
];

async function atualizarBairros() {
  const conn = await mysql.createConnection(buildDatabaseUrl());
  
  try {
    console.log('\n' + '='.repeat(80));
    console.log('ATUALIZAÇÃO DE BAIRROS DE CORUMBÁ');
    console.log('='.repeat(80));
    console.log();

    await conn.beginTransaction();

    // 1. Desativar bairros que não existem
    console.log('📝 DESATIVANDO BAIRROS QUE NÃO EXISTEM:\n');
    for (const bairro of BAIRROS_DESATIVAR) {
      const [result] = await conn.execute(
        'UPDATE PROD_Bairro SET ativo = FALSE WHERE nome = ?',
        [bairro]
      );
      
      if (result.affectedRows > 0) {
        console.log(`   ✓ Desativado: ${bairro}`);
      } else {
        console.log(`   ⚠ Não encontrado: ${bairro}`);
      }
    }

    // 2. Adicionar novos bairros
    console.log('\n📝 ADICIONANDO NOVOS BAIRROS:\n');
    for (const bairro of BAIRROS_ADICIONAR) {
      // Verificar se já existe
      const [existing] = await conn.execute(
        'SELECT id, ativo FROM PROD_Bairro WHERE nome = ?',
        [bairro]
      );

      if (existing.length > 0) {
        if (!existing[0].ativo) {
          // Reativar se estava desativado
          await conn.execute(
            'UPDATE PROD_Bairro SET ativo = TRUE WHERE nome = ?',
            [bairro]
          );
          console.log(`   ✓ Reativado: ${bairro} (ID ${existing[0].id})`);
        } else {
          console.log(`   ℹ Já existe: ${bairro} (ID ${existing[0].id})`);
        }
      } else {
        // Inserir novo
        const [result] = await conn.execute(
          'INSERT INTO PROD_Bairro (nome, ativo, updated_at) VALUES (?, TRUE, NOW())',
          [bairro]
        );
        console.log(`   ✓ Adicionado: ${bairro} (ID ${result.insertId})`);
      }
    }

    await conn.commit();

    // 3. Mostrar lista final
    console.log('\n' + '='.repeat(80));
    console.log('LISTA FINAL DE BAIRROS ATIVOS:');
    console.log('='.repeat(80));
    console.log();

    const [bairros] = await conn.execute(
      'SELECT id, nome FROM PROD_Bairro WHERE ativo = TRUE ORDER BY nome'
    );

    bairros.forEach((b, index) => {
      console.log(`   ${String(index + 1).padStart(2)}. ${b.nome}`);
    });

    console.log();
    console.log('-'.repeat(80));
    console.log(`Total: ${bairros.length} bairros ativos`);
    console.log('='.repeat(80));
    console.log();
    console.log('✅ ATUALIZAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log();

  } catch (error) {
    await conn.rollback();
    console.error('\n❌ ERRO:', error.message);
    throw error;
  } finally {
    await conn.end();
  }
}

atualizarBairros().catch(console.error);
