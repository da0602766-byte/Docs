-- Evolução aditiva: nenhum registro ou saldo existente é modificado.
ALTER TABLE public.comunidade_publicacoes ADD COLUMN youtube_id varchar(11)
    CHECK (youtube_id IS NULL OR youtube_id ~ '^[A-Za-z0-9_-]{11}$');
CREATE UNIQUE INDEX comunidade_video_autor ON public.comunidade_publicacoes (autor_id, youtube_id)
    WHERE youtube_id IS NOT NULL;

CREATE TABLE public.comunidade_notificacoes (
    id serial PRIMARY KEY,
    usuario_id integer NOT NULL REFERENCES public.usuarios(id),
    publicacao_id integer NOT NULL UNIQUE REFERENCES public.comunidade_publicacoes(id),
    estado varchar(12) NOT NULL CHECK (estado IN ('aprovada', 'rejeitada')),
    mensagem varchar(600) NOT NULL,
    lida boolean NOT NULL DEFAULT false,
    criado_em timestamptz NOT NULL
);
CREATE INDEX comunidade_avisos_pendentes ON public.comunidade_notificacoes (usuario_id, id) WHERE NOT lida;
CREATE INDEX comunidade_avisos_usuario ON public.comunidade_notificacoes (usuario_id, id DESC);
ALTER TABLE public.comunidade_notificacoes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.comunidade_notificacoes FROM PUBLIC, anon, authenticated;
REVOKE ALL ON SEQUENCE public.comunidade_notificacoes_id_seq FROM PUBLIC, anon, authenticated;
CREATE POLICY acesso_backend ON public.comunidade_notificacoes TO ciclo_certo_backend USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE ON public.comunidade_notificacoes TO ciclo_certo_backend;
GRANT USAGE, SELECT ON SEQUENCE public.comunidade_notificacoes_id_seq TO ciclo_certo_backend;
