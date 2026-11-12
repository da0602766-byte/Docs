ALTER TABLE public.pedidos_recompensa
    ADD COLUMN endereco_entrega varchar(160),
    ADD COLUMN data_entrega date,
    ADD CONSTRAINT pedido_recompensa_entrega_completa CHECK (
        (endereco_entrega IS NULL AND data_entrega IS NULL)
        OR (endereco_entrega IS NOT NULL AND data_entrega IS NOT NULL
            AND char_length(btrim(endereco_entrega)) >= 10)
    );
