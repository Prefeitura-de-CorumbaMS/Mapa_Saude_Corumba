require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function checkTimestamps() {
  const prisma = new PrismaClient();

  try {
    // Verificar timestamps do registro staging #713
    const stagingRecord = await prisma.sTAGING_Info_Origem.findUnique({
      where: { id: 713 },
      select: {
        id: true,
        nome_unidade_bruto: true,
        icone_url: true,
        updated_at: true,
        status_processamento: true,
        id_prod_link: true
      }
    });

    console.log('Registro staging #713:', stagingRecord);

    // Verificar timestamps do registro produção correspondente
    const prodRecord = await prisma.pROD_Unidade_Saude.findUnique({
      where: { id: 3 },
      select: {
        id: true,
        nome: true,
        icone_url: true,
        updated_at: true,
        created_at: true
      }
    });

    console.log('Registro produção id 3:', prodRecord);

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTimestamps();