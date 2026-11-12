"""Contrato limitado a materiais; identidade e endereço não fazem parte da entrada."""
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, model_validator


class Estrutura(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class Esclarecimento(Estrutura):
    pergunta: str = Field(min_length=1, max_length=300)
    resposta: str = Field(min_length=1, max_length=300)


class PedidoSugestao(Estrutura):
    descricao: str = Field(min_length=2, max_length=2000)
    esclarecimentos: list[Esclarecimento] = Field(default_factory=list, max_length=4)


class ItemSugerido(Estrutura):
    descricao: str = Field(min_length=1, max_length=160)
    categoria: Literal["papel", "vidro", "plástico", "metal"] | None


class SugestaoMateriais(Estrutura):
    estado: Literal["sugestao", "esclarecer", "fora_do_escopo"]
    itens: list[ItemSugerido] = Field(max_length=30)
    pergunta: str | None = Field(max_length=300)
    mensagem: str = Field(min_length=1, max_length=500)

    # A prévia deve ser utilizável, e pedidos de esclarecimento precisam de pergunta.
    @model_validator(mode="after")
    def conferir_estado(self):
        if self.estado == "esclarecer" and not (self.pergunta or "").strip():
            raise ValueError("Esclarecimento exige uma pergunta.")
        if self.estado == "sugestao" and not self.itens:
            raise ValueError("Sugestão exige ao menos um item.")
        if self.estado != "esclarecer" and self.pergunta is not None:
            raise ValueError("Pergunta só é permitida no esclarecimento.")
        if self.estado == "fora_do_escopo" and self.itens:
            raise ValueError("Recusa não deve sugerir materiais.")
        return self
