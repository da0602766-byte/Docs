ALTER TABLE public.usuarios
    ADD COLUMN email_verificado_em timestamptz,
    ADD COLUMN confirmacao_email_hash varchar(64),
    ADD COLUMN confirmacao_email_enviada_em timestamptz;

CREATE UNIQUE INDEX usuarios_confirmacao_email_hash_idx
    ON public.usuarios (confirmacao_email_hash)
    WHERE confirmacao_email_hash IS NOT NULL;
