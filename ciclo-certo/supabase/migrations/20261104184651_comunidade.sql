-- Ampliação aditiva: nenhuma tabela ou recompensa de coleta é modificada.
SET search_path TO public;
CREATE TABLE comunidade_moderadores (
    usuario_id integer PRIMARY KEY REFERENCES usuarios(id)
);
CREATE TABLE comunidade_regras (
    id integer PRIMARY KEY CHECK (id = 1),
    pontos integer NOT NULL CHECK (pontos BETWEEN 1 AND 10000),
    limite_dia integer NOT NULL CHECK (limite_dia BETWEEN 1 AND 100),
    limite_semana integer NOT NULL CHECK (limite_semana BETWEEN 1 AND 700)
);
INSERT INTO comunidade_regras VALUES (1, 10, 2, 6);
CREATE TABLE comunidade_publicacoes (
    id serial PRIMARY KEY,
    autor_id integer NOT NULL REFERENCES usuarios(id),
    categoria varchar(20) NOT NULL CHECK (categoria IN ('Plantio','Reciclagem','Curiosidades','Compostagem','Reutilização','Sugestões')),
    conteudo varchar(1200) NOT NULL,
    resumo varchar(64) NOT NULL UNIQUE,
    normalizado varchar(1200) NOT NULL,
    estado varchar(12) NOT NULL DEFAULT 'pendente' CHECK (estado IN ('pendente','aprovada','rejeitada','excluida')),
    criado_em timestamptz NOT NULL,
    moderado_em timestamptz,
    moderador_id integer REFERENCES usuarios(id),
    motivo varchar(300),
    excluido_em timestamptz,
    excluido_por integer REFERENCES usuarios(id)
);
CREATE INDEX comunidade_feed ON comunidade_publicacoes (estado, id DESC);
CREATE INDEX comunidade_categoria ON comunidade_publicacoes (categoria, estado, id DESC);
CREATE INDEX comunidade_autor ON comunidade_publicacoes (autor_id, criado_em DESC);
CREATE TABLE comunidade_creditos (
    publicacao_id integer PRIMARY KEY REFERENCES comunidade_publicacoes(id),
    usuario_id integer NOT NULL REFERENCES usuarios(id),
    pontos integer NOT NULL CHECK (pontos > 0),
    dia date NOT NULL,
    semana date NOT NULL,
    criado_em timestamptz NOT NULL,
    estornado_em timestamptz
);
CREATE INDEX comunidade_cotas ON comunidade_creditos (usuario_id, semana, dia);
CREATE TABLE comunidade_comentarios (
    id serial PRIMARY KEY,
    publicacao_id integer NOT NULL REFERENCES comunidade_publicacoes(id),
    autor_id integer NOT NULL REFERENCES usuarios(id),
    conteudo varchar(500) NOT NULL,
    resumo varchar(64) NOT NULL,
    criado_em timestamptz NOT NULL,
    excluido_em timestamptz,
    excluido_por integer REFERENCES usuarios(id),
    UNIQUE (autor_id, publicacao_id, resumo)
);
CREATE INDEX comunidade_conversa ON comunidade_comentarios (publicacao_id, id DESC);
CREATE INDEX comunidade_comentarios_autor ON comunidade_comentarios (autor_id, criado_em DESC);
CREATE TABLE comunidade_denuncias (
    id serial PRIMARY KEY,
    autor_id integer NOT NULL REFERENCES usuarios(id),
    publicacao_id integer NOT NULL REFERENCES comunidade_publicacoes(id),
    comentario_id integer REFERENCES comunidade_comentarios(id),
    motivo varchar(300) NOT NULL,
    criado_em timestamptz NOT NULL,
    resolvido_em timestamptz,
    resolvido_por integer REFERENCES usuarios(id)
);
CREATE UNIQUE INDEX comunidade_denuncia_unica ON comunidade_denuncias (autor_id, publicacao_id, coalesce(comentario_id, 0));
CREATE INDEX comunidade_denuncias_abertas ON comunidade_denuncias (id DESC) WHERE resolvido_em IS NULL;
CREATE INDEX comunidade_denuncias_autor ON comunidade_denuncias (autor_id, criado_em DESC);
CREATE INDEX comunidade_denuncias_publicacao ON comunidade_denuncias (publicacao_id);
CREATE INDEX comunidade_denuncias_comentario ON comunidade_denuncias (comentario_id);

-- JWT próprio: somente a API acessa dados; concessão de moderador e regras é administrativa.
DO $$
DECLARE tabela text;
BEGIN
    FOREACH tabela IN ARRAY ARRAY['comunidade_moderadores','comunidade_regras','comunidade_publicacoes','comunidade_creditos','comunidade_comentarios','comunidade_denuncias'] LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tabela);
        EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon, authenticated', tabela);
        EXECUTE format('CREATE POLICY acesso_backend ON public.%I TO ciclo_certo_backend USING (true) WITH CHECK (true)', tabela);
        EXECUTE format('GRANT SELECT ON public.%I TO ciclo_certo_backend', tabela);
    END LOOP;
END $$;
GRANT INSERT, UPDATE ON comunidade_publicacoes, comunidade_creditos, comunidade_comentarios, comunidade_denuncias TO ciclo_certo_backend;
REVOKE ALL ON SEQUENCE comunidade_publicacoes_id_seq, comunidade_comentarios_id_seq, comunidade_denuncias_id_seq FROM PUBLIC, anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE comunidade_publicacoes_id_seq, comunidade_comentarios_id_seq, comunidade_denuncias_id_seq TO ciclo_certo_backend;
