# As rotas separam a consulta do histórico da gravação exclusiva da cooperativa.
from fastapi import APIRouter, Depends, HTTPException

from banco import obter_sessao
from esquemas.pesagem import PesagemEntrada, PesagemSaida
from rotas.autenticacao import exigir_cooperativa, obter_usuario_atual
from servicos import pesagem as servico_pesagem
from servicos.excecoes import AcessoNegado, MaterialInvalido

router = APIRouter(prefix="/coletas/{coleta_id}/pesagens", tags=["Pesagens"])


# Moradores veem apenas as pesagens de suas coletas; a cooperativa consulta todas.
@router.get("", response_model=list[PesagemSaida])
def listar_pesagens(coleta_id: int, usuario=Depends(obter_usuario_atual), sessao=Depends(obter_sessao)):
    try:
        pesagens = servico_pesagem.listar_pesagens(sessao, coleta_id, usuario)
    except AcessoNegado as erro:
        raise HTTPException(status_code=403, detail=str(erro)) from erro
    if pesagens is None:
        raise HTTPException(status_code=404, detail="Coleta não encontrada.")
    return pesagens


# O perfil é verificado antes de registrar qualquer alteração no banco.
@router.post("", response_model=PesagemSaida, status_code=201)
def registrar_pesagem(coleta_id: int, dados: PesagemEntrada,
                      usuario=Depends(exigir_cooperativa), sessao=Depends(obter_sessao)):
    try:
        pesagem = servico_pesagem.registrar_pesagem(sessao, coleta_id, dados, usuario)
    except MaterialInvalido as erro:
        raise HTTPException(status_code=422, detail=str(erro)) from erro
    if pesagem is None:
        raise HTTPException(status_code=404, detail="Coleta não encontrada.")
    return pesagem
