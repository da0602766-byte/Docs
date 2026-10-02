# As rotas de pesagem deixam o calculo de pontos concentrado no servico.
from fastapi import APIRouter, HTTPException, status

from esquemas.pesagem import PesagemEntrada, PesagemSaida
from servicos import pesagem as servico_pesagem


# Mantem as pesagens como recurso da coleta a que elas pertencem.
router = APIRouter(prefix="/coletas/{coleta_id}/pesagens", tags=["Pesagens"])


# Lista as pesagens de uma coleta para a moradora conferir de onde vieram os pontos.
@router.get("", response_model=list[PesagemSaida])
def listar_pesagens(coleta_id: int):
    pesagens = servico_pesagem.listar_pesagens(coleta_id)
    if pesagens is None:
        raise HTTPException(status_code=404, detail="Coleta nao encontrada.")
    return pesagens


# Registra uma pesagem e usa 201 porque ela passa a existir na memoria.
@router.post("", response_model=PesagemSaida, status_code=status.HTTP_201_CREATED)
def registrar_pesagem(coleta_id: int, dados_entrada: PesagemEntrada):
    resultado = servico_pesagem.registrar_pesagem(coleta_id, dados_entrada)
    if isinstance(resultado, str):
        codigo = 404 if resultado == "Coleta nao encontrada." else 422
        raise HTTPException(status_code=codigo, detail=resultado)
    return resultado
