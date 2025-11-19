-- ============================================================================
-- TRIGGERS PARA AUDITORIA AUTOMÁTICA
-- Estes triggers devem ser executados manualmente após as migrations
-- ============================================================================

-- Trigger para PROD_Unidade_Saude - INSERT
DELIMITER $$
CREATE TRIGGER audit_unidade_insert
AFTER INSERT ON PROD_Unidade_Saude
FOR EACH ROW
BEGIN
    INSERT INTO AUDIT_LOG (tabela, operacao, registro_id, valor_novo, timestamp)
    VALUES (
        'PROD_Unidade_Saude',
        'INSERT',
        NEW.id,
        JSON_OBJECT(
            'id', NEW.id,
            'nome', NEW.nome,
            'endereco', NEW.endereco,
            'latitude', NEW.latitude,
            'longitude', NEW.longitude,
            'id_origem', NEW.id_origem,
            'ativo', NEW.ativo
        ),
        NOW()
    );
END$$
DELIMITER ;

-- Trigger para PROD_Unidade_Saude - UPDATE
DELIMITER $$
CREATE TRIGGER audit_unidade_update
AFTER UPDATE ON PROD_Unidade_Saude
FOR EACH ROW
BEGIN
    INSERT INTO AUDIT_LOG (tabela, operacao, registro_id, valor_antigo, valor_novo, timestamp)
    VALUES (
        'PROD_Unidade_Saude',
        'UPDATE',
        NEW.id,
        JSON_OBJECT(
            'id', OLD.id,
            'nome', OLD.nome,
            'endereco', OLD.endereco,
            'latitude', OLD.latitude,
            'longitude', OLD.longitude,
            'id_origem', OLD.id_origem,
            'ativo', OLD.ativo
        ),
        JSON_OBJECT(
            'id', NEW.id,
            'nome', NEW.nome,
            'endereco', NEW.endereco,
            'latitude', NEW.latitude,
            'longitude', NEW.longitude,
            'id_origem', NEW.id_origem,
            'ativo', NEW.ativo
        ),
        NOW()
    );
END$$
DELIMITER ;

-- Trigger para PROD_Unidade_Saude - DELETE
DELIMITER $$
CREATE TRIGGER audit_unidade_delete
AFTER DELETE ON PROD_Unidade_Saude
FOR EACH ROW
BEGIN
    INSERT INTO AUDIT_LOG (tabela, operacao, registro_id, valor_antigo, timestamp)
    VALUES (
        'PROD_Unidade_Saude',
        'DELETE',
        OLD.id,
        JSON_OBJECT(
            'id', OLD.id,
            'nome', OLD.nome,
            'endereco', OLD.endereco,
            'latitude', OLD.latitude,
            'longitude', OLD.longitude,
            'id_origem', OLD.id_origem,
            'ativo', OLD.ativo
        ),
        NOW()
    );
END$$
DELIMITER ;

-- Trigger para PROD_Medico - INSERT
DELIMITER $$
CREATE TRIGGER audit_medico_insert
AFTER INSERT ON PROD_Medico
FOR EACH ROW
BEGIN
    INSERT INTO AUDIT_LOG (tabela, operacao, registro_id, valor_novo, timestamp)
    VALUES (
        'PROD_Medico',
        'INSERT',
        NEW.id,
        JSON_OBJECT(
            'id', NEW.id,
            'nome', NEW.nome,
            'id_origem', NEW.id_origem,
            'ativo', NEW.ativo
        ),
        NOW()
    );
END$$
DELIMITER ;

-- Trigger para PROD_Medico - UPDATE
DELIMITER $$
CREATE TRIGGER audit_medico_update
AFTER UPDATE ON PROD_Medico
FOR EACH ROW
BEGIN
    INSERT INTO AUDIT_LOG (tabela, operacao, registro_id, valor_antigo, valor_novo, timestamp)
    VALUES (
        'PROD_Medico',
        'UPDATE',
        NEW.id,
        JSON_OBJECT(
            'id', OLD.id,
            'nome', OLD.nome,
            'id_origem', OLD.id_origem,
            'ativo', OLD.ativo
        ),
        JSON_OBJECT(
            'id', NEW.id,
            'nome', NEW.nome,
            'id_origem', NEW.id_origem,
            'ativo', NEW.ativo
        ),
        NOW()
    );
END$$
DELIMITER ;

-- Trigger para PROD_Medico - DELETE
DELIMITER $$
CREATE TRIGGER audit_medico_delete
AFTER DELETE ON PROD_Medico
FOR EACH ROW
BEGIN
    INSERT INTO AUDIT_LOG (tabela, operacao, registro_id, valor_antigo, timestamp)
    VALUES (
        'PROD_Medico',
        'DELETE',
        OLD.id,
        JSON_OBJECT(
            'id', OLD.id,
            'nome', OLD.nome,
            'id_origem', OLD.id_origem,
            'ativo', OLD.ativo
        ),
        NOW()
    );
END$$
DELIMITER ;

-- Trigger para PROD_Especialidade - INSERT
DELIMITER $$
CREATE TRIGGER audit_especialidade_insert
AFTER INSERT ON PROD_Especialidade
FOR EACH ROW
BEGIN
    INSERT INTO AUDIT_LOG (tabela, operacao, registro_id, valor_novo, timestamp)
    VALUES (
        'PROD_Especialidade',
        'INSERT',
        NEW.id,
        JSON_OBJECT(
            'id', NEW.id,
            'nome', NEW.nome,
            'ativo', NEW.ativo
        ),
        NOW()
    );
END$$
DELIMITER ;

-- Trigger para PROD_Especialidade - UPDATE
DELIMITER $$
CREATE TRIGGER audit_especialidade_update
AFTER UPDATE ON PROD_Especialidade
FOR EACH ROW
BEGIN
    INSERT INTO AUDIT_LOG (tabela, operacao, registro_id, valor_antigo, valor_novo, timestamp)
    VALUES (
        'PROD_Especialidade',
        'UPDATE',
        NEW.id,
        JSON_OBJECT(
            'id', OLD.id,
            'nome', OLD.nome,
            'ativo', OLD.ativo
        ),
        JSON_OBJECT(
            'id', NEW.id,
            'nome', NEW.nome,
            'ativo', NEW.ativo
        ),
        NOW()
    );
END$$
DELIMITER ;

-- Trigger para PROD_Especialidade - DELETE
DELIMITER $$
CREATE TRIGGER audit_especialidade_delete
AFTER DELETE ON PROD_Especialidade
FOR EACH ROW
BEGIN
    INSERT INTO AUDIT_LOG (tabela, operacao, registro_id, valor_antigo, timestamp)
    VALUES (
        'PROD_Especialidade',
        'DELETE',
        OLD.id,
        JSON_OBJECT(
            'id', OLD.id,
            'nome', OLD.nome,
            'ativo', OLD.ativo
        ),
        NOW()
    );
END$$
DELIMITER ;
