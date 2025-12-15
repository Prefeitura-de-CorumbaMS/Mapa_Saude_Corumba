/**
 * Script para adicionar redes sociais da Secretaria de Saúde em todas as unidades
 * Adiciona Instagram e Facebook da Secretaria Municipal de Saúde de Corumbá
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function adicionarRedesSociais() {
  try {
    console.log('🚀 Iniciando adição de redes sociais da Secretaria de Saúde...\n');

    // Buscar todas as unidades ativas
    const unidades = await prisma.pROD_Unidade_Saude.findMany({
      where: { ativo: true },
      select: { id: true, nome: true }
    });

    console.log(`📊 Total de unidades ativas: ${unidades.length}\n`);

    const redesSociais = [
      {
        nome_rede: 'Instagram',
        url_perfil: 'https://www.instagram.com/saude_corumba/'
      },
      {
        nome_rede: 'Facebook',
        url_perfil: 'https://www.facebook.com/saudecorumbams'
      }
    ];

    let adicionadas = 0;
    let jaExistentes = 0;
    let erros = 0;

    for (const unidade of unidades) {
      console.log(`\n📍 Processando: ${unidade.nome} (ID: ${unidade.id})`);

      for (const rede of redesSociais) {
        try {
          // Verificar se a rede social já existe para esta unidade
          const existente = await prisma.pROD_Unidade_RedeSocial.findFirst({
            where: {
              id_unidade: unidade.id,
              nome_rede: rede.nome_rede
            }
          });

          if (existente) {
            console.log(`   ⏭️  ${rede.nome_rede} já existe`);
            jaExistentes++;
          } else {
            // Adicionar nova rede social
            await prisma.pROD_Unidade_RedeSocial.create({
              data: {
                id_unidade: unidade.id,
                nome_rede: rede.nome_rede,
                url_perfil: rede.url_perfil
              }
            });
            console.log(`   ✅ ${rede.nome_rede} adicionado`);
            adicionadas++;
          }
        } catch (error) {
          console.log(`   ❌ Erro ao adicionar ${rede.nome_rede}: ${error.message}`);
          erros++;
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📈 RESUMO:');
    console.log(`   ✅ Redes sociais adicionadas: ${adicionadas}`);
    console.log(`   ⏭️  Já existentes: ${jaExistentes}`);
    console.log(`   ❌ Erros: ${erros}`);
    console.log(`   📊 Total de unidades processadas: ${unidades.length}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    await prisma.$disconnect();
  }
}

adicionarRedesSociais();
