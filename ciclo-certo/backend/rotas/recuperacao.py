"""A solicitação conhece apenas o e-mail; a troca exige posse do link temporário."""
from fastapi import APIRouter, Depends
from pydantic import EmailStr, SecretStr, Field, model_validator
from esquemas.operacao import Entrada
from banco import obter_sessao
from servicos import recuperacao as servico

router = APIRouter(tags=['Recuperação de acesso'])

class Solicitar(Entrada):
    email: EmailStr = Field(max_length=100)

class Redefinir(Entrada):
    token: SecretStr = Field(min_length=32, max_length=100)
    senha: SecretStr = Field(min_length=8, max_length=72)
    @model_validator(mode='before')
    @classmethod
    def ocultar(cls, dados):
        return {k: SecretStr(v) if k in ('token','senha') and isinstance(v,str) else v for k,v in dados.items()} if isinstance(dados,dict) else dados

@router.post('/acesso/recuperar', status_code=202)
def solicitar(dados: Solicitar, s=Depends(obter_sessao)):
    return servico.solicitar(s, dados.email)

@router.post('/acesso/redefinir')
def redefinir(dados: Redefinir, s=Depends(obter_sessao)):
    return servico.redefinir(s, dados.token.get_secret_value(), dados.senha.get_secret_value())
