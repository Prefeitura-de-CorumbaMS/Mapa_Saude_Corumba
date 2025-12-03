require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function checkStagingRecord() {
  const prisma = new PrismaClient();

  try {
    const record = await prisma.sTAGING_Info_Origem.findUnique({
      where: { id: 713 },
      select: {
        id: true,
        nome_unidade_bruto: true,
        icone_url: true,
        updated_at: true
      }
    });

    console.log('Registro #713:', record);
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStagingRecord();