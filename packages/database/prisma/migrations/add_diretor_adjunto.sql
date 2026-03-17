-- AddDiretorAdjuntoToUnidade
ALTER TABLE `prod_unidade_saude`
ADD COLUMN `diretor_adjunto` VARCHAR(255) NULL AFTER `enfermeiro_responsavel`;
