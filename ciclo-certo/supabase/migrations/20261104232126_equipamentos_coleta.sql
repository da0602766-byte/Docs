-- Adição compatível: coletas anteriores permanecem sem equipamentos planejados.
ALTER TABLE public.coletas ADD COLUMN equipamentos json NOT NULL DEFAULT '[]'::json;
ALTER TABLE public.coletas ADD CONSTRAINT conferir_equipamentos_coleta
CHECK (CASE WHEN json_typeof(equipamentos) = 'array' THEN json_array_length(equipamentos) <= 10 ELSE false END);
