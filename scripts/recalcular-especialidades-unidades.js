#!/usr/bin/env node

/**
 * Script para recalcular especialidades de todas as unidades
 * Remove especialidades administrativas (visivel_para_usuario = false)
 * e mantém apenas especialidades de atendimento médico
 */

const { PrismaClient } = require('@sigls/database');
const prisma = new PrismaClient();

async function recalcularEspecialidadesUnidades() {
  console.log('🔄 Iniciando recálculo de especialidades das unidades...\n');

  try {
    // Buscar todas as unidades ativas
    const unidades = await prisma.pROD_Unidade_Saude.findMany({
      where: { ativo: true },
      include: {
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

    console.log(`📊 Total de unidades encontradas: ${unidades.length}\n`);

    let unidadesAtualizadas = 0;
    let especialidadesRemovidas = 0;

    for (const unidade of unidades) {
      // Calcular especialidades que deveriam estar na unidade
      const especialidadesVisiveis = new Set();

      unidade.medicos.forEach(junction => {
        junction.medico.especialidades.forEach(esp => {
          // Adicionar apenas especialidades ativas E visíveis para usuário
          if (esp.especialidade.ativo && esp.especialidade.visivel_para_usuario) {
            especialidadesVisiveis.add(esp.id_especialidade);
          }
        });
      });

      // Buscar especialidades atuais da unidade
      const especialidadesAtuais = await prisma.junction_Unidade_Especialidade.findMany({
        where: { id_unidade: unidade.id },
        include: { especialidade: true },
      });

      // Verificar se há diferença
      const especialidadesAtuaisIds = new Set(especialidadesAtuais.map(e => e.id_especialidade));
      const especialidadesVisivelArray = Array.from(especialidadesVisiveis);

      const precisaAtualizar =
        especialidadesAtuaisIds.size !== especialidadesVisiveis.size ||
        !especialidadesVisivelArray.every(id => especialidadesAtuaisIds.has(id));

      if (precisaAtualizar) {
        console.log(`\n🔧 Atualizando: ${unidade.nome} (ID: ${unidade.id})`);

        // Listar especialidades que serão removidas
        const removidas = especialidadesAtuais.filter(e =>
          !especialidadesVisiveis.has(e.id_especialidade)
        );

        if (removidas.length > 0) {
          console.log('   ❌ Removendo especialidades:');
          removidas.forEach(e => {
            console.log(`      - ${e.especialidade.nome}`);
            especialidadesRemovidas++;
          });
        }

        // Remover todas as especialidades antigas
        await prisma.junction_Unidade_Especialidade.deleteMany({
          where: { id_unidade: unidade.id },
        });

        // Adicionar novas especialidades (apenas visíveis)
        if (especialidadesVisiveis.size > 0) {
          await prisma.junction_Unidade_Especialidade.createMany({
            data: especialidadesVisivelArray.map(esp_id => ({
              id_unidade: unidade.id,
              id_especialidade: esp_id,
            })),
          });
        }

        console.log(`   ✅ Especialidades atualizadas: ${especialidadesVisiveis.size} visíveis`);
        unidadesAtualizadas++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Recálculo concluído!');
    console.log(`📊 Estatísticas:`);
    console.log(`   - Unidades processadas: ${unidades.length}`);
    console.log(`   - Unidades atualizadas: ${unidadesAtualizadas}`);
    console.log(`   - Especialidades removidas: ${especialidadesRemovidas}`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Erro ao recalcular especialidades:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar script
recalcularEspecialidadesUnidades()
  .then(() => {
    console.log('Script finalizado com sucesso! ✨');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script falhou:', error);
    process.exit(1);
  });
