require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function finalTest() {
  const prisma = new PrismaClient();

  try {
    console.log('Teste final do trigger de sincronização...\n');

    // Verificar estado atual
    const prodRecord = await prisma.pROD_Unidade_Saude.findUnique({
      where: { id: 3 },
      select: { icone_url: true, updated_at: true }
    });

    console.log('Estado atual da produção:');
    console.log('- icone_url:', prodRecord.icone_url);
    console.log('- updated_at:', prodRecord.updated_at);

    // Simular uma alteração via formulário (como se o usuário tivesse mudado o ícone)
    console.log('\nSimulando alteração no formulário de enriquecimento...');
    await prisma.sTAGING_Info_Origem.update({
      where: { id: 713 },
      data: { icone_url: '/uploads/icon_final_test.png' }
    });

    console.log('✅ Alteração salva na staging');

    // Aguardar um momento para o trigger executar
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verificar se a produção foi atualizada
    const prodAfter = await prisma.pROD_Unidade_Saude.findUnique({
      where: { id: 3 },
      select: { icone_url: true, updated_at: true }
    });

    console.log('\nEstado após alteração:');
    console.log('- icone_url:', prodAfter.icone_url);
    console.log('- updated_at:', prodAfter.updated_at);

    const iconChanged = prodAfter.icone_url === '/uploads/icon_final_test.png';
    const timestampChanged = prodAfter.updated_at > prodRecord.updated_at;

    console.log('\nResultado do teste:');
    console.log(`- Ícone alterado: ${iconChanged ? '✅' : '❌'}`);
    console.log(`- Timestamp atualizado: ${timestampChanged ? '✅' : '❌'}`);

    if (iconChanged && timestampChanged) {
      console.log('\n🎉 TRIGGER FUNCIONANDO PERFEITAMENTE!');
      console.log('Agora sempre que você alterar imagens ou ícones no formulário de enriquecimento,');
      console.log('o registro de produção será automaticamente atualizado em tempo real.');
    } else {
      console.log('\n⚠️  Trigger com problemas - verificar implementação');
    }

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

finalTest();