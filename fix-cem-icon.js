require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function fixCemIcon() {
  const prisma = new PrismaClient();

  try {
    // Restaurar ícone válido para o CEM
    await prisma.sTAGING_Info_Origem.update({
      where: { id: 713 },
      data: { icone_url: '/uploads/icon_mod_03.svg' }
    });

    console.log('✅ Ícone do CEM restaurado para /uploads/icon_mod_03.svg');

    // O trigger deve sincronizar automaticamente com a produção

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCemIcon();