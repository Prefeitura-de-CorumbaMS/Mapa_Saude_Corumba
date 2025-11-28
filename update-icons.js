require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function updateIcons() {
  const prisma = new PrismaClient();

  try {
    // Atualizar UBS PADRE ERNESTO SASSIDA com icon_mod_01.svg
    const unidade1 = await prisma.pROD_Unidade_Saude.update({
      where: { id_origem: 'unidade_VU5JREFERSBCQVNJQ0EgREUgU0FVREUgUEFEUkUgRVJORVNUTy' },
      data: { icone_url: '/uploads/icon_mod_01.svg' }
    });
    console.log('Atualizada UBS PADRE ERNESTO SASSIDA:', unidade1.icone_url);

    // Atualizar UBS São Bartolomeu com icon_mod_02.svg
    const unidade2 = await prisma.pROD_Unidade_Saude.update({
      where: { id_origem: 'DD31778BF1946BAD41C6242ACF05DE7E' },
      data: { icone_url: '/uploads/icon_mod_02.svg' }
    });
    console.log('Atualizada UBS São Bartolomeu:', unidade2.icone_url);

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateIcons();