const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const { buildDatabaseUrl } = require('../packages/database/build-database-url');
const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

// Construir DATABASE_URL a partir de credenciais separadas
process.env.DATABASE_URL = buildDatabaseUrl();

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createSuperadmin() {
  try {
    console.log('\n=== SIGLS - Criar Superadmin ===\n');
    
    const username = await question('Username: ');
    const email = await question('Email: ');
    const password = await question('Password: ');
    
    if (!username || !email || !password) {
      console.error('\nErro: Todos os campos são obrigatórios!');
      process.exit(1);
    }
    
    // Hash da senha
    const password_hash = await bcrypt.hash(password, 10);
    
    // Criar superadmin
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password_hash,
        role: 'superadmin',
        ativo: true,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      },
    });
    
    console.log('\n✅ Superadmin criado com sucesso!');
    console.log(JSON.stringify(user, null, 2));
    
  } catch (error) {
    console.error('\n❌ Erro ao criar superadmin:', error.message);
    
    if (error.code === 'P2002') {
      console.error('Username ou email já existe!');
    }
    
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

createSuperadmin();
