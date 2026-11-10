-- Publicidade opt-in: conteúdos anteriores continuam restritos a contas autenticadas.
ALTER TABLE public.usuarios ADD COLUMN criado_em timestamptz;
ALTER TABLE public.usuarios ALTER COLUMN criado_em SET DEFAULT now();
ALTER TABLE public.comunidade_publicacoes ADD COLUMN publica boolean NOT NULL DEFAULT false;
CREATE INDEX comunidade_publicacoes_publicas ON public.comunidade_publicacoes(id DESC) WHERE publica AND estado='aprovada';
ALTER TABLE public.comunidade_publicacoes ADD COLUMN revisao integer NOT NULL DEFAULT 1;
ALTER TABLE public.comunidade_comentarios ADD COLUMN resposta_id integer REFERENCES public.comunidade_comentarios(id);
CREATE INDEX comunidade_respostas ON public.comunidade_comentarios(resposta_id);
ALTER TABLE public.comunidade_notificacoes DROP CONSTRAINT comunidade_notificacoes_publicacao_id_key;
ALTER TABLE public.comunidade_notificacoes DROP CONSTRAINT comunidade_notificacoes_estado_check;
ALTER TABLE public.comunidade_notificacoes ADD CONSTRAINT comunidade_notificacoes_estado_check CHECK (estado IN ('aprovada','rejeitada','resposta'));
ALTER TABLE public.comunidade_notificacoes ADD COLUMN chave varchar(90);
UPDATE public.comunidade_notificacoes SET chave='moderacao:'||publicacao_id||':1';
-- Nullable durante a troca da API: a versão anterior ainda pode gravar um aviso sem chave.
ALTER TABLE public.comunidade_notificacoes ADD UNIQUE(chave);
CREATE INDEX comunidade_notificacoes_publicacao ON public.comunidade_notificacoes(publicacao_id);
CREATE TABLE public.comunidade_favoritos(usuario_id integer REFERENCES public.usuarios(id),publicacao_id integer REFERENCES public.comunidade_publicacoes(id),PRIMARY KEY(usuario_id,publicacao_id));
CREATE INDEX comunidade_favoritos_publicacao ON public.comunidade_favoritos(publicacao_id);
CREATE TABLE public.comunidade_revisoes(id serial PRIMARY KEY,publicacao_id integer NOT NULL REFERENCES public.comunidade_publicacoes(id),revisao integer NOT NULL,conteudo varchar(1200) NOT NULL,categoria varchar(20) NOT NULL,youtube_id varchar(11),motivo varchar(300),criado_em timestamptz NOT NULL,UNIQUE(publicacao_id,revisao));
ALTER TABLE public.comunidade_revisoes ADD COLUMN resumo varchar(64) NOT NULL;
CREATE INDEX comunidade_revisoes_resumo ON public.comunidade_revisoes(resumo);
CREATE TABLE public.comunidade_acoes(id serial PRIMARY KEY,tipo varchar(12) NOT NULL CHECK(tipo IN ('evento','pergunta','destaque')),titulo varchar(100) NOT NULL,descricao varchar(1200) NOT NULL,local varchar(160),inicio timestamptz NOT NULL,fim timestamptz NOT NULL CHECK(fim>inicio),publicacao_id integer REFERENCES public.comunidade_publicacoes(id),autor_id integer NOT NULL REFERENCES public.usuarios(id),ativa boolean NOT NULL DEFAULT true);
CREATE INDEX comunidade_acoes_periodo ON public.comunidade_acoes(ativa,fim);
CREATE INDEX comunidade_acoes_autor ON public.comunidade_acoes(autor_id);
CREATE INDEX comunidade_acoes_publicacao ON public.comunidade_acoes(publicacao_id);
CREATE TABLE public.comunidade_inscricoes(acao_id integer REFERENCES public.comunidade_acoes(id),usuario_id integer REFERENCES public.usuarios(id),PRIMARY KEY(acao_id,usuario_id));
CREATE INDEX comunidade_inscricoes_usuario ON public.comunidade_inscricoes(usuario_id);
-- Métricas mínimas: identificador aleatório por sessão, sem endereço IP ou conteúdo pessoal.
CREATE TABLE public.comunidade_visitas(sessao uuid NOT NULL,dia date NOT NULL DEFAULT current_date,PRIMARY KEY(sessao,dia));
ALTER TABLE public.comunidade_visitas ADD COLUMN usuario_id integer REFERENCES public.usuarios(id);
CREATE INDEX comunidade_visitas_usuario ON public.comunidade_visitas(usuario_id);
CREATE TABLE public.comunidade_acessos(usuario_id integer REFERENCES public.usuarios(id),dia date NOT NULL DEFAULT current_date,PRIMARY KEY(usuario_id,dia));
CREATE INDEX comunidade_visitas_dia ON public.comunidade_visitas(dia);
CREATE INDEX comunidade_acessos_dia ON public.comunidade_acessos(dia);
DO $$ DECLARE tabela text; BEGIN
FOREACH tabela IN ARRAY ARRAY['comunidade_favoritos','comunidade_revisoes','comunidade_acoes','comunidade_inscricoes','comunidade_visitas','comunidade_acessos'] LOOP
EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',tabela);
EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated',tabela);
EXECUTE format('CREATE POLICY acesso_backend ON public.%I TO ciclo_certo_backend USING(true) WITH CHECK(true)',tabela);
EXECUTE format('GRANT SELECT,INSERT,UPDATE ON public.%I TO ciclo_certo_backend',tabela);
END LOOP; END $$;
GRANT DELETE ON public.comunidade_favoritos,public.comunidade_inscricoes TO ciclo_certo_backend;
REVOKE ALL ON SEQUENCE public.comunidade_revisoes_id_seq,public.comunidade_acoes_id_seq FROM PUBLIC,anon,authenticated;
GRANT USAGE,SELECT ON SEQUENCE public.comunidade_revisoes_id_seq,public.comunidade_acoes_id_seq TO ciclo_certo_backend;
