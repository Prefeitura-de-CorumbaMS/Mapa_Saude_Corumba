require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function checkProductionRecord() {
  const prisma = new PrismaClient();

  try {
    // Primeiro, vamos ver se existe alguma unidade na produção com nome similar ao registro #713
    const stagingRecord = await prisma.sTAGING_Info_Origem.findUnique({
      where: { id: 713 },
      select: {
        nome_unidade_bruto: true,
        icone_url: true
      }
    });

    console.log('Registro staging #713:', stagingRecord);

    // Agora vamos procurar na produção por nome similar
    const productionRecords = await prisma.pROD_Unidade_Saude.findMany({
      where: {
        nome: {
          contains: 'CENTRO DE ESPECIALIDADES MEDICAS'
        }
      },
      select: {
        id: true,
        nome: true,
        icone_url: true,
        id_origem: true
      }
    });

    console.log('Registros produção similares:', productionRecords);

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductionRecord();