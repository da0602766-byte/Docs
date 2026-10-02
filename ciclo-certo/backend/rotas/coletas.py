# As rotas traduzem os pedidos HTTP de coleta sem executar regra de negocio.
from datetime import date
from typing import Optional

from fastapi import APIRouter, HTTPException, status

from esquemas.coleta import ColetaEntrada, ColetaSaida
from servicos import coleta as servico_coleta


# Agrupa os endpoints de coleta sob um caminho REST unico.
router = APIRouter(prefix="/coletas", tags=["Coletas"])


# Lista as coletas e aceita os filtros opcionais que cada perfil da cartilha precisa.
@router.get("", response_model=list[ColetaSaida])
def listar_coletas(dia: Optional[date] = None, morador_id: Optional[int] = None):
    dia_formatado = dia.isoformat() if dia is not None else None
    return servico_coleta.listar_coletas(dia_formatado, morador_id)


# Mostra uma coleta especifica para exibir seu contexto e seus pontos.
@router.get("/{coleta_id}", response_model=ColetaSaida)
def buscar_coleta(coleta_id: int):
    coleta = servico_coleta.buscar_coleta(coleta_id)
    if coleta is None:
        raise HTTPException(status_code=404, detail="Coleta nao encontrada.")
    return coleta


# Agenda uma coleta nova e usa 201 porque um recurso foi criado.
@router.post("", response_model=ColetaSaida, status_code=status.HTTP_201_CREATED)
def agendar_coleta(dados_entrada: ColetaEntrada):
    resultado = servico_coleta.agendar_coleta(dados_entrada)
    if isinstance(resultado, str):
        raise HTTPException(status_code=404, detail=resultado)
    return resultado
