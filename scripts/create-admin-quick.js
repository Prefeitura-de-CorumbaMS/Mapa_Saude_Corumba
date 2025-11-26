const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const { buildDatabaseUrl } = require('../packages/database/build-database-url');
const { PrismaClient } = require('@prisma/client');

// Construir DATABASE_URL
process.env.DATABASE_URL = buildDatabaseUrl();
const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const username = 'admin';
    const email = 'admin@sigls.local';
    const password = 'Admin@123';

    const password_hash = await bcrypt.hash(password, 10);

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

    console.log('\n✅ Admin criado com sucesso!');
    console.log('Username:', username);
    console.log('Email:', email);
    console.log('Senha:', password);
    console.log(JSON.stringify(user, null, 2));
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('\n⚠️  Usuário admin já existe!');
      console.log('Username: admin');
      console.log('Senha: Admin@123');
    } else {
      console.error('\n❌ Erro:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
