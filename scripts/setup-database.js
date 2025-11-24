const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { buildDatabaseUrl } = require('../packages/database/build-database-url');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

// Construir DATABASE_URL a partir de credenciais separadas
process.env.DATABASE_URL = buildDatabaseUrl();

const prisma = new PrismaClient();

async function setupDatabase() {
  try {
    console.log('\n=== SIGLS - Database Setup ===\n');
    
    // Verificar conexão
    console.log('1. Verificando conexão com o banco de dados...');
    await prisma.$connect();
    console.log('✅ Conexão estabelecida!\n');
    
    // Verificar se as tabelas existem
    console.log('2. Verificando estrutura do banco de dados...');
    const tables = await prisma.$queryRaw`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
    `;
    console.log(`✅ ${tables.length} tabelas encontradas\n`);
    
    // Verificar se há usuários
    console.log('3. Verificando usuários...');
    const userCount = await prisma.user.count();
    
    if (userCount === 0) {
      console.log('⚠️  Nenhum usuário encontrado!');
      console.log('Execute: npm run create:superadmin\n');
    } else {
      console.log(`✅ ${userCount} usuário(s) encontrado(s)\n`);
    }
    
    // Estatísticas
    console.log('4. Estatísticas do sistema:');
    const [unidades, medicos, especialidades, staging] = await Promise.all([
      prisma.pROD_Unidade_Saude.count(),
      prisma.pROD_Medico.count(),
      prisma.pROD_Especialidade.count(),
      prisma.sTAGING_Info_Origem.count(),
    ]);
    
    console.log(`   - Unidades de Saúde: ${unidades}`);
    console.log(`   - Médicos: ${medicos}`);
    console.log(`   - Especialidades: ${especialidades}`);
    console.log(`   - Registros em Staging: ${staging}`);
    
    console.log('\n✅ Setup concluído com sucesso!\n');
    
  } catch (error) {
    console.error('\n❌ Erro no setup:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase();
