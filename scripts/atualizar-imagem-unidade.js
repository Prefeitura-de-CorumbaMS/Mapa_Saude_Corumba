const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

/**
 * Atualiza a imagem_url da unidade para apontar para a imagem correta que existe na pasta
 */
async function atualizarImagemUnidade(unidadeId) {
  try {
    console.log(`\n🔄 Atualizando imagem da unidade ID: ${unidadeId}...\n`);

    // Buscar a unidade
    const unidade = await prisma.pROD_Unidade_Saude.findUnique({
      where: { id: unidadeId },
    });

    if (!unidade) {
      console.error(`❌ Unidade não encontrada!`);
      return;
    }

    console.log(`📍 Unidade: ${unidade.nome}`);
    console.log(`🖼️  Imagem atual no banco: ${unidade.imagem_url || 'Nenhuma'}\n`);

    // Verificar pasta uploads/unidades
    const uploadsPath = path.join(__dirname, '../uploads/unidades');

    if (!fs.existsSync(uploadsPath)) {
      console.error(`❌ Pasta uploads/unidades não encontrada!`);
      return;
    }

    // Listar arquivos da pasta
    const files = fs.readdirSync(uploadsPath);
    console.log(`📁 Arquivos na pasta uploads/unidades:`);
    files.forEach(file => console.log(`   - ${file}`));
    console.log();

    // Procurar por imagem relacionada a esta unidade
    const nomeUnidadeSlug = unidade.nome
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const imagemEncontrada = files.find(file =>
      file.toLowerCase().includes('ubs') ||
      file.toLowerCase().includes('unidade') ||
      file.toLowerCase().includes('imagem')
    );

    if (!imagemEncontrada) {
      console.warn(`⚠️  Nenhuma imagem encontrada para esta unidade`);
      console.log(`💡 Dica: Faça upload de uma nova imagem no admin`);
      return;
    }

    console.log(`✅ Imagem encontrada: ${imagemEncontrada}\n`);

    const novaImagemUrl = `/uploads/unidades/${imagemEncontrada}`;

    // Atualizar no banco
    await prisma.pROD_Unidade_Saude.update({
      where: { id: unidadeId },
      data: { imagem_url: novaImagemUrl },
    });

    console.log(`✅ Imagem atualizada com sucesso!`);
    console.log(`   Novo caminho: ${novaImagemUrl}\n`);

    console.log('✨ Operação concluída!\n');

  } catch (error) {
    console.error('❌ Erro ao atualizar imagem:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
const unidadeId = process.argv[2];

if (!unidadeId) {
  console.error('❌ Uso: node atualizar-imagem-unidade.js <unidade_id>');
  process.exit(1);
}

atualizarImagemUnidade(parseInt(unidadeId))
  .then(() => {
    console.log('✅ Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script falhou:', error);
    process.exit(1);
  });
