# Os esquemas validam o agendamento e padronizam a coleta devolvida ao front.
from datetime import date

from pydantic import BaseModel, Field


# Recebe somente os dados que a moradora informa ao agendar uma coleta.
class ColetaEntrada(BaseModel):
    morador_id: int = Field(gt=0)
    endereco: str = Field(min_length=10, max_length=160)
    dia: date
    materiais_informados: list[str] = Field(min_length=1, max_length=6)


# Devolve a coleta com os dados calculados e o nome que a interface precisa mostrar.
class ColetaSaida(BaseModel):
    id: int = Field(gt=0)
    morador_id: int = Field(gt=0)
    nome_morador: str = Field(min_length=2, max_length=80)
    endereco: str = Field(min_length=10, max_length=160)
    dia: date
    materiais_informados: list[str]
    situacao: str = Field(pattern="^(agendada|coletada)$")
    pontos: float = Field(ge=0)
