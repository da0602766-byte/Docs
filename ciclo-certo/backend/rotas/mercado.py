"""Contratos HTTP do mercado e gestão; identidade obtida exclusivamente do token."""
from fastapi import APIRouter, Depends
from datetime import date
from pydantic import Field, model_validator
from esquemas.operacao import Entrada
from esquemas.usuario import EnderecoColeta
from banco import obter_sessao
from rotas.autenticacao import obter_usuario_atual
from servicos import mercado as servico

router = APIRouter(tags=['Mercado e gestão'])

class Resgate(Entrada):
    produto_id: int = Field(gt=0)
    chave: str = Field(min_length=16, max_length=64, pattern=r'^[a-zA-Z0-9-]+$')
    endereco_entrega: EnderecoColeta | None = None
    data_entrega: date | None = None

    @model_validator(mode="after")
    def validar_entrega(self):
        if (self.endereco_entrega is None) != (self.data_entrega is None):
            raise ValueError("Informe o endereço e a data de entrega juntos.")
        return self

class Moderacao(Entrada):
    publicar: bool

class Exclusao(Entrada):
    confirmacao: str = Field(max_length=40)

@router.get('/mercado')
def loja(u=Depends(obter_usuario_atual), s=Depends(obter_sessao)):
    return servico.loja(s, u)

@router.post('/mercado/resgates')
def resgatar(dados: Resgate, u=Depends(obter_usuario_atual), s=Depends(obter_sessao)):
    return servico.resgatar(s, dados, u)

@router.get('/gestao/usuarios')
def usuarios(u=Depends(obter_usuario_atual), s=Depends(obter_sessao)):
    return servico.usuarios(s, u)

@router.get('/gestao/avaliacoes')
def avaliacoes(u=Depends(obter_usuario_atual), s=Depends(obter_sessao)):
    return servico.avaliacoes(s, u)

@router.get('/depoimentos')
def depoimentos(s=Depends(obter_sessao)):
    return servico.avaliacoes(s)

@router.put('/gestao/avaliacoes/{id}')
def moderar(id: int, dados: Moderacao, u=Depends(obter_usuario_atual), s=Depends(obter_sessao)):
    return servico.moderar(s, id, dados, u)

@router.delete('/gestao/historico/{id}')
def excluir(id: int, dados: Exclusao, u=Depends(obter_usuario_atual), s=Depends(obter_sessao)):
    return servico.excluir(s, id, dados, u)


class ProdutoEntrada(Entrada):
    nome: str = Field(min_length=2,max_length=100)
    descricao: str = Field(min_length=5,max_length=500)
    categoria: str = Field(min_length=2,max_length=40)
    pontos: int = Field(gt=0,le=2000000000)
    estoque: int = Field(ge=0,le=1000000)
    foto: str = Field(pattern=r'^/imagens/produtos/(ecobag|horta|caderno|garrafa|feira|compostagem|lanche|estojo)\.jpg$')
    ativo: bool = True

@router.get('/gestao/produtos')
def produtos(u=Depends(obter_usuario_atual),s=Depends(obter_sessao)):
    return servico.catalogo_gestao(s,u)

@router.post('/gestao/produtos',status_code=201)
def criar_produto(dados: ProdutoEntrada,u=Depends(obter_usuario_atual),s=Depends(obter_sessao)):
    return servico.salvar_produto(s,dados,u)

@router.put('/gestao/produtos/{id}')
def editar_produto(id:int,dados: ProdutoEntrada,u=Depends(obter_usuario_atual),s=Depends(obter_sessao)):
    return servico.salvar_produto(s,dados,u,id)
