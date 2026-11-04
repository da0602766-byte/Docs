-- Incremental: saldo fictício já adquirido passa a pontos sem perder valor.
SET search_path TO public;
ALTER TABLE usuarios ADD COLUMN administrador boolean NOT NULL DEFAULT false;
ALTER TABLE usuarios ALTER COLUMN recompensa SET DEFAULT 'pontos';
UPDATE usuarios SET recompensa='pontos';
ALTER TABLE usuarios DROP CONSTRAINT conferir_recompensa;
ALTER TABLE usuarios ADD CONSTRAINT conferir_recompensa CHECK(recompensa='pontos');
UPDATE movimentos SET pontos=pontos+centavos, centavos=0 WHERE centavos<>0;
ALTER TABLE movimentos ADD CONSTRAINT sem_dinheiro CHECK(centavos=0);
ALTER TABLE coletas ADD COLUMN autoriza_depoimento boolean NOT NULL DEFAULT false,
 ADD COLUMN depoimento_publicado boolean NOT NULL DEFAULT false;
CREATE TABLE produtos(id serial PRIMARY KEY, nome varchar(100) NOT NULL,
 descricao varchar(500) NOT NULL, categoria varchar(40) NOT NULL,
 pontos integer NOT NULL CHECK(pontos>0), estoque integer NOT NULL CHECK(estoque>=0));
CREATE TABLE pedidos_recompensa(id serial PRIMARY KEY, usuario_id integer NOT NULL REFERENCES usuarios(id),
 produto_id integer NOT NULL REFERENCES produtos(id), nome varchar(100) NOT NULL, pontos integer NOT NULL CHECK(pontos>0),
 chave varchar(64) NOT NULL, criado_em timestamptz NOT NULL, UNIQUE(usuario_id,chave));
CREATE INDEX pedidos_usuario ON pedidos_recompensa(usuario_id);
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos_recompensa ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON produtos,pedidos_recompensa FROM PUBLIC,anon,authenticated;
REVOKE ALL ON SEQUENCE produtos_id_seq,pedidos_recompensa_id_seq FROM PUBLIC,anon,authenticated;
CREATE POLICY acesso_backend ON produtos TO ciclo_certo_backend USING(true) WITH CHECK(true);
CREATE POLICY acesso_backend ON pedidos_recompensa TO ciclo_certo_backend USING(true) WITH CHECK(true);
GRANT SELECT,UPDATE ON produtos TO ciclo_certo_backend;
GRANT SELECT,INSERT ON pedidos_recompensa TO ciclo_certo_backend;
GRANT USAGE,SELECT ON SEQUENCE produtos_id_seq,pedidos_recompensa_id_seq TO ciclo_certo_backend;
GRANT UPDATE ON movimentos TO ciclo_certo_backend;
GRANT DELETE ON coletas,comprovantes,notificacoes TO ciclo_certo_backend;
-- Catálogo demonstrativo, sem compra, pagamento ou entrega real.
INSERT INTO produtos(nome,descricao,categoria,pontos,estoque) VALUES
('Ecobag do bairro','Sacola reutilizável de algodão para as compras do dia. Produto fictício.','Casa',500,25),
('Kit horta em casa','Sementes e três pequenos vasos para começar sua horta. Produto fictício.','Jardim',800,18),
('Caderno reciclado','Caderno de 80 folhas produzido com papel reciclado. Produto fictício.','Papelaria',400,30),
('Garrafa reutilizável','Garrafa de 600 ml para acompanhar sua rotina. Produto fictício.','Casa',1200,12),
('Desconto na feira','Cupom demonstrativo de 10 por cento na feira do bairro. Sem validade comercial.','Descontos',600,40),
('Kit compostagem','Balde e guia ilustrado para compostagem doméstica. Produto fictício.','Jardim',2000,8),
('Lanche da comunidade','Cupom de lanche demonstrativo. Sem validade comercial.','Descontos',700,20),
('Estojo sustentável','Estojo feito com tecido reaproveitado. Produto fictício.','Papelaria',350,0);
