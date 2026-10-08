# A identificação do morador vem do login, nunca do corpo do agendamento.
from datetime import date
from pydantic import BaseModel, Field


# Recebe somente os dados do agendamento; campos extras não alteram o dono.
class ColetaEntrada(BaseModel):
    endereco: str = Field(min_length=10, max_length=160)
    dia: date
    materiais_informados: list[str] = Field(min_length=1, max_length=6)


# Mantém o contrato de saída das quatro telas existentes.
class ColetaSaida(BaseModel):
    id: int = Field(gt=0)
    morador_id: int = Field(gt=0)
    nome_morador: str = Field(min_length=2, max_length=80)
    endereco: str = Field(min_length=10, max_length=160)
    dia: date
    materiais_informados: list[str]
    situacao: str = Field(pattern="^(agendada|coletada)$")
    pontos: float = Field(ge=0)
