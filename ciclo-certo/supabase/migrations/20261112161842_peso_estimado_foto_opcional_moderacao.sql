SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
SET LOCAL search_path TO public;
-- Dados históricos mantêm a estimativa desconhecida e a foto já registrada.
ALTER TABLE coletas ADD COLUMN peso_estimado_kg numeric(12,3)
    CHECK (peso_estimado_kg > 0 AND peso_estimado_kg <> 'NaN'::numeric);
ALTER TABLE comprovantes ALTER COLUMN foto DROP NOT NULL;

-- A decisão e a sanção ficam no registro privado da denúncia, protegido pelo RLS existente.
ALTER TABLE comunidade_denuncias
    ADD COLUMN analise varchar(24) NOT NULL DEFAULT 'pendente'
        CHECK (analise IN ('pendente','incerta','sem_infracao','ofensa','ameaca','odio','assedio_grave','ja_aplicada','alterado')),
    ADD COLUMN evidencia varchar(240),
    ADD COLUMN revisao_denunciada integer,
    ADD COLUMN restringido_id integer REFERENCES usuarios(id) ON DELETE CASCADE,
    ADD COLUMN sancao_ate timestamptz,
    ADD COLUMN revogada_em timestamptz,
    ADD COLUMN revogada_por integer REFERENCES usuarios(id) ON DELETE SET NULL;

CREATE INDEX comunidade_sancoes_ativas ON comunidade_denuncias (restringido_id, sancao_ate DESC)
    WHERE sancao_ate IS NOT NULL AND revogada_em IS NULL;
CREATE UNIQUE INDEX comunidade_sancao_por_conteudo ON comunidade_denuncias
    (publicacao_id, COALESCE(comentario_id, 0), revisao_denunciada)
    WHERE sancao_ate IS NOT NULL;

ALTER TABLE comunidade_notificacoes DROP CONSTRAINT comunidade_notificacoes_estado_check;
ALTER TABLE comunidade_notificacoes ADD CONSTRAINT comunidade_notificacoes_estado_check
    CHECK (estado IN ('aprovada','rejeitada','resposta','sancao'));
