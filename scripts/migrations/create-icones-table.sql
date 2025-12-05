-- Criar tabela para gerenciar ícones
CREATE TABLE IF NOT EXISTS PROD_Icone (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nome VARCHAR(100) NOT NULL UNIQUE COMMENT 'Nome/descrição do ícone',
  url VARCHAR(500) NOT NULL COMMENT 'URL/caminho do arquivo do ícone',
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  ordem INT DEFAULT 0 COMMENT 'Ordem de exibição',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir ícones existentes
INSERT INTO PROD_Icone (nome, url, ordem, ativo) VALUES
('UBS - Unidade Básica de Saúde', '/uploads/icon_mod_UBS.png', 1, TRUE),
('Pronto Atendimento', '/uploads/icon_mod_Pronto_Atendimento.png', 2, TRUE),
('Hemonúcleo - Doação de Sangue', '/uploads/icon_mod_Doacao.png', 3, TRUE),
('Academia da Saúde', '/uploads/Icone_Academia_da_Saúde.png', 4, TRUE),
('Centros Especializados', '/uploads/icone_centros_especializados.png', 5, TRUE)
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

-- Criar índices
CREATE INDEX idx_icone_ativo ON PROD_Icone(ativo);
CREATE INDEX idx_icone_ordem ON PROD_Icone(ordem);
