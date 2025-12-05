const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { buildDatabaseUrl } = require('../packages/database/build-database-url');
const mysql = require('mysql2/promise');

async function listarBairros() {
  const conn = await mysql.createConnection(buildDatabaseUrl());
  
  try {
    const [rows] = await conn.execute('SELECT id, nome, ativo FROM PROD_Bairro ORDER BY nome');
    
    console.log('\n='.repeat(60));
    console.log('BAIRROS CADASTRADOS NO SISTEMA');
    console.log('='.repeat(60));
    console.log();
    
    rows.forEach(r => {
      const status = r.ativo ? '✓ ATIVO  ' : '✗ INATIVO';
      console.log(`${status} | ID ${String(r.id).padStart(3)} | ${r.nome}`);
    });
    
    console.log();
    console.log('-'.repeat(60));
    console.log(`Total: ${rows.length} bairros`);
    console.log('='.repeat(60));
    
  } finally {
    await conn.end();
  }
}

listarBairros().catch(console.error);
