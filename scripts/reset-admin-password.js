const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const { buildDatabaseUrl } = require('../packages/database/build-database-url');
const { PrismaClient } = require('@prisma/client');

process.env.DATABASE_URL = buildDatabaseUrl();
const prisma = new PrismaClient();

async function resetAdmin() {
  try {
    // Buscar usuário admin
    const user = await prisma.user.findFirst({
      where: { username: 'admin' }
    });

    if (!user) {
      console.log('\n❌ Usuário admin não encontrado!');
      console.log('Criando novo usuário admin...\n');

      const password_hash = await bcrypt.hash('Admin@123', 10);
      const newUser = await prisma.user.create({
        data: {
          username: 'admin',
          email: 'admin@sigls.local',
          password_hash,
          role: 'superadmin',
          ativo: true,
        }
      });

      console.log('✅ Usuário admin criado!');
      console.log('Username: admin');
      console.log('Senha: Admin@123');
      return;
    }

    console.log('\n✅ Usuário encontrado:');
    console.log('ID:', user.id);
    console.log('Username:', user.username);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Ativo:', user.ativo);

    // Resetar senha
    const newPassword = 'Admin@123';
    const password_hash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash,
        ativo: true  // Garantir que está ativo
      }
    });

    console.log('\n✅ Senha resetada com sucesso!');
    console.log('Nova senha: Admin@123');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdmin();
