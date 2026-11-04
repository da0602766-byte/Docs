"""Fronteira HTTP: toda participação exige a identidade validada da conta."""
from typing import Literal
from fastapi import APIRouter, Depends, Query
from banco import obter_sessao
from rotas.autenticacao import obter_usuario_atual
from esquemas.comunidade import Categoria, Perfil, NovaPublicacao, NovoComentario, NovaDenuncia, Decisao
from servicos import comunidade as servico

router = APIRouter(prefix='/comunidade', tags=['Comunidade'])


@router.get('/resumo')
def resumo(sessao=Depends(obter_sessao), usuario=Depends(obter_usuario_atual)):
    return servico.resumo(sessao, usuario)


@router.get('/publicacoes')
def listar(modo: Literal['feed', 'minhas', 'moderacao'] = 'feed', categoria: Categoria | None = None,
           perfil: Perfil | None = None, antes: int | None = Query(None, gt=0), limite: int = Query(20, ge=1, le=50),
           sessao=Depends(obter_sessao), usuario=Depends(obter_usuario_atual)):
    return servico.listar(sessao, usuario, modo, categoria, perfil, antes, limite)


@router.post('/publicacoes', status_code=201)
def criar(dados: NovaPublicacao, sessao=Depends(obter_sessao), usuario=Depends(obter_usuario_atual)):
    return servico.criar(sessao, usuario, dados)


@router.post('/publicacoes/{identificador}/moderar')
def moderar(identificador: int, dados: Decisao, sessao=Depends(obter_sessao), usuario=Depends(obter_usuario_atual)):
    return servico.moderar(sessao, usuario, identificador, dados)


@router.delete('/publicacoes/{identificador}')
def excluir(identificador: int, sessao=Depends(obter_sessao), usuario=Depends(obter_usuario_atual)):
    return servico.excluir(sessao, usuario, identificador)


@router.get('/publicacoes/{identificador}/comentarios')
def comentarios(identificador: int, antes: int | None = Query(None, gt=0), limite: int = Query(20, ge=1, le=50),
                sessao=Depends(obter_sessao), usuario=Depends(obter_usuario_atual)):
    return servico.listar_comentarios(sessao, usuario, identificador, antes, limite)


@router.post('/publicacoes/{identificador}/comentarios', status_code=201)
def comentar(identificador: int, dados: NovoComentario, sessao=Depends(obter_sessao), usuario=Depends(obter_usuario_atual)):
    return servico.comentar(sessao, usuario, identificador, dados)


@router.delete('/comentarios/{identificador}')
def excluir_comentario(identificador: int, sessao=Depends(obter_sessao), usuario=Depends(obter_usuario_atual)):
    return servico.excluir_comentario(sessao, usuario, identificador)


@router.post('/publicacoes/{identificador}/denuncias')
def denunciar(identificador: int, dados: NovaDenuncia, sessao=Depends(obter_sessao), usuario=Depends(obter_usuario_atual)):
    return servico.denunciar(sessao, usuario, identificador, dados)


@router.get('/denuncias')
def denuncias(antes: int | None = Query(None, gt=0), limite: int = Query(20, ge=1, le=50),
              sessao=Depends(obter_sessao), usuario=Depends(obter_usuario_atual)):
    return servico.listar_denuncias(sessao, usuario, antes, limite)


@router.post('/denuncias/{identificador}/resolver')
def resolver(identificador: int, sessao=Depends(obter_sessao), usuario=Depends(obter_usuario_atual)):
    return servico.resolver_denuncia(sessao, usuario, identificador)
