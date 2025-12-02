-- ============================================================================
-- Script de Import Seguro de Profissionais e Vínculos com Unidades
-- ============================================================================
-- Vincula profissionais às unidades por CNES, preserva dados existentes
-- Execução: psql -U postgres -d mapa_saude -f scripts/import_profissionais_safe.sql
-- ============================================================================

BEGIN;

-- Criar tabela temporária
CREATE TEMP TABLE profissionais_import_tmp (
  cpf TEXT,
  cns TEXT,
  nome TEXT,
  cbo TEXT,
  cnes_unidade TEXT
);

-- IMPORTANTE: Ajuste o caminho absoluto do CSV antes de executar
\copy profissionais_import_tmp FROM 'C:/dev/Mapa_Saude_Corumba/uploads/processed/profissionais_parsed_clean.csv' CSV HEADER ENCODING 'UTF8';

-- ============================================================================
-- VALIDAÇÕES PRÉ-IMPORT
-- ============================================================================

\echo '=== VALIDAÇÕES DE PROFISSIONAIS ==='
\echo ''

SELECT 'Total de profissionais a importar: ' || COUNT(*) AS status FROM profissionais_import_tmp;

SELECT 'CPFs duplicados no CSV: ' || COUNT(*) AS status
FROM (
  SELECT cpf, COUNT(*) 
  FROM profissionais_import_tmp 
  GROUP BY cpf 
  HAVING COUNT(*) > 1
) d;

SELECT 'Profissionais que já existem no sistema: ' || COUNT(*) AS status
FROM profissionais_import_tmp i 
WHERE EXISTS (SELECT 1 FROM "Medico" m WHERE m.cpf = i.cpf);

SELECT 'Profissionais novos a serem inseridos: ' || COUNT(*) AS status
FROM profissionais_import_tmp i 
WHERE NOT EXISTS (SELECT 1 FROM "Medico" m WHERE m.cpf = i.cpf);

\echo ''
\echo '=== VALIDAÇÃO DE VÍNCULOS ==='

SELECT 'CNES únicos no import: ' || COUNT(DISTINCT cnes_unidade) AS status 
FROM profissionais_import_tmp;

SELECT 'CNES que NÃO existem no sistema (vínculos não serão criados): ' || COUNT(DISTINCT cnes_unidade) AS status
FROM profissionais_import_tmp p
WHERE NOT EXISTS (SELECT 1 FROM "Unidade" u WHERE u.cnes = p.cnes_unidade);

\echo ''
\echo '=== CNES não encontrados (se houver) ==='
SELECT DISTINCT cnes_unidade AS cnes_sem_unidade
FROM profissionais_import_tmp p
WHERE NOT EXISTS (SELECT 1 FROM "Unidade" u WHERE u.cnes = p.cnes_unidade)
LIMIT 10;

\echo ''
\echo '=== Amostra de profissionais (5 primeiros) ==='
SELECT cpf, LEFT(nome, 40) AS nome, cbo, cnes_unidade 
FROM profissionais_import_tmp 
LIMIT 5;

\echo ''
\echo '=== EXECUTANDO UPSERT DE PROFISSIONAIS ==='

-- ============================================================================
-- UPSERT DE PROFISSIONAIS
-- ============================================================================
-- Estratégia:
-- - Insere novos profissionais por CPF
-- - Atualiza apenas CNS/CBO se estiverem vazios
-- - NÃO atualiza nome para preservar correções manuais
-- ============================================================================

INSERT INTO "Medico" (cpf, cns, nome, cbo, "createdAt", "updatedAt")
SELECT 
  cpf,
  cns,
  nome,
  cbo,
  NOW(),
  NOW()
FROM profissionais_import_tmp
ON CONFLICT (cpf) DO UPDATE SET
  cns = CASE 
    WHEN "Medico".cns IS NULL OR "Medico".cns = '' 
    THEN EXCLUDED.cns 
    ELSE "Medico".cns 
  END,
  cbo = CASE 
    WHEN "Medico".cbo IS NULL OR "Medico".cbo = '' 
    THEN EXCLUDED.cbo 
    ELSE "Medico".cbo 
  END,
  "updatedAt" = NOW();
  -- NOTA: 'nome' NÃO é atualizado

\echo ''
\echo '=== CRIANDO VÍNCULOS MEDICO-UNIDADE ==='

-- ============================================================================
-- CRIAR VÍNCULOS (Junction Table)
-- ============================================================================
-- Cria vínculos apenas se:
-- - O profissional existe (foi inserido/atualizado acima)
-- - A unidade existe (tem CNES cadastrado)
-- - O vínculo ainda não existe
-- ============================================================================

INSERT INTO "UnidadeMedico" ("unidadeId", "medicoId", ativo, "createdAt", "updatedAt")
SELECT 
  u.id AS "unidadeId",
  m.id AS "medicoId",
  true AS ativo,
  NOW() AS "createdAt",
  NOW() AS "updatedAt"
FROM profissionais_import_tmp pi
JOIN "Medico" m ON m.cpf = pi.cpf
JOIN "Unidade" u ON u.cnes = pi.cnes_unidade
ON CONFLICT ("unidadeId", "medicoId") DO NOTHING;  -- Evita duplicar vínculos

-- ============================================================================
-- VALIDAÇÕES PÓS-IMPORT
-- ============================================================================

\echo ''
\echo '=== RESULTADO DO IMPORT ==='

SELECT 'Total de profissionais no sistema: ' || COUNT(*) AS status FROM "Medico";
SELECT 'Total de vínculos Unidade-Medico: ' || COUNT(*) AS status FROM "UnidadeMedico";
SELECT 'Vínculos ativos: ' || COUNT(*) AS status FROM "UnidadeMedico" WHERE ativo = true;

\echo ''
\echo '=== Amostra de vínculos criados (5 aleatórios) ==='
SELECT 
  u.cnes,
  LEFT(u.nome, 35) AS unidade,
  LEFT(m.nome, 35) AS medico,
  um.ativo
FROM "UnidadeMedico" um
JOIN "Unidade" u ON u.id = um."unidadeId"
JOIN "Medico" m ON m.id = um."medicoId"
WHERE u.cnes IN (SELECT DISTINCT cnes_unidade FROM profissionais_import_tmp)
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
