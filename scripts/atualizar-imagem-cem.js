const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { buildDatabaseUrl } = require('../packages/database/build-database-url');
const { PrismaClient } = require('@prisma/client');

process.env.DATABASE_URL = buildDatabaseUrl();
const prisma = new PrismaClient();

async function atualizarImagemCEM() {
  try {
    console.log('\n🔄 Atualizando imagem da unidade CEM...\n');

    // Buscar a unidade CEM
    const unidade = await prisma.pROD_Unidade_Saude.findFirst({
      where: {
        OR: [
          { nome: { contains: 'CEM' } },
          { nome: { contains: 'CENTRO DE ESPECIALIDADES' } },
        ]
      }
    });

    if (!unidade) {
      console.log('❌ Unidade CEM não encontrada!');
      return;
    }

    console.log('✅ Unidade encontrada:');
    console.log('ID:', unidade.id);
    console.log('Nome:', unidade.nome);
    console.log('Imagem atual:', unidade.imagem_url || '(não definido)');
    console.log();

    // Solicitar URL da imagem
    console.log('💡 Exemplos de URL:');
    console.log('   - /uploads/unidades/nome-arquivo.jpg');
    console.log('   - http://exemplo.com/imagem.png');
    console.log();

    // Usar a imagem do CEM que já existe na pasta uploads
    const novaImagemUrl = '/uploads/unidades/CEM---Dr-Fathar-1764176616224-456132014.jpg';

    console.log(`📝 Definindo imagem para: ${novaImagemUrl}\n`);

    // Atualizar a unidade
    const unidadeAtualizada = await prisma.pROD_Unidade_Saude.update({
      where: { id: unidade.id },
      data: {
        imagem_url: novaImagemUrl,
      }
    });

    console.log('✅ Unidade atualizada com sucesso!');
    console.log('Nova imagem URL:', unidadeAtualizada.imagem_url);
    console.log();

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

atualizarImagemCEM();
