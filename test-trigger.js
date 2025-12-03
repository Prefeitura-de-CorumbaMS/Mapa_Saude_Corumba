require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function testTrigger() {
  const prisma = new PrismaClient();

  try {
    console.log('Testando trigger de sincronização...');

    // Verificar estado atual
    const stagingBefore = await prisma.sTAGING_Info_Origem.findUnique({
      where: { id: 713 },
      select: { icone_url: true, updated_at: true }
    });

    const prodBefore = await prisma.pROD_Unidade_Saude.findUnique({
      where: { id: 3 },
      select: { icone_url: true, updated_at: true }
    });

    console.log('Antes da alteração:');
    console.log('Staging icone_url:', stagingBefore.icone_url);
    console.log('Prod icone_url:', prodBefore.icone_url);
    console.log('Prod updated_at:', prodBefore.updated_at);

    // Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Alterar o icone_url na staging (simulando uma edição no formulário)
    await prisma.sTAGING_Info_Origem.update({
      where: { id: 713 },
      data: { icone_url: '/uploads/icon_test_trigger.png' }
    });

    console.log('\nAlteração feita na staging...');

    // Aguardar um pouco para o trigger executar
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verificar se a produção foi atualizada
    const prodAfter = await prisma.pROD_Unidade_Saude.findUnique({
      where: { id: 3 },
      select: { icone_url: true, updated_at: true }
    });

    console.log('\nDepois da alteração:');
    console.log('Prod icone_url:', prodAfter.icone_url);
    console.log('Prod updated_at:', prodAfter.updated_at);

    if (prodAfter.icone_url === '/uploads/icon_test_trigger.png' && prodAfter.updated_at > prodBefore.updated_at) {
      console.log('\n✅ Trigger funcionando! A produção foi atualizada automaticamente.');
    } else {
      console.log('\n❌ Trigger não funcionou como esperado.');
    }

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTrigger();