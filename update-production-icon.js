require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function updateProductionIcon() {
  const prisma = new PrismaClient();

  try {
    // Atualizar o registro de produção com o ícone do staging
    const stagingRecord = await prisma.sTAGING_Info_Origem.findUnique({
      where: { id: 713 },
      select: { icone_url: true }
    });

    if (stagingRecord && stagingRecord.icone_url) {
      const updatedProd = await prisma.pROD_Unidade_Saude.update({
        where: { id: 3 }, // id_prod_link do staging
        data: { icone_url: stagingRecord.icone_url }
      });

      console.log('Registro de produção atualizado:', updatedProd);
    } else {
      console.log('Nenhum ícone encontrado no staging');
    }

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateProductionIcon();