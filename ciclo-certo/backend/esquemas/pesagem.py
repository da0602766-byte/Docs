# Os esquemas validam o material da cartilha e a leitura positiva da balança.
from pydantic import BaseModel, ConfigDict, Field


# A coleta é indicada no caminho; o perfil autorizado vem do token.
class PesagemEntrada(BaseModel):
    material: str = Field(pattern="^(papel|vidro|plástico|metal)$")
    # Aceita pesos positivos finitos, sem inventar um teto em quilos para a cooperativa.
    quilos: float = Field(gt=0, allow_inf_nan=False)


# A saída lê os atributos do registro persistido sem alterar o contrato do frontend.
class PesagemSaida(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(gt=0)
    coleta_id: int = Field(gt=0)
    material: str = Field(pattern="^(papel|vidro|plástico|metal)$")
    quilos: float = Field(gt=0, allow_inf_nan=False)
    pontos: float = Field(ge=0, allow_inf_nan=False)
