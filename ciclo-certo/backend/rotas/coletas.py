# As rotas recebem o usuário autenticado e traduzem as recusas para HTTP.
from datetime import date
from fastapi import APIRouter, Depends, HTTPException

from banco import obter_sessao
from esquemas.coleta import ColetaEntrada, ColetaSaida
from rotas.autenticacao import exigir_morador, obter_usuario_atual
from servicos import coleta as servico_coleta
from servicos.excecoes import AcessoNegado

router = APIRouter(prefix="/coletas", tags=["Coletas"])


# O serviço limita a lista do morador, mantendo os filtros de dia e da rota da cooperativa.
@router.get("", response_model=list[ColetaSaida])
def listar_coletas(dia: date | None = None, morador_id: int | None = None,
                   usuario=Depends(obter_usuario_atual), sessao=Depends(obter_sessao)):
    try:
        return servico_coleta.listar_coletas(sessao, usuario, dia, morador_id)
    except AcessoNegado as erro:
        raise HTTPException(status_code=403, detail=str(erro)) from erro


# O detalhe respeita a propriedade do morador e continua devolvendo 404 quando não existe.
@router.get("/{coleta_id}", response_model=ColetaSaida)
def buscar_coleta(coleta_id: int, usuario=Depends(obter_usuario_atual), sessao=Depends(obter_sessao)):
    try:
        coleta = servico_coleta.buscar_coleta(sessao, coleta_id, usuario)
    except AcessoNegado as erro:
        raise HTTPException(status_code=403, detail=str(erro)) from erro
    if coleta is None:
        raise HTTPException(status_code=404, detail="Coleta não encontrada.")
    return coleta


# O agendamento não recebe identificação do dono no corpo.
@router.post("", response_model=ColetaSaida, status_code=201)
def agendar_coleta(dados: ColetaEntrada, usuario=Depends(exigir_morador), sessao=Depends(obter_sessao)):
    return servico_coleta.agendar_coleta(sessao, dados, usuario)
