const { PrismaClient } = require('@prisma/client');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

/**
 * Reprocessa uma unidade validada para criar vínculos de especialidades e médicos
 * Útil quando a unidade foi validada antes dos mapeamentos serem criados
 */
async function reprocessarUnidade(unidadeId) {
  try {
    console.log(`\n🔄 Reprocessando unidade ID: ${unidadeId}...\n`);

    // Buscar a unidade
    const unidade = await prisma.pROD_Unidade_Saude.findUnique({
      where: { id: unidadeId },
    });

    if (!unidade) {
      console.error(`❌ Unidade não encontrada!`);
      return;
    }

    console.log(`📍 Unidade: ${unidade.nome}`);
    console.log(`🔗 ID Origem: ${unidade.id_origem}\n`);

    // Buscar todos os registros de staging dessa unidade
    const stagingRecords = await prisma.sTAGING_Info_Origem.findMany({
      where: {
        id_prod_link: unidadeId,
        status_processamento: 'validado',
      },
    });

    console.log(`📊 Encontrados ${stagingRecords.length} registros de staging vinculados\n`);

    if (stagingRecords.length === 0) {
      console.log(`⚠️  Nenhum registro de staging encontrado para essa unidade.`);
      return;
    }

    // Coletar todos os médicos e especialidades únicos
    const medicosMap = new Map();
    const especialidadesSet = new Set();

    for (const record of stagingRecords) {
      if (record.nome_medico_bruto) {
        const medicoKey = record.nome_medico_bruto.trim().toLowerCase();
        if (!medicosMap.has(medicoKey)) {
          medicosMap.set(medicoKey, {
            nome: record.nome_medico_bruto.trim(),
            especialidade: record.nome_especialidade_bruto?.trim(),
          });
        }
      }

      if (record.nome_especialidade_bruto) {
        especialidadesSet.add(record.nome_especialidade_bruto.trim());
      }
    }

    console.log(`👨‍⚕️  ${medicosMap.size} médicos únicos encontrados`);
    console.log(`🏥 ${especialidadesSet.size} especialidades únicas encontradas\n`);

    let medicosProcessados = 0;
    let especialidadesVinculadas = 0;
    let especialidadesSemMapeamento = 0;

    // Processar cada médico
    for (const [, medicoData] of medicosMap) {
      console.log(`\n👨‍⚕️  Processando médico: ${medicoData.nome}`);

      // Buscar ou criar médico
      let medico = await prisma.pROD_Medico.findFirst({
        where: { nome: medicoData.nome },
      });

      if (!medico) {
        const medicoIdOrigem = `medico_${Buffer.from(medicoData.nome).toString('base64').substring(0, 50)}`;
        medico = await prisma.pROD_Medico.create({
          data: {
            nome: medicoData.nome,
            id_origem: medicoIdOrigem,
          },
        });
        console.log(`   ✅ Médico criado (ID: ${medico.id})`);
      } else {
        console.log(`   ℹ️  Médico já existe (ID: ${medico.id})`);
      }

      medicosProcessados++;

      // Processar especialidade do médico
      if (medicoData.especialidade) {
        console.log(`   🔍 Buscando mapeamento para: "${medicoData.especialidade}"`);

        // Buscar especialidade normalizada através do mapeamento
        const mapeamento = await prisma.especialidade_Mapeamento.findUnique({
          where: {
            especialidade_bruta: medicoData.especialidade,
          },
        });

        if (mapeamento) {
          // Buscar a especialidade normalizada
          const especialidadeNormalizada = await prisma.pROD_Especialidade.findFirst({
            where: {
              nome: mapeamento.especialidade_normalizada,
            },
          });

          if (especialidadeNormalizada) {
            console.log(`   ✅ Mapeamento encontrado: ${especialidadeNormalizada.nome}`);

            // Vincular médico à especialidade
            await prisma.junction_Medico_Especialidade.upsert({
              where: {
                id_medico_id_especialidade: {
                  id_medico: medico.id,
                  id_especialidade: especialidadeNormalizada.id,
                },
              },
              create: {
                id_medico: medico.id,
                id_especialidade: especialidadeNormalizada.id,
              },
              update: {},
            });
            console.log(`   ✅ Médico vinculado à especialidade`);

            // Vincular unidade à especialidade
            await prisma.junction_Unidade_Especialidade.upsert({
              where: {
                id_unidade_id_especialidade: {
                  id_unidade: unidadeId,
                  id_especialidade: especialidadeNormalizada.id,
                },
              },
              create: {
                id_unidade: unidadeId,
                id_especialidade: especialidadeNormalizada.id,
              },
              update: {},
            });
            console.log(`   ✅ Unidade vinculada à especialidade`);

            especialidadesVinculadas++;
          } else {
            console.log(`   ⚠️  Especialidade normalizada não encontrada na tabela PROD_Especialidade`);
            especialidadesSemMapeamento++;
          }
        } else {
          console.log(`   ⚠️  Sem mapeamento cadastrado para esta especialidade`);
          especialidadesSemMapeamento++;
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DO REPROCESSAMENTO');
    console.log('='.repeat(60));
    console.log(`✅ Médicos processados: ${medicosProcessados}`);
    console.log(`✅ Especialidades vinculadas: ${especialidadesVinculadas}`);
    console.log(`⚠️  Especialidades sem mapeamento: ${especialidadesSemMapeamento}`);
    console.log('='.repeat(60) + '\n');

    console.log('✨ Reprocessamento concluído!\n');

  } catch (error) {
    console.error('❌ Erro ao reprocessar unidade:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
const unidadeId = process.argv[2];

if (!unidadeId) {
  console.error('❌ Uso: node reprocessar-unidade.js <unidade_id>');
  process.exit(1);
}

reprocessarUnidade(parseInt(unidadeId))
  .then(() => {
    console.log('✅ Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script falhou:', error);
    process.exit(1);
  });
