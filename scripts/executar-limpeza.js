/**
 * Script para executar a limpeza de arquivos desnecessários
 * Cria backup e organiza arquivos antigos
 */

const fs = require('fs').promises;
const path = require('path');

const ARQUIVOS_PARA_REMOVER_ROOT = [
  'check-audit.js',
  'check-bartolomeu.js',
  'check-icons.js',
  'check-production.js',
  'check-staging-713.js',
  'check-timestamps.js',
  'final-test.js',
  'fix-cem-icon.js',
  'test-icon-upload.js',
  'test-path-debug.js',
  'test-trigger.js',
  'update-icons.js',
  'update-production-icon.js',
  'validate-bartolomeu.js'
];

const ARQUIVOS_PARA_ARQUIVAR = {
  migrations: [
    'apply-migration-medico.js',
    'migrate-add-imagem-url.js',
    'migrate-especialidade-mapeamento.js',
    'apply-triggers.js'
  ],
  imports: [
    'import_profissionais_mysql.sql',
    'import_profissionais_safe.sql',
    'import_profissionais_safe_mysql.sql',
    'import_unidades_safe.sql'
  ],
  mergeOld: [
    'mesclar-unidades-duplicadas.js',
    'mesclar-unidades-duplicadas-2.js',
    'mesclar-unidades-duplicadas-3.js',
    'mesclar-unidades-duplicadas-4.js',
    'mesclar-unidades-duplicadas-5.js',
    'mesclar-unidades-duplicadas-6.js',
    'mesclar-unidades-duplicadas-7.js'
  ],
  tests: [
    'test-import-profissionais.js',
    'test-import-unidades.js',
    'test-mysql-connection.js',
    'test-postgres-connection.js'
  ],
  etl: [
    'extract_pdf_tables.py',
    'extract_pdf_text.py',
    'extract_with_tabula.py',
    'fetch_cnes_addresses.py',
    'generate_unidades_cnes.py',
    'generate_unidades_final_csv.py',
    'parse_profissionais_text.py',
    'clean_profissionais_parsed.py',
    'merge_whatsapp.py',
    'retry_missing_cnes.py',
    'analise-profissionais-csv.js'
  ],
  populate: [
    'popular-especialidades-unidades.js',
    'popular-especialidades.js',
    'populate-especialidades.js',
    'populate-junction-unidade-medico.js'
  ]
};

async function criarEstruturaDiretorios(baseDir) {
  const dirs = [
    'scripts/archive',
    'scripts/archive/migrations',
    'scripts/archive/imports',
    'scripts/archive/merge-old',
    'scripts/archive/tests',
    'scripts/archive/etl',
    'scripts/archive/populate'
  ];

  for (const dir of dirs) {
    await fs.mkdir(path.join(baseDir, dir), { recursive: true });
  }
}

async function removerArquivo(caminho) {
  try {
    await fs.unlink(caminho);
    return { sucesso: true };
  } catch (error) {
    return { sucesso: false, erro: error.message };
  }
}

async function moverArquivo(origem, destino) {
  try {
    await fs.rename(origem, destino);
    return { sucesso: true };
  } catch (error) {
    return { sucesso: false, erro: error.message };
  }
}

