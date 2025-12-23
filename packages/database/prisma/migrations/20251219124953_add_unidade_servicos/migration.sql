-- CreateTable
CREATE TABLE `prod_unidade_servico` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_unidade` INTEGER NOT NULL,
    `descricao` VARCHAR(500) NOT NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `prod_unidade_servico_id_unidade_idx`(`id_unidade`),
    INDEX `prod_unidade_servico_ordem_idx`(`ordem`),
    INDEX `prod_unidade_servico_ativo_idx`(`ativo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `prod_unidade_servico` ADD CONSTRAINT `prod_unidade_servico_id_unidade_fkey` FOREIGN KEY (`id_unidade`) REFERENCES `prod_unidade_saude`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
