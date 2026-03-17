#!/usr/bin/env node
/**
 * Migração: adicionar icone_id (FK para prod_icone) em prod_unidade_saude
 * e migrar dados existentes de icone_url → icone_id
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { prisma } = require('../packages/database');

async function run() {
  console.log('Aplicando migração: icone_id em prod_unidade_saude...\n');

  const steps = [
    {
      desc: 'Adicionar coluna icone_id (nullable)',
      sql: 'ALTER TABLE `prod_unidade_saude` ADD COLUMN `icone_id` INT NULL AFTER `icone_url`',
    },
    {
      desc: 'Adicionar FK constraint',
      sql: 'ALTER TABLE `prod_unidade_saude` ADD CONSTRAINT `fk_unidade_icone` FOREIGN KEY (`icone_id`) REFERENCES `prod_icone`(`id`) ON DELETE SET NULL ON UPDATE CASCADE',
    },
    {
      desc: 'Criar índice em icone_id',
      sql: 'CREATE INDEX `prod_unidade_saude_icone_id_idx` ON `prod_unidade_saude`(`icone_id`)',
    },
    {
      desc: 'Migrar dados: icone_url → icone_id',
      sql: 'UPDATE `prod_unidade_saude` u INNER JOIN `prod_icone` i ON i.url = u.icone_url SET u.icone_id = i.id WHERE u.icone_url IS NOT NULL AND u.icone_url != \'\'',
    },
  ];

  for (const step of steps) {
    try {
      await prisma.$executeRawUnsafe(step.sql);
      console.log(`✓ ${step.desc}`);
    } catch (e) {
      const ignore = ['Duplicate column', 'already exists', 'Duplicate key', "Duplicate entry"];
      if (ignore.some(msg => e.message.includes(msg))) {
        console.log(`- ${step.desc} (já aplicado, pulando)`);
      } else {
        console.error(`✗ ${step.desc}\n  Erro: ${e.message}`);
        process.exit(1);
      }
    }
  }

  // Relatório
  const [total] = await prisma.$queryRaw`SELECT COUNT(*) as total FROM prod_unidade_saude`;
  const [comIcone] = await prisma.$queryRaw`SELECT COUNT(*) as total FROM prod_unidade_saude WHERE icone_id IS NOT NULL`;
  const [semIcone] = await prisma.$queryRaw`SELECT COUNT(*) as total FROM prod_unidade_saude WHERE icone_id IS NULL AND icone_url IS NOT NULL AND icone_url != ''`;

  console.log('\n=== Relatório ===');
  console.log(`Total de unidades: ${total.total}`);
  console.log(`Com icone_id preenchido: ${comIcone.total}`);
  console.log(`Com icone_url mas sem match no prod_icone: ${semIcone.total}`);
  if (Number(semIcone.total) > 0) {
    const [rows] = await prisma.$queryRaw`SELECT id, nome, icone_url FROM prod_unidade_saude WHERE icone_id IS NULL AND icone_url IS NOT NULL AND icone_url != '' LIMIT 10`;
    console.log('Exemplos sem match:', rows);
  }
  console.log('\nMigração concluída!');
  process.exit(0);
}

run().catch(e => {
  console.error('Erro fatal:', e.message);
  process.exit(1);
});
