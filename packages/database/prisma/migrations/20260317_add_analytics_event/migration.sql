-- Migration: Adicionar tabela de eventos de analytics próprio
-- Data: 2026-03-17
-- Substitui Google Analytics por solução própria

CREATE TABLE IF NOT EXISTS `analytics_event` (
  `id`         INT AUTO_INCREMENT NOT NULL,
  `tipo`       VARCHAR(100) NOT NULL,
  `dados`      TEXT NULL,
  `ip_hash`    VARCHAR(64) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  INDEX `analytics_event_tipo_idx` (`tipo`),
  INDEX `analytics_event_created_at_idx` (`created_at`),
  INDEX `analytics_event_tipo_created_at_idx` (`tipo`, `created_at`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