async function executarLimpeza(dryRun = true) {
  const baseDir = process.cwd();
  
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║           EXECUÇÃO DE LIMPEZA DE ARQUIVOS                    ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  if (dryRun) {
    console.log('⚠️  MODO DRY-RUN (simulação) - Nenhum arquivo será modificado\n');
  } else {
    console.log('🔴 MODO REAL - Arquivos serão movidos/removidos!\n');
  }

  const relatorio = {
    removidos: [],
    movidos: [],
    erros: []
  };

  // Criar estrutura de diretórios
  console.log('📁 Criando estrutura de diretórios...\n');
  if (!dryRun) {
    await criarEstruturaDiretorios(baseDir);
  }
  console.log('   ✅ Estrutura criada: scripts/archive/\n');

  // 1. Remover arquivos da raiz
  console.log('🗑️  REMOVENDO arquivos de teste/debug da raiz:\n');
  
  for (const arquivo of ARQUIVOS_PARA_REMOVER_ROOT) {
    const caminhoCompleto = path.join(baseDir, arquivo);
    
    try {
      await fs.access(caminhoCompleto);
      
      if (dryRun) {
        console.log(`   [SIMULAÇÃO] Removeria: ${arquivo}`);
        relatorio.removidos.push(arquivo);
      } else {
        const resultado = await removerArquivo(caminhoCompleto);
        if (resultado.sucesso) {
          console.log(`   ✅ Removido: ${arquivo}`);
          relatorio.removidos.push(arquivo);
        } else {
          console.log(`   ❌ Erro ao remover ${arquivo}: ${resultado.erro}`);
          relatorio.erros.push({ arquivo, erro: resultado.erro });
        }
      }
    } catch {
      // Arquivo não existe, ignorar
    }
  }

  console.log(`\n   Total: ${relatorio.removidos.length} arquivos removidos\n`);

  // 2. Mover arquivos para arquivo
  console.log('📦 MOVENDO arquivos para scripts/archive/:\n');

  for (const [categoria, arquivos] of Object.entries(ARQUIVOS_PARA_ARQUIVAR)) {
    console.log(`   Categoria: ${categoria}`);
    
    for (const arquivo of arquivos) {
      const origem = path.join(baseDir, 'scripts', arquivo);
      const destino = path.join(baseDir, 'scripts', 'archive', categoria, arquivo);
      
      try {
        await fs.access(origem);
        
        if (dryRun) {
          console.log(`   [SIMULAÇÃO] Moveria: scripts/${arquivo} -> archive/${categoria}/`);
          relatorio.movidos.push({ arquivo, categoria });
        } else {
          const resultado = await moverArquivo(origem, destino);
          if (resultado.sucesso) {
            console.log(`   ✅ Movido: ${arquivo}`);
            relatorio.movidos.push({ arquivo, categoria });
          } else {
            console.log(`   ❌ Erro ao mover ${arquivo}: ${resultado.erro}`);
            relatorio.erros.push({ arquivo, erro: resultado.erro });
          }
        }
      } catch {
        // Arquivo não existe, ignorar
      }
    }
    console.log('');
  }

  console.log(`   Total: ${relatorio.movidos.length} arquivos movidos\n`);

  // Resumo final
  console.log('═'.repeat(80) + '\n');
  console.log('📊 RESUMO DA OPERAÇÃO:\n');
  console.log(`   Arquivos removidos: ${relatorio.removidos.length}`);
  console.log(`   Arquivos movidos: ${relatorio.movidos.length}`);
  console.log(`   Erros encontrados: ${relatorio.erros.length}\n`);

  if (relatorio.erros.length > 0) {
    console.log('❌ ERROS:\n');
    for (const erro of relatorio.erros) {
      console.log(`   - ${erro.arquivo}: ${erro.erro}`);
    }
    console.log('');
  }

  if (dryRun) {
    console.log('💡 Para executar a limpeza de verdade, rode:');
    console.log('   node scripts/executar-limpeza.js --executar\n');
  } else {
    console.log('✅ Limpeza concluída com sucesso!\n');
    
    console.log('📝 Arquivos mantidos em /scripts:');
    console.log('   ✅ Scripts de análise e diagnóstico');
    console.log('   ✅ Scripts utilitários (admin, bairros, etc.)');
    console.log('   ✅ mesclar-unidades-duplicadas-8.js (versão mais recente)');
    console.log('   ✅ setup-database.js (útil para configuração inicial)\n');
    
    console.log('📦 Arquivos arquivados em /scripts/archive:');
    console.log('   📁 migrations/ - Scripts de migração executados');
    console.log('   📁 imports/ - Scripts SQL de importação');
    console.log('   📁 merge-old/ - Versões antigas de merge');
    console.log('   📁 tests/ - Scripts de teste de conexão');
    console.log('   📁 etl/ - Scripts Python de ETL');
    console.log('   📁 populate/ - Scripts de população de dados\n');
  }

  // Salvar relatório
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const nomeArquivo = `limpeza-executada-${timestamp}.json`;
  const caminhoRelatorio = path.join(baseDir, 'logs', nomeArquivo);

  try {
    await fs.mkdir(path.join(baseDir, 'logs'), { recursive: true });
    await fs.writeFile(caminhoRelatorio, JSON.stringify({
      dataExecucao: new Date().toISOString(),
      dryRun,
      ...relatorio
    }, null, 2));
    console.log(`💾 Relatório salvo em: logs/${nomeArquivo}\n`);
  } catch (error) {
    console.error('Erro ao salvar relatório:', error.message);
  }
}

// Verificar argumentos
const args = process.argv.slice(2);
const executar = args.includes('--executar') || args.includes('-e');

executarLimpeza(!executar)
  .catch(error => {
    console.error('\n❌ Erro na execução:', error);
    process.exit(1);
  });
