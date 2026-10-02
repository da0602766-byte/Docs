# Os esquemas definem quais dados de usuario podem sair da API.
from pydantic import BaseModel, Field


# Representa um perfil que o front pode mostrar para a pessoa escolher sem login.
class UsuarioSaida(BaseModel):
    id: int = Field(gt=0)
    nome: str = Field(min_length=2, max_length=80)
    tipo: str = Field(pattern="^(morador|cooperativa)$")
