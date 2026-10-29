"""Entradas do fluxo: sem dono, preço ou pontos controláveis pelo cliente."""
from datetime import date
from decimal import Decimal
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, SecretStr, EmailStr, model_validator


class Entrada(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class Agendamento(Entrada):
    endereco: str = Field(min_length=10, max_length=160)
    dia: date
    hora: str = Field(pattern=r"^\d{2}:\d{2}$")
    materiais_informados: list[str] = Field(min_length=1, max_length=30)


class Assumir(Entrada):
    confirmar: Literal[True]
    observacao: str = Field(default="", max_length=300)


class Peso(Entrada):
    material: str = Field(max_length=40)
    quilos: Decimal = Field(gt=0, max_digits=12, decimal_places=3, allow_inf_nan=False)


class Cancelamento(Entrada):
    motivo: str = Field(min_length=10, max_length=500)


class Finalizacao(Entrada):
    versao: int = Field(ge=0)
    foto: str = Field(max_length=2200000)
    assinatura: str = Field(max_length=350000)
    nome_signatario: str = Field(min_length=2, max_length=80)
    aceite: Literal[True]


class Avaliacao(Entrada):
    nota: int = Field(ge=1, le=5)
    comentario: str = Field(default="", max_length=500)


class Preferencia(Entrada):
    recompensa: Literal["dinheiro", "pontos"]


class Resgate(Entrada):
    pontos: int = Field(gt=0, le=2000000000)
    destino: Literal["dinheiro", "troca"]
    chave: str = Field(min_length=16, max_length=64, pattern=r"^[a-zA-Z0-9-]+$")


class Disponibilidade(Entrada):
    dia: date
    hora: str = Field(pattern=r"^\d{2}:\d{2}$")
    capacidade: int = Field(ge=0, le=100)


class Perfil(Entrada):
    senha_atual: SecretStr = Field(min_length=1, max_length=72)
    email: EmailStr | None = Field(default=None, max_length=100)
    nova_senha: SecretStr | None = Field(default=None, min_length=8, max_length=72)

    @model_validator(mode="before")
    @classmethod
    def ocultar_segredos(cls, dados):
        return {k: SecretStr(v) if k in ("senha_atual", "nova_senha") and isinstance(v, str) else v for k, v in dados.items()} if isinstance(dados, dict) else dados
