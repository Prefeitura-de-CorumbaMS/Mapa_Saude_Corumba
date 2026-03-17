-- Migration: add icone_id FK to prod_unidade_saude
-- Substitui o campo icone_url (texto livre) por icone_id (FK para prod_icone)

-- 1. Adicionar coluna icone_id (nullable por ora, para não quebrar dados existentes)
ALTER TABLE `prod_unidade_saude`
  ADD COLUMN `icone_id` INT NULL AFTER `icone_url`;

-- 2. Adicionar FK constraint
ALTER TABLE `prod_unidade_saude`
  ADD CONSTRAINT `fk_unidade_icone`
  FOREIGN KEY (`icone_id`) REFERENCES `prod_icone`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 3. Criar índice
CREATE INDEX `prod_unidade_saude_icone_id_idx` ON `prod_unidade_saude`(`icone_id`);

-- 4. Migrar dados existentes: preencher icone_id buscando pela URL armazenada em icone_url
UPDATE `prod_unidade_saude` u
INNER JOIN `prod_icone` i ON i.url = u.icone_url
SET u.icone_id = i.id
WHERE u.icone_url IS NOT NULL AND u.icone_url != '';
