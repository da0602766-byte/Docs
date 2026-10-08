-- Referência da estrutura atual. Para preparar o banco, use as migrações do Alembic.
-- Este arquivo não cadastra usuários nem atualiza tabelas existentes.
-- InnoDB permite transações e chaves estrangeiras para manter as relações.
-- AUTO_INCREMENT atribui os ids no banco, mesmo depois de reiniciar a API.
CREATE TABLE IF NOT EXISTS usuarios (
    id INT NOT NULL AUTO_INCREMENT,
    nome VARCHAR(80) NOT NULL,
    tipo ENUM('morador', 'cooperativa') NOT NULL,
    email VARCHAR(100) NULL,
    senha_hash VARCHAR(255) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_usuarios_email UNIQUE (email),
    CONSTRAINT conferir_nome_usuario CHECK (CHAR_LENGTH(nome) >= 2)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_as_cs;

-- JSON guarda a lista de materiais informados sem criar uma quarta entidade.
-- DOUBLE mantém o tipo float que os esquemas atuais usam para os pontos.
CREATE TABLE IF NOT EXISTS coletas (
    id INT NOT NULL AUTO_INCREMENT,
    morador_id INT NOT NULL,
    endereco VARCHAR(160) NOT NULL,
    dia DATE NOT NULL,
    materiais_informados JSON NOT NULL,
    situacao ENUM('agendada', 'coletada') NOT NULL DEFAULT 'agendada',
    pontos DOUBLE NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    INDEX indice_coletas_dia (dia),
    INDEX indice_coletas_morador (morador_id),
    CONSTRAINT coleta_pertence_usuario FOREIGN KEY (morador_id) REFERENCES usuarios (id),
    CONSTRAINT conferir_endereco_coleta CHECK (CHAR_LENGTH(endereco) >= 10),
    CONSTRAINT conferir_pontos_coleta CHECK (pontos >= 0),
    CONSTRAINT conferir_materiais_coleta CHECK (
        JSON_TYPE(materiais_informados) = 'ARRAY'
        AND JSON_LENGTH(materiais_informados) BETWEEN 1 AND 6
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_as_cs;

-- A chave estrangeira impede uma pesagem sem coleta e protege o histórico.
CREATE TABLE IF NOT EXISTS pesagens (
    id INT NOT NULL AUTO_INCREMENT,
    coleta_id INT NOT NULL,
    material ENUM('papel', 'vidro', 'plástico', 'metal') NOT NULL,
    quilos DOUBLE NOT NULL,
    pontos DOUBLE NOT NULL,
    PRIMARY KEY (id),
    INDEX indice_pesagens_coleta (coleta_id),
    CONSTRAINT pesagem_pertence_coleta FOREIGN KEY (coleta_id) REFERENCES coletas (id),
    CONSTRAINT conferir_quilos_pesagem CHECK (quilos > 0 AND quilos <= 1000),
    CONSTRAINT conferir_pontos_pesagem CHECK (pontos >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_as_cs;
