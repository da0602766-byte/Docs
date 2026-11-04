"""Endpoints públicos opt-in e ações autenticadas da participação."""
from datetime import datetime
from typing import Literal
from uuid import UUID
from html import escape
from fastapi import APIRouter,Depends,Query
from fastapi.responses import HTMLResponse
from pydantic import Field
from banco import obter_sessao
from rotas.autenticacao import obter_usuario_atual
from esquemas.comunidade import Entrada,NovaPublicacao,Categoria
from servicos import participacao as servico,comunidade

router=APIRouter(prefix='/comunidade',tags=['Participação'])
class Escolha(Entrada):
    valor: bool
class Visita(Entrada):
    sessao: UUID
class Acao(Entrada):
    tipo: Literal['evento','pergunta','destaque']
    titulo: str=Field(min_length=5,max_length=100)
    descricao: str=Field(min_length=10,max_length=1200)
    local: str|None=Field(default=None,max_length=160)
    inicio: datetime
    fim: datetime
    publicacao_id: int|None=Field(default=None,gt=0)

@router.get('/publico')
def publico(antes:int|None=Query(None,gt=0),categoria:Categoria|None=None,sessao=Depends(obter_sessao)):
    return servico.publico(sessao,antes,categoria or '')
@router.get('/publico/{identificador}')
def detalhe(identificador:int,sessao=Depends(obter_sessao)):
    return servico.publico(sessao,None,'',identificador)['itens'][0]
@router.get('/compartilhar/{identificador}',response_class=HTMLResponse)
def compartilhar(identificador:int,sessao=Depends(obter_sessao)):
    p=servico.publico(sessao,None,'',identificador)['itens'][0]
    titulo=escape(p['categoria']+' · Ciclo Certo',quote=True);descricao=escape(p['conteudo'][:200],quote=True)
    destino=f'https://ciclo-certo.vercel.app/comunidade/publicacao/{identificador}'
    return HTMLResponse(f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>{titulo}</title><meta property="og:title" content="{titulo}"><meta property="og:description" content="{descricao}"><meta property="og:type" content="article"><meta property="og:image" content="https://ciclo-certo.vercel.app/imagens/reciclaveis.jpg"><meta property="og:site_name" content="Ciclo Certo"><meta property="og:url" content="https://ciclo-certo.vercel.app/p/{identificador}"></head><body><h1>{titulo}</h1><p>{descricao}</p><a href="{destino}">Abrir publicação</a><script>location.replace("{destino}")</script></body></html>',headers={'Cache-Control':'no-store'})
@router.put('/publicacoes/{identificador}/favorito')
def favorito(identificador:int,dados:Escolha,sessao=Depends(obter_sessao),usuario=Depends(obter_usuario_atual)):
    return servico.salvar(sessao,usuario,identificador,dados.valor)
@router.put('/publicacoes/{identificador}/reenviar')
def reenviar(identificador:int,dados:NovaPublicacao,sessao=Depends(obter_sessao),usuario=Depends(obter_usuario_atual)):
    return servico.reenviar(sessao,usuario,identificador,dados)
@router.get('/publicacoes/{identificador}/historico')
def historico(identificador:int,sessao=Depends(obter_sessao),usuario=Depends(obter_usuario_atual)):
    return servico.historico(sessao,usuario,identificador)
@router.get('/avisos')
def avisos(antes:int|None=Query(None,gt=0),sessao=Depends(obter_sessao),usuario=Depends(obter_usuario_atual)):
    return servico.avisos(sessao,usuario,antes)
@router.get('/impacto')
def impacto(sessao=Depends(obter_sessao),usuario=Depends(obter_usuario_atual)):
    return servico.impacto(sessao,usuario)
@router.get('/acoes/publicas')
def acoes_publicas(sessao=Depends(obter_sessao)):
    return servico.acoes(sessao)
@router.get('/acoes')
def acoes(sessao=Depends(obter_sessao),usuario=Depends(obter_usuario_atual)):
    return servico.acoes(sessao,usuario)
@router.post('/acoes',status_code=201)
def criar_acao(dados:Acao,sessao=Depends(obter_sessao),usuario=Depends(obter_usuario_atual)):
    return servico.criar_acao(sessao,usuario,dados)
@router.delete('/acoes/{identificador}')
def cancelar(identificador:int,sessao=Depends(obter_sessao),usuario=Depends(obter_usuario_atual)):
    return servico.cancelar(sessao,usuario,identificador)
@router.put('/acoes/{identificador}/inscricao')
def participar(identificador:int,dados:Escolha,sessao=Depends(obter_sessao),usuario=Depends(obter_usuario_atual)):
    return servico.participar(sessao,usuario,identificador,dados.valor)
@router.post('/visita')
def visita(dados:Visita,sessao=Depends(obter_sessao)):
    return servico.registrar_visita(sessao,dados.sessao)
@router.post('/acesso')
def acesso(sessao=Depends(obter_sessao),usuario=Depends(obter_usuario_atual)):
    return servico.registrar_acesso(sessao,usuario)
@router.get('/metricas')
def metricas(sessao=Depends(obter_sessao),usuario=Depends(obter_usuario_atual)):
    return servico.metricas(sessao,usuario)

@router.get("/item/{identificador}")
def item(identificador:int,sessao=Depends(obter_sessao),usuario=Depends(obter_usuario_atual)):
    return servico.detalhe(sessao,usuario,identificador)

@router.post("/conversao")
def conversao(dados:Visita,sessao=Depends(obter_sessao),usuario=Depends(obter_usuario_atual)):
    return servico.conversao(sessao,usuario,dados.sessao)
