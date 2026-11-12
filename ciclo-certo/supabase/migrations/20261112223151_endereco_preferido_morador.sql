SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '25s';
ALTER TABLE public.usuarios
    ADD COLUMN endereco_coleta varchar(160)
    CHECK (endereco_coleta IS NULL OR (tipo = 'morador' AND char_length(btrim(endereco_coleta)) >= 10));
