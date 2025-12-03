require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function checkAuditLog() {
  const prisma = new PrismaClient();

  try {
    // Verificar logs de auditoria recentes relacionados ao registro de produção id 3
    const auditLogs = await prisma.aUDIT_LOG.findMany({
      where: {
        tabela: 'PROD_Unidade_Saude',
        registro_id: 3
      },
      orderBy: { timestamp: 'desc' },
      take: 5,
      select: {
        operacao: true,
        valor_antigo: true,
        valor_novo: true,
        correlation_id: true,
        timestamp: true
      }
    });

    console.log('Últimos logs de auditoria para PROD_Unidade_Saude id 3:');
    auditLogs.forEach(log => {
      console.log(`- ${log.timestamp}: ${log.operacao} (correlation: ${log.correlation_id})`);
      if (log.valor_novo) {
        try {
          const novo = JSON.parse(log.valor_novo);
          console.log(`  Novo icone_url: ${novo.icone_url}`);
        } catch (e) {
          console.log(`  Valor novo: ${log.valor_novo.substring(0, 100)}...`);
        }
      }
    });

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAuditLog();