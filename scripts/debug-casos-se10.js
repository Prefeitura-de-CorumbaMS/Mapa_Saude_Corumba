/**
 * Script para debugar casos da SE 10
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { buildDatabaseUrl } = require('../packages/database/build-database-url');
const mysql = require('mysql2/promise');

async function debugCasos() {
  const conn = await mysql.createConnection(buildDatabaseUrl());

  try {
    console.log('\n🔍 VERIFICANDO CASOS DA SE 10\n');

    // 1. Contar casos na SE 10
    const [count] = await conn.execute(`
      SELECT COUNT(*) as total
      FROM vigilancia_dengue_caso
      WHERE ano = 2026 AND semana_epidemiologica = 10
    `);
    console.log('📊 Total de casos na SE 10:', count[0].total);

    // 2. Listar casos da SE 10
    const [casos] = await conn.execute(`
      SELECT id, numero_caso, paciente, bairro, semana_epidemiologica, data_notificacao
      FROM vigilancia_dengue_caso
      WHERE ano = 2026 AND semana_epidemiologica = 10
      ORDER BY id
    `);

    console.log('\n📋 Casos encontrados:');
    casos.forEach((caso, idx) => {
      console.log(`${idx + 1}. ID: ${caso.id} | Paciente: ${caso.paciente} | Bairro: ${caso.bairro} | SE: ${caso.semana_epidemiologica}`);
    });

    // 3. Contar casos até SE 10 (acumulado)
    const [countAcumulado] = await conn.execute(`
      SELECT COUNT(*) as total
      FROM vigilancia_dengue_caso
      WHERE ano = 2026 AND semana_epidemiologica <= 10
    `);
    console.log('\n📈 Total acumulado até SE 10:', countAcumulado[0].total);

    // 4. Verificar todas as SEs que têm dados
    const [sesComDados] = await conn.execute(`
      SELECT semana_epidemiologica, COUNT(*) as total
      FROM vigilancia_dengue_caso
      WHERE ano = 2026
      GROUP BY semana_epidemiologica
      ORDER BY semana_epidemiologica
    `);

    console.log('\n📅 Semanas com dados:');
    sesComDados.forEach(se => {
      console.log(`  SE ${se.semana_epidemiologica}: ${se.total} casos`);
    });

    // 5. Verificar se existem SEs disponíveis na tabela vigilancia_dengue_se
    const [seAgregadas] = await conn.execute(`
      SELECT semana_epidemiologica, casos_notificados, casos_confirmados
      FROM vigilancia_dengue_se
      WHERE ano = 2026
      ORDER BY semana_epidemiologica
    `);

    console.log('\n📊 SEs na tabela agregada (vigilancia_dengue_se):');
    if (seAgregadas.length === 0) {
      console.log('  ⚠️  Nenhuma SE encontrada na tabela agregada!');
    } else {
      seAgregadas.forEach(se => {
        console.log(`  SE ${se.semana_epidemiologica}: ${se.casos_notificados} notif, ${se.casos_confirmados} conf`);
      });
    }

    console.log('\n✅ Verificação concluída!\n');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    console.error(error);
  } finally {
    await conn.end();
  }
}

debugCasos()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
