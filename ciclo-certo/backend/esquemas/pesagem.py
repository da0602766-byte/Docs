# Os esquemas garantem que cada pesagem tenha um material valido e quilos positivos.
from pydantic import BaseModel, Field


# Recebe os dois dados medidos na balanca para registrar uma pesagem.
class PesagemEntrada(BaseModel):
    material: str = Field(pattern="^(papel|vidro|plástico|metal)$")
    quilos: float = Field(gt=0, le=1000)


# Devolve a pesagem com os pontos que aquele material gerou na coleta.
class PesagemSaida(BaseModel):
    id: int = Field(gt=0)
    coleta_id: int = Field(gt=0)
    material: str = Field(pattern="^(papel|vidro|plástico|metal)$")
    quilos: float = Field(gt=0)
    pontos: float = Field(ge=0)
