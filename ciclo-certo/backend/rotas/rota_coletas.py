"""Somente a cooperativa pode calcular uma rota com endereços dos pedidos."""
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import StringConstraints

import configuracao
from banco import obter_sessao
from esquemas.operacao import Entrada
from rotas.autenticacao import exigir_cooperativa
from servicos import rota_coletas

router = APIRouter(prefix="/rota-coletas", tags=["Rota de coletas"], dependencies=[Depends(exigir_cooperativa)])


class PedidoRota(Entrada):
    dia: date
    hora: Annotated[str, StringConstraints(pattern=r"^(?:[01][0-9]|2[0-3]):[0-5][0-9]$")] | None = None
    origem: Annotated[str, StringConstraints(strip_whitespace=True, min_length=10, max_length=160)]


@router.get("")
def disponibilidade():
    return {"disponivel": bool(configuracao.openrouteservice_api_key)}


@router.post("")
def sugerir(dados: PedidoRota, sessao=Depends(obter_sessao)):
    return rota_coletas.sugerir(sessao, dados.dia, dados.hora, dados.origem)
