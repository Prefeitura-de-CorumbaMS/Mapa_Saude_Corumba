-- CreateTable: vigilancia_dengue_caso
-- Tabela para armazenar casos individuais de dengue (registros do laboratório)

CREATE TABLE `vigilancia_dengue_caso` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ano` INTEGER NOT NULL,
    `numero_caso` VARCHAR(20) NULL,

    -- Dados da notificação
    `unidade` VARCHAR(200) NULL,
    `sinan` VARCHAR(50) NULL,
    `data_notificacao` DATETIME(3) NULL,
    `data_sintomas` DATETIME(3) NULL,

    -- Dados do paciente
    `paciente` VARCHAR(200) NOT NULL,
    `data_nascimento` DATETIME(3) NULL,
    `sexo` VARCHAR(1) NULL,

    -- Localização
    `endereco` VARCHAR(500) NULL,
    `bairro` VARCHAR(100) NULL,

    -- Classificação temporal
    `semana_epidemiologica` INTEGER NOT NULL,

    -- Observações
    `observacoes` TEXT NULL,

    -- Metadados
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `vigilancia_dengue_caso_ano_idx` ON `vigilancia_dengue_caso`(`ano`);

-- CreateIndex
CREATE INDEX `vigilancia_dengue_caso_semana_epidemiologica_idx` ON `vigilancia_dengue_caso`(`semana_epidemiologica`);

-- CreateIndex
CREATE INDEX `vigilancia_dengue_caso_ano_semana_epidemiologica_idx` ON `vigilancia_dengue_caso`(`ano`, `semana_epidemiologica`);

-- CreateIndex
CREATE INDEX `vigilancia_dengue_caso_bairro_idx` ON `vigilancia_dengue_caso`(`bairro`);

-- CreateIndex
CREATE INDEX `vigilancia_dengue_caso_data_notificacao_idx` ON `vigilancia_dengue_caso`(`data_notificacao`);
