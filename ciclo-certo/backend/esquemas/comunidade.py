"""Entradas limitadas e sem campos de identidade ou pontuação controláveis pelo cliente."""
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, field_validator
from validacao_youtube import identificar_video

Categoria = Literal['Plantio', 'Reciclagem', 'Curiosidades', 'Compostagem', 'Reutilização', 'Sugestões']
Perfil = Literal['morador', 'cooperativa']


class Entrada(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class NovaPublicacao(Entrada):
    categoria: Categoria
    conteudo: str = Field(min_length=10, max_length=1200)
    youtube_url: str | None = Field(default=None, max_length=500)

    @field_validator('youtube_url')
    @classmethod
    def validar_video(cls, valor):
        identificador = identificar_video(valor)
        return f'https://www.youtube.com/watch?v={identificador}' if identificador else None


class NovoComentario(Entrada):
    conteudo: str = Field(min_length=2, max_length=500)


class NovaDenuncia(Entrada):
    motivo: str = Field(min_length=10, max_length=300)
    comentario_id: int | None = Field(default=None, gt=0)


class Decisao(Entrada):
    aprovar: bool
    motivo: str = Field(default="", max_length=300)
