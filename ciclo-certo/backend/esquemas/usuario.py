# Os esquemas separam a senha recebida dos dados que podem ser devolvidos pela API.
from typing import Annotated
from pydantic import BaseModel, ConfigDict, EmailStr, Field, SecretStr, StringConstraints, model_validator

EnderecoColeta = Annotated[str, StringConstraints(strip_whitespace=True, min_length=10, max_length=160)]


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
    endereco_coleta: EnderecoColeta | None = None

    @model_validator(mode="after")
    def restringir_endereco_ao_morador(self):
        if self.tipo != "morador" and self.endereco_coleta is not None:
            raise ValueError("O endereço de retirada é exclusivo do morador.")
        return self


# from_attributes permite ler os objetos do repositório sem expor senha ou hash.
class UsuarioSaida(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    administrador: bool = False
    id: int = Field(gt=0)
    nome: str = Field(min_length=2, max_length=80)
    email: str | None
    email_verificado: bool = False
    tipo: str = Field(pattern="^(morador|cooperativa)$")


# O formato segue o OAuth2 utilizado pelo botão Authorize do Swagger.
class PerfilProprio(UsuarioSaida):
    endereco_coleta: str | None = None


class EnderecoPreferido(BaseModel):
    model_config = ConfigDict(extra="forbid")
    endereco_coleta: EnderecoColeta | None


class Token(BaseModel):
    access_token: str
    token_type: str


class ConfirmacaoEmail(BaseModel):
    token: SecretStr = Field(min_length=43, max_length=43)
