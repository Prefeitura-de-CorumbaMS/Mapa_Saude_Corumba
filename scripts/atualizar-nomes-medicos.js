const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

/**
 * Executa as atualizações de nomes de médicos de forma segura
 * Lê o arquivo SQL e converte para operações Prisma
 */
async function atualizarNomesMedicos() {
  try {
    console.log('\n🔄 Iniciando atualização de nomes de médicos...\n');

    const sqlFile = path.join(__dirname, '../uploads/processed/Atualizar_nome-Médicos.sql');
    
    if (!fs.existsSync(sqlFile)) {
      throw new Error(`Arquivo SQL não encontrado: ${sqlFile}`);
    }

    console.log(`📄 Lendo arquivo: ${sqlFile}`);
    const sqlContent = fs.readFileSync(sqlFile, 'utf-8');

    // Extrair todas as instruções UPDATE
    // Dividir por linhas e processar cada UPDATE
    const lines = sqlContent.split('\n');
    const updates = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('UPDATE') && trimmedLine.includes('prod_medico')) {
        // Extrair nome e ID usando regex mais flexível
        const nomeMatch = trimmedLine.match(/`nome`\s*=\s*'([^']+)'/);
        const idMatch = trimmedLine.match(/`id`\s*=\s*(\d+)/);
        
        if (nomeMatch && idMatch) {
          updates.push({
            id: parseInt(idMatch[1]),
            nome: nomeMatch[1]
          });
        }
      }
    }

    console.log(`✅ Encontradas ${updates.length} atualizações\n`);

    if (updates.length === 0) {
      console.log('⚠️  Nenhuma atualização encontrada no arquivo SQL');
      return;
    }

    // Confirmar antes de prosseguir
    console.log('📊 Resumo das atualizações:');
    console.log(`   - Total de médicos a atualizar: ${updates.length}`);
    console.log(`   - IDs: ${updates[0].id} até ${updates[updates.length - 1].id}`);
    console.log('\n⏳ Processando atualizações...\n');

    let sucessos = 0;
    let erros = 0;
    let naoEncontrados = 0;

    // Processar em lotes para melhor performance
    const BATCH_SIZE = 50;
    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const batch = updates.slice(i, i + BATCH_SIZE);
      
      await Promise.all(
        batch.map(async ({ id, nome }) => {
          try {
            // Verificar se o médico existe
            const medico = await prisma.pROD_Medico.findUnique({
              where: { id },
              select: { id: true, nome: true }
            });

            if (!medico) {
              naoEncontrados++;
              console.log(`   ⚠️  Médico ID ${id} não encontrado no banco`);
              return;
            }

            // Normalizar: comparar sem case-sensitive, mas sempre atualizar para garantir formato correto
            const nomeAtualNormalizado = medico.nome.toLowerCase().trim();
            const nomeNovoNormalizado = nome.toLowerCase().trim();

            // Se os nomes forem iguais (ignorando case), atualizar para garantir capitalização correta
            // Se forem diferentes, também atualizar
            if (nomeAtualNormalizado !== nomeNovoNormalizado || medico.nome !== nome) {
              await prisma.pROD_Medico.update({
                where: { id },
                data: { nome }
              });
              sucessos++;
              
              if (sucessos % 100 === 0) {
                console.log(`   ✅ ${sucessos} médicos atualizados...`);
              }
            } else {
              // Nome já está exatamente correto (mesmo conteúdo e capitalização)
              sucessos++;
            }
          } catch (error) {
            erros++;
            console.error(`   ❌ Erro ao atualizar médico ID ${id}:`, error.message);
          }
        })
      );
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DA ATUALIZAÇÃO');
    console.log('='.repeat(60));
    console.log(`✅ Sucessos: ${sucessos}`);
    console.log(`❌ Erros: ${erros}`);
    console.log(`⚠️  Não encontrados: ${naoEncontrados}`);
    console.log(`📝 Total processado: ${updates.length}`);
    console.log('='.repeat(60) + '\n');

    if (erros > 0) {
      console.log('⚠️  Algumas atualizações falharam. Verifique os logs acima.\n');
    } else {
      console.log('✨ Todos os nomes de médicos foram atualizados com sucesso!\n');
    }

  } catch (error) {
    console.error('❌ Erro ao atualizar nomes de médicos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
atualizarNomesMedicos()
  .then(() => {
    console.log('✅ Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script falhou:', error);
    process.exit(1);
  });
