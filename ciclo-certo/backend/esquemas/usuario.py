# Os esquemas separam a senha recebida dos dados que podem ser devolvidos pela API.
from pydantic import BaseModel, ConfigDict, EmailStr, Field, SecretStr, model_validator


# SecretStr evita mostrar a senha em representações do objeto e em mensagens de diagnóstico.
class UsuarioCriar(BaseModel):
    # Protege também a senha que poderia aparecer no contexto de um erro de validação.
    @model_validator(mode="before")
    @classmethod
    def proteger_senha_nas_validacoes(cls, dados):
        if isinstance(dados, dict) and isinstance(dados.get("senha"), str):
            return {**dados, "senha": SecretStr(dados["senha"])}
        return dados

    nome: str = Field(min_length=2, max_length=80)
    email: EmailStr = Field(max_length=100)
    senha: SecretStr = Field(min_length=8, max_length=72)
    tipo: str = Field(pattern="^(morador|cooperativa)$")


# from_attributes permite ler os objetos do repositório sem expor senha ou hash.
class UsuarioSaida(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(gt=0)
    nome: str = Field(min_length=2, max_length=80)
    email: str | None
    tipo: str = Field(pattern="^(morador|cooperativa)$")


# O formato segue o OAuth2 utilizado pelo botão Authorize do Swagger.
class Token(BaseModel):
    access_token: str
    token_type: str
