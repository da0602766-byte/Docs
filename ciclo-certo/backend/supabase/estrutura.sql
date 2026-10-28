-- Estrutura PostgreSQL equivalente ao MySQL 0003, sem dados ou credenciais.
SET search_path TO public;

CREATE TABLE usuarios (
	id SERIAL NOT NULL,
	nome VARCHAR(80) NOT NULL,
	tipo VARCHAR(11) NOT NULL,
	email VARCHAR(100),
	senha_hash VARCHAR(255),
	PRIMARY KEY (id),
	CONSTRAINT conferir_nome_usuario CHECK (CHAR_LENGTH(nome) >= 2),
	CONSTRAINT uq_usuarios_email UNIQUE (email),
	CONSTRAINT conferir_tipo_usuario CHECK (tipo IN ('morador', 'cooperativa'))
)

;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.usuarios FROM PUBLIC, anon, authenticated;
REVOKE ALL ON SEQUENCE public.usuarios_id_seq FROM PUBLIC, anon, authenticated;
CREATE POLICY acesso_backend ON public.usuarios TO ciclo_certo_backend USING (true) WITH CHECK (true);

CREATE TABLE coletas (
	id SERIAL NOT NULL,
	morador_id INTEGER NOT NULL,
	endereco VARCHAR(160) NOT NULL,
	dia DATE NOT NULL,
	materiais_informados JSON NOT NULL,
	situacao VARCHAR(8) DEFAULT 'agendada' NOT NULL,
	pontos DOUBLE PRECISION DEFAULT '0' NOT NULL,
	PRIMARY KEY (id),
	CONSTRAINT conferir_endereco_coleta CHECK (CHAR_LENGTH(endereco) >= 10),
	CONSTRAINT conferir_pontos_coleta CHECK (pontos >= 0),
	CONSTRAINT conferir_materiais_coleta CHECK (CASE WHEN json_typeof(materiais_informados) = 'array' THEN json_array_length(materiais_informados) >= 1 ELSE false END),
	CONSTRAINT coleta_pertence_usuario FOREIGN KEY(morador_id) REFERENCES usuarios (id),
	CONSTRAINT conferir_situacao_coleta CHECK (situacao IN ('agendada', 'coletada'))
)

;
CREATE INDEX indice_coletas_dia ON coletas (dia);
CREATE INDEX indice_coletas_morador ON coletas (morador_id);
ALTER TABLE public.coletas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.coletas FROM PUBLIC, anon, authenticated;
REVOKE ALL ON SEQUENCE public.coletas_id_seq FROM PUBLIC, anon, authenticated;
CREATE POLICY acesso_backend ON public.coletas TO ciclo_certo_backend USING (true) WITH CHECK (true);

CREATE TABLE pesagens (
	id SERIAL NOT NULL,
	coleta_id INTEGER NOT NULL,
	material VARCHAR(8) NOT NULL,
	quilos DOUBLE PRECISION NOT NULL,
	pontos DOUBLE PRECISION NOT NULL,
	PRIMARY KEY (id),
	CONSTRAINT conferir_quilos_pesagem CHECK (quilos > 0),
	CONSTRAINT conferir_pontos_pesagem CHECK (pontos >= 0),
	CONSTRAINT pesagem_pertence_coleta FOREIGN KEY(coleta_id) REFERENCES coletas (id),
	CONSTRAINT conferir_material_pesagem CHECK (material IN ('papel', 'vidro', 'plástico', 'metal'))
)

;
CREATE INDEX indice_pesagens_coleta ON pesagens (coleta_id);
ALTER TABLE public.pesagens ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pesagens FROM PUBLIC, anon, authenticated;
REVOKE ALL ON SEQUENCE public.pesagens_id_seq FROM PUBLIC, anon, authenticated;
CREATE POLICY acesso_backend ON public.pesagens TO ciclo_certo_backend USING (true) WITH CHECK (true);

-- A autorização por perfil e proprietário continua na API FastAPI.
GRANT USAGE ON SCHEMA public TO ciclo_certo_backend;
GRANT SELECT, INSERT ON public.usuarios, public.pesagens TO ciclo_certo_backend;
GRANT SELECT, INSERT, UPDATE ON public.coletas TO ciclo_certo_backend;
GRANT USAGE, SELECT ON SEQUENCE public.usuarios_id_seq, public.coletas_id_seq, public.pesagens_id_seq TO ciclo_certo_backend;
