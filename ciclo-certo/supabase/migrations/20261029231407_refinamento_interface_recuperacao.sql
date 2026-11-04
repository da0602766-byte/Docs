SET search_path TO public;
ALTER TABLE produtos ADD COLUMN foto varchar(300) NOT NULL DEFAULT '/imagens/produtos/ecobag.jpg', ADD COLUMN ativo boolean NOT NULL DEFAULT true;
UPDATE produtos SET foto=CASE nome
WHEN 'Ecobag do bairro' THEN '/imagens/produtos/ecobag.jpg' WHEN 'Kit horta em casa' THEN '/imagens/produtos/horta.jpg'
WHEN 'Caderno reciclado' THEN '/imagens/produtos/caderno.jpg' WHEN 'Garrafa reutilizável' THEN '/imagens/produtos/garrafa.jpg'
WHEN 'Desconto na feira' THEN '/imagens/produtos/feira.jpg' WHEN 'Kit compostagem' THEN '/imagens/produtos/compostagem.jpg'
WHEN 'Lanche da comunidade' THEN '/imagens/produtos/lanche.jpg' ELSE '/imagens/produtos/estojo.jpg' END;
GRANT INSERT ON produtos TO ciclo_certo_backend;
CREATE TABLE recuperacoes_senha(usuario_id integer PRIMARY KEY REFERENCES usuarios(id), versao_token integer NOT NULL, resumo varchar(64) NOT NULL UNIQUE, criado_em timestamptz NOT NULL, expira_em timestamptz NOT NULL);
ALTER TABLE recuperacoes_senha ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON recuperacoes_senha FROM PUBLIC,anon,authenticated;
CREATE POLICY acesso_backend ON recuperacoes_senha TO ciclo_certo_backend USING(true) WITH CHECK(true);
GRANT SELECT,INSERT,UPDATE,DELETE ON recuperacoes_senha TO ciclo_certo_backend;
