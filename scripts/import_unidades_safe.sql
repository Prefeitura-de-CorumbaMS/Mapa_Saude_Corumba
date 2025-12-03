-- ============================================================================
-- Script de Import Seguro de Unidades CNES
-- ============================================================================
-- Atualiza apenas campos vazios/NULL, preserva dados existentes
-- Execução: psql -U postgres -d mapa_saude -f scripts/import_unidades_safe.sql
-- ============================================================================

BEGIN;

-- Criar tabela temporária
CREATE TEMP TABLE unidades_import_tmp (
  cnes TEXT,
  nome TEXT,
  endereco TEXT,
  telefone TEXT,
  whatsapp TEXT,
  detail_url TEXT
);

-- IMPORTANTE: Ajuste o caminho absoluto do CSV antes de executar
\copy unidades_import_tmp FROM 'C:/dev/Mapa_Saude_Corumba/uploads/processed/unidades_cnes_final.csv' CSV HEADER ENCODING 'UTF8';

-- ============================================================================
-- VALIDAÇÕES PRÉ-IMPORT
-- ============================================================================

\echo '=== VALIDAÇÕES ==='
\echo ''

SELECT 'Total de unidades a importar: ' || COUNT(*) AS status FROM unidades_import_tmp;

SELECT 'CNES duplicados no CSV: ' || COUNT(*) AS status 
FROM (
  SELECT cnes, COUNT(*) 
  FROM unidades_import_tmp 
  GROUP BY cnes 
  HAVING COUNT(*) > 1
) d;

SELECT 'Unidades que já existem no sistema: ' || COUNT(*) AS status
FROM unidades_import_tmp i 
WHERE EXISTS (SELECT 1 FROM "Unidade" u WHERE u.cnes = i.cnes);

SELECT 'Unidades novas a serem inseridas: ' || COUNT(*) AS status
FROM unidades_import_tmp i 
WHERE NOT EXISTS (SELECT 1 FROM "Unidade" u WHERE u.cnes = i.cnes);

\echo ''
\echo '=== Amostra de dados a importar (5 primeiras) ==='
SELECT cnes, LEFT(nome, 40) AS nome, LEFT(endereco, 50) AS endereco, whatsapp 
FROM unidades_import_tmp 
LIMIT 5;

\echo ''
\echo '=== EXECUTANDO UPSERT ==='

-- ============================================================================
-- UPSERT DE UNIDADES
-- ============================================================================
-- Estratégia: 
-- - Insere novas unidades
-- - Atualiza apenas campos vazios (NULL ou '') em unidades existentes
-- - NÃO sobrescreve 'nome' para preservar customizações
-- ============================================================================

INSERT INTO "Unidade" (cnes, nome, endereco, telefone, whatsapp, "createdAt", "updatedAt")
SELECT 
  cnes, 
  nome, 
  endereco, 
  telefone, 
  whatsapp,
  NOW(),
  NOW()
FROM unidades_import_tmp
ON CONFLICT (cnes) DO UPDATE SET
  endereco = CASE 
    WHEN "Unidade".endereco IS NULL OR "Unidade".endereco = '' 
    THEN EXCLUDED.endereco 
    ELSE "Unidade".endereco 
  END,
  telefone = CASE 
    WHEN "Unidade".telefone IS NULL OR "Unidade".telefone = '' 
    THEN EXCLUDED.telefone 
    ELSE "Unidade".telefone 
  END,
  whatsapp = CASE 
    WHEN "Unidade".whatsapp IS NULL OR "Unidade".whatsapp = '' 
    THEN EXCLUDED.whatsapp 
    ELSE "Unidade".whatsapp 
  END,
  "updatedAt" = NOW();
  -- NOTA: 'nome' NÃO é atualizado para preservar customizações manuais

-- ============================================================================
-- VALIDAÇÕES PÓS-IMPORT
-- ============================================================================

\echo ''
\echo '=== RESULTADO DO IMPORT ==='

SELECT 'Total de unidades no sistema após import: ' || COUNT(*) AS status FROM "Unidade";

SELECT 'Unidades com endereço preenchido: ' || COUNT(*) AS status 
FROM "Unidade" 
WHERE endereco IS NOT NULL AND endereco != '';

SELECT 'Unidades com WhatsApp preenchido: ' || COUNT(*) AS status 
FROM "Unidade" 
WHERE whatsapp IS NOT NULL AND whatsapp != '';

\echo ''
\echo '=== Amostra de unidades atualizadas (5 aleatórias) ==='
SELECT cnes, LEFT(nome, 40) AS nome, LEFT(endereco, 40) AS endereco, whatsapp 
FROM "Unidade" 
WHERE cnes IN (SELECT cnes FROM unidades_import_tmp)
ORDER BY RANDOM()
LIMIT 5;

-- ============================================================================
-- DECISÃO FINAL
-- ============================================================================

\echo ''
\echo '=== ATENÇÃO ==='
\echo 'Revise os resultados acima.'
\echo 'Se estiver tudo OK, substitua ROLLBACK por COMMIT abaixo.'
\echo ''

-- Descomente a linha abaixo para confirmar as mudanças:
-- COMMIT;

-- Mantém rollback por segurança (remova esta linha após revisar):
ROLLBACK;
