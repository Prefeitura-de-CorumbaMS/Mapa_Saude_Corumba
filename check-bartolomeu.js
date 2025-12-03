require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Investigando UBS SÃO BARTOLOMEU...\n');

  // Buscar registros no staging
  const stagingRecords = await prisma.sTAGING_Info_Origem.findMany({
    where: {
      OR: [
        { nome_unidade_bruto: { contains: 'BARTOLOMEU' } },
        { nome_familiar: { contains: 'BARTOLOMEU' } },
      ],
    },
    select: {
      id: true,
      nome_unidade_bruto: true,
      nome_familiar: true,
      nome_medico_bruto: true,
      nome_especialidade_bruto: true,
      status_processamento: true,
      id_origem: true,
    },
  });

  console.log(`📊 Encontrados ${stagingRecords.length} registros no staging:\n`);

  stagingRecords.forEach((record, i) => {
    console.log(`${i + 1}. ID: ${record.id}`);
    console.log(`   Status: ${record.status_processamento}`);
    console.log(`   Unidade: ${record.nome_unidade_bruto}`);
    console.log(`   Nome Familiar: ${record.nome_familiar || 'N/A'}`);
    console.log(`   Médico: ${record.nome_medico_bruto}`);
    console.log(`   Especialidade: ${record.nome_especialidade_bruto}`);
    console.log(`   ID Origem: ${record.id_origem}\n`);
  });

  // Buscar unidade em produção
  const unidade = await prisma.pROD_Unidade_Saude.findFirst({
    where: {
      nome: { contains: 'BARTOLOMEU' },
    },
    include: {
      especialidades: {
        include: {
          especialidade: true,
        },
      },
      medicos: {
        include: {
          medico: {
            include: {
              especialidades: {
                include: {
                  especialidade: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (unidade) {
    console.log('\n📍 Unidade em Produção:');
    console.log(`   ID: ${unidade.id}`);
    console.log(`   Nome: ${unidade.nome}`);
    console.log(`   ID Origem: ${unidade.id_origem}`);
    console.log(`\n   Especialidades (${unidade.especialidades.length}):`);
    unidade.especialidades.forEach(e => {
      console.log(`   - ${e.especialidade.nome}`);
    });
    console.log(`\n   Médicos (${unidade.medicos.length}):`);
    unidade.medicos.forEach(m => {
      console.log(`   - ${m.medico.nome}`);
      m.medico.especialidades.forEach(e => {
        console.log(`     • ${e.especialidade.nome}`);
      });
    });
  } else {
    console.log('\n❌ Unidade não encontrada em produção');
  }

  // Buscar médicos únicos nos registros do staging
  const medicosUnicos = [...new Set(stagingRecords.map(r => r.nome_medico_bruto))];
  const especialidadesUnicas = [...new Set(stagingRecords.map(r => r.nome_especialidade_bruto))];

  console.log(`\n📈 Resumo do Staging:`);
  console.log(`   Total de registros: ${stagingRecords.length}`);
  console.log(`   Médicos únicos: ${medicosUnicos.length}`);
  medicosUnicos.forEach(m => console.log(`   - ${m}`));
  console.log(`   Especialidades únicas: ${especialidadesUnicas.length}`);
  especialidadesUnicas.forEach(e => console.log(`   - ${e}`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
