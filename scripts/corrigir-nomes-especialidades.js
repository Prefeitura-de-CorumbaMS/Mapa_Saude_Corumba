/**
 * Script para corrigir nomes de especialidades truncados
 */

const { prisma } = require('@sigls/database');
const { logger } = require('@sigls/logger');

// Mapeamento de correções conhecidas
const CORRECOES = {
  'Medico Da Estrategia De Saude Da': 'Medico Da Estrategia De Saude Da Familia',
  'Enfermeiro Da Estrategia De': 'Enfermeiro Da Estrategia De Saude Da Familia',
  'Cirurgiao Dentista Da': 'Cirurgiao Dentista Da Estrategia De Saude Da Familia',
  'Tecnico De Enfermagem Da': 'Tecnico De Enfermagem Da Estrategia De Saude Da Familia',
  'Auxiliar Em Saude Bucal Da': 'Auxiliar Em Saude Bucal Da Estrategia De Saude Da Familia',
  'Auxiliar De Enfermagem Da': 'Auxiliar De Enfermagem Da Estrategia De Saude Da Familia',
  'Tecnico Em Saude Bucal Da': 'Tecnico Em Saude Bucal Da Estrategia De Saude Da Familia',
  'Tecnico Em Manutencao De': 'Tecnico Em Manutencao De Equipamentos',
  'Analista De Desenvolvimento De': 'Analista De Desenvolvimento De Sistemas',
};

async function corrigirEspecialidades() {
  console.log('🔧 Iniciando correção de nomes de especialidades...\n');

  let sucessos = 0;
  let erros = 0;

  for (const [nomeAtual, nomeCorreto] of Object.entries(CORRECOES)) {
    try {
      // Buscar especialidade com nome atual
      const especialidade = await prisma.pROD_Especialidade.findFirst({
        where: { nome: nomeAtual }
      });

      if (especialidade) {
        console.log(`📝 Corrigindo: "${nomeAtual}"`);
        console.log(`   → Para: "${nomeCorreto}"`);

        await prisma.pROD_Especialidade.update({
          where: { id: especialidade.id },
          data: { nome: nomeCorreto }
        });

        console.log(`   ✅ ID ${especialidade.id} atualizado com sucesso!\n`);
        sucessos++;
      } else {
        console.log(`⚠️  Não encontrado: "${nomeAtual}"\n`);
      }
    } catch (error) {
      console.log(`❌ Erro ao corrigir "${nomeAtual}": ${error.message}\n`);
      erros++;
    }
  }

  console.log('═'.repeat(60));
  console.log('📊 RESUMO DA CORREÇÃO');
  console.log('═'.repeat(60));
  console.log(`✅ Sucessos: ${sucessos}`);
  console.log(`❌ Erros: ${erros}`);
  console.log(`📝 Total processado: ${Object.keys(CORRECOES).length}`);
  console.log('═'.repeat(60));
}

corrigirEspecialidades()
  .then(() => {
    console.log('\n✅ Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro ao executar script:', error);
    process.exit(1);
  });
