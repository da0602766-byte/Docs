-- Evolução incremental; preserva usuários, coletas e pontos históricos.
SET search_path TO public;
ALTER TABLE usuarios ADD COLUMN versao_token integer NOT NULL DEFAULT 0,
    ADD COLUMN recompensa varchar(12) NOT NULL DEFAULT 'dinheiro',
    ADD CONSTRAINT conferir_recompensa CHECK (recompensa IN ('dinheiro', 'pontos'));
ALTER TABLE coletas DROP CONSTRAINT conferir_situacao_coleta;
ALTER TABLE coletas ALTER COLUMN situacao TYPE varchar(24);
ALTER TABLE coletas ADD CONSTRAINT conferir_situacao_coleta CHECK (situacao IN ('agendada','em_coleta','aguardando_avaliacao','coletada','cancelada')),
    ADD COLUMN hora varchar(5),
    ADD COLUMN cooperador_id integer REFERENCES usuarios(id),
    ADD COLUMN responsabilidade varchar(300),
    ADD COLUMN motivo_cancelamento varchar(500),
    ADD COLUMN versao integer NOT NULL DEFAULT 0,
    ADD COLUMN finalizada_em timestamptz,
    ADD COLUMN nota integer CHECK (nota BETWEEN 1 AND 5),
    ADD COLUMN comentario varchar(500),
    ADD COLUMN avaliada_em timestamptz,
    ADD COLUMN pontos_previstos integer NOT NULL DEFAULT 0 CHECK (pontos_previstos >= 0);
CREATE INDEX indice_coletas_cooperador ON coletas(cooperador_id);
CREATE INDEX indice_coletas_horario ON coletas(dia, hora);
ALTER TABLE pesagens DROP CONSTRAINT conferir_material_pesagem;
ALTER TABLE pesagens ALTER COLUMN material TYPE varchar(40);
ALTER TABLE pesagens ADD COLUMN valor_kg numeric(12,4) CHECK (valor_kg >= 0);

CREATE TABLE horarios (
    id serial PRIMARY KEY, dia date NOT NULL, hora varchar(5) NOT NULL,
    capacidade integer NOT NULL CHECK (capacidade >= 0), CONSTRAINT uq_horario UNIQUE (dia,hora)
);
CREATE TABLE comprovantes (
    coleta_id integer PRIMARY KEY REFERENCES coletas(id), foto text NOT NULL, assinatura text NOT NULL,
    nome_signatario varchar(80) NOT NULL, criado_em timestamptz NOT NULL, versao integer NOT NULL
);
CREATE TABLE notificacoes (
    id serial PRIMARY KEY, usuario_id integer NOT NULL REFERENCES usuarios(id), coleta_id integer NOT NULL REFERENCES coletas(id),
    tipo varchar(24) NOT NULL, mensagem varchar(600) NOT NULL, lida boolean NOT NULL DEFAULT false,
    criado_em timestamptz NOT NULL, CONSTRAINT uq_aviso_coleta_tipo UNIQUE (coleta_id,tipo)
);
CREATE INDEX indice_notificacoes_usuario ON notificacoes(usuario_id);
CREATE TABLE movimentos (
    id serial PRIMARY KEY, usuario_id integer NOT NULL REFERENCES usuarios(id), coleta_id integer REFERENCES coletas(id),
    chave varchar(64) NOT NULL, tipo varchar(30) NOT NULL, pontos integer NOT NULL DEFAULT 0,
    centavos integer NOT NULL DEFAULT 0, criado_em timestamptz NOT NULL,
    CONSTRAINT uq_credito_coleta UNIQUE(coleta_id), CONSTRAINT uq_movimento_chave UNIQUE(usuario_id,chave)
);
CREATE INDEX indice_movimentos_usuario ON movimentos(usuario_id);

-- A API aplica perfil/proprietário. Imagens nunca são publicadas em bucket aberto.
ALTER TABLE horarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE comprovantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON horarios, comprovantes, notificacoes, movimentos FROM PUBLIC, anon, authenticated;
REVOKE ALL ON SEQUENCE horarios_id_seq, notificacoes_id_seq, movimentos_id_seq FROM PUBLIC, anon, authenticated;
CREATE POLICY acesso_backend ON horarios TO ciclo_certo_backend USING (true) WITH CHECK (true);
CREATE POLICY acesso_backend ON comprovantes TO ciclo_certo_backend USING (true) WITH CHECK (true);
CREATE POLICY acesso_backend ON notificacoes TO ciclo_certo_backend USING (true) WITH CHECK (true);
CREATE POLICY acesso_backend ON movimentos TO ciclo_certo_backend USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE ON horarios, notificacoes TO ciclo_certo_backend;
GRANT SELECT, INSERT ON comprovantes, movimentos TO ciclo_certo_backend;
GRANT UPDATE ON usuarios, pesagens TO ciclo_certo_backend;
GRANT DELETE ON pesagens TO ciclo_certo_backend;
GRANT USAGE, SELECT ON SEQUENCE horarios_id_seq, notificacoes_id_seq, movimentos_id_seq TO ciclo_certo_backend;
