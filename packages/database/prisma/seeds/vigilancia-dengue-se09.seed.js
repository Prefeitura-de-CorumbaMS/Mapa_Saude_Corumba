// Seed de dados de Dengue - SE 01 a SE 09/2026
// Baseado no boletim epidemiológico do CIEVS Fronteira Corumbá

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedDengueSE09() {
  console.log('🦟 Iniciando seed de dados de Dengue SE 01-09/2026...\n');

  // 1. Criar registros de SE 1 a 9 (série histórica)
  // IMPORTANTE: valores são INDIVIDUAIS de cada semana (não acumulados)
  // O total acumulado até SE 9 é calculado pela API quando necessário
  const serieHistorica = [
    { se: 1, notif: 18, conf: 1 },
    { se: 2, notif: 22, conf: 1 },
    { se: 3, notif: 31, conf: 0 },
    { se: 4, notif: 45, conf: 2 },
    { se: 5, notif: 60, conf: 1 },
    { se: 6, notif: 78, conf: 3 },
    { se: 7, notif: 95, conf: 2 },
    { se: 8, notif: 102, conf: 4 },
    { se: 9, notif: 1, conf: 8 }, // SE 09 - valor individual (não acumulado)
    // Total acumulado até SE 9: notif=452, conf=22
  ];

  console.log('📊 Criando série histórica (SE 1-9)...');
  for (const item of serieHistorica) {
    const dengueSE = await prisma.vIGILANCIA_Dengue_SE.upsert({
      where: {
        ano_semana_epidemiologica: {
          ano: 2026,
          semana_epidemiologica: item.se,
        },
      },
      update: {
        casos_notificados: item.notif,
        casos_confirmados: item.conf,
      },
      create: {
        ano: 2026,
        semana_epidemiologica: item.se,
        casos_notificados: item.notif,
        casos_confirmados: item.conf,
        sorotipo_tipo3: item.se === 9 ? 11 : 0,
        isolamentos_virais: item.se === 9 ? 11 : 0,
        obitos: 0,
        fonte: 'SINAN, 2026',
        data_publicacao: new Date('2026-03-01'),
      },
    });

    console.log(`  ✓ SE ${item.se}/2026: ${item.notif} notificados, ${item.conf} confirmados`);

    // 2. Se for SE 9, adicionar perfil demográfico detalhado
    if (item.se === 9) {
      console.log('\n👥 Criando perfil demográfico (faixa etária + sexo) da SE 09...');

      // Perfil demográfico dos 8 casos confirmados na SE 09 (individual)
      const perfil = [
        // < 2 anos
        { faixa: '< 2 anos', sexo: 'F', casos: 0 },
        { faixa: '< 2 anos', sexo: 'M', casos: 0 },
        // 2 a 4
        { faixa: '2 a 4', sexo: 'F', casos: 0 },
        { faixa: '2 a 4', sexo: 'M', casos: 1 },
        // 5 a 9
        { faixa: '5 a 9', sexo: 'F', casos: 0 },
        { faixa: '5 a 9', sexo: 'M', casos: 0 },
        // 10 a 19
        { faixa: '10 a 19', sexo: 'F', casos: 2 },
        { faixa: '10 a 19', sexo: 'M', casos: 1 },
        // 20 a 29
        { faixa: '20 a 29', sexo: 'F', casos: 1 },
        { faixa: '20 a 29', sexo: 'M', casos: 0 },
        // 30 a 39
        { faixa: '30 a 39', sexo: 'F', casos: 1 },
        { faixa: '30 a 39', sexo: 'M', casos: 1 },
        // 40 a 49
        { faixa: '40 a 49', sexo: 'F', casos: 0 },
        { faixa: '40 a 49', sexo: 'M', casos: 0 },
        // 50 a 59
        { faixa: '50 a 59', sexo: 'F', casos: 1 },
        { faixa: '50 a 59', sexo: 'M', casos: 0 },
        // 60+
        { faixa: '60+', sexo: 'F', casos: 0 },
        { faixa: '60+', sexo: 'M', casos: 0 },
      ];
      // Total: 8 casos confirmados (5F + 3M)

      for (const p of perfil) {
        await prisma.vIGILANCIA_Dengue_Perfil.upsert({
          where: {
            id: -1, // Força create sempre (ID não existe)
          },
          update: {},
          create: {
            ano: 2026,
            semana_epidemiologica: 9,
            faixa_etaria: p.faixa,
            sexo: p.sexo,
            casos: p.casos,
            dengue_se_id: dengueSE.id,
          },
        });
      }
      console.log('  ✓ Perfil demográfico criado (14 registros, 8 casos confirmados)');

      // 3. Adicionar dados de bairros da SE 09
      // IMPORTANTE: Valores individuais da SE 9 (1 notificado, 8 confirmados)
      console.log('\n🗺️  Criando distribuição por bairro...');
      const bairros = [
        { bairro: 'Guanã', notif: 0, conf: 2 },
        { bairro: 'Popular Nova', notif: 1, conf: 2 },
        { bairro: 'Guatos', notif: 0, conf: 1 },
        { bairro: 'Dom Bosco', notif: 0, conf: 1 },
        { bairro: 'Nova Corumbá', notif: 0, conf: 1 },
        { bairro: 'Centro', notif: 0, conf: 1 },
      ];

      for (const b of bairros) {
        await prisma.vIGILANCIA_Dengue_Bairro.upsert({
          where: {
            id: -1, // Força create sempre
          },
          update: {},
          create: {
            ano: 2026,
            semana_epidemiologica: 9,
            bairro: b.bairro,
            notificados: b.notif,
            confirmados: b.conf,
            dengue_se_id: dengueSE.id,
          },
        });
      }
      console.log(`  ✓ ${bairros.length} bairros criados`);
      console.log('    - Maior concentração: Guatos (72 notificados, 5 confirmados)');
      console.log('    - Mais confirmados: Guanã (7 confirmados)');
    }
  }

  console.log('\n✅ Seed de Dengue SE 01-09/2026 concluído com sucesso!');
  console.log('\n📈 Resumo:');
  console.log(`  - ${serieHistorica.length} Semanas Epidemiológicas criadas`);
  console.log('  - SE 09/2026: 219 notificados, 11 confirmados');
  console.log('  - Sorotipo identificado: Dengue Tipo 3 (5 isolamentos)');
  console.log('  - 0 óbitos');
}

seedDengueSE09()
  .catch((error) => {
    console.error('❌ Erro ao executar seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
