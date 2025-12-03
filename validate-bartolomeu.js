require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Validando registros pendentes do UBS SÃO BARTOLOMEU...\n');

  // Buscar registros pendentes
  const pendingRecords = await prisma.sTAGING_Info_Origem.findMany({
    where: {
      OR: [
        { nome_unidade_bruto: { contains: 'BARTOLOMEU' } },
        { nome_familiar: { contains: 'BARTOLOMEU' } },
      ],
      status_processamento: 'pendente',
    },
  });

  console.log(`📊 Encontrados ${pendingRecords.length} registros pendentes\n`);

  if (pendingRecords.length === 0) {
    console.log('✅ Todos os registros já foram validados!');
    return;
  }

  // Validar cada registro
  for (const record of pendingRecords) {
    console.log(`⏳ Validando registro #${record.id}:`);
    console.log(`   Médico: ${record.nome_medico_bruto}`);
    console.log(`   Especialidade: ${record.nome_especialidade_bruto}`);

    // Atualizar status para validado
    await prisma.sTAGING_Info_Origem.update({
      where: { id: record.id },
      data: { status_processamento: 'validado' },
    });

    console.log(`   ✅ Validado\n`);
  }

  console.log('\n✅ Todos os registros foram validados!');
  console.log('\n⚠️  IMPORTANTE: Execute o ETL para processar os novos registros validados:');
  console.log('   node packages/etl/index.js');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
