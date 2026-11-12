"""Rota sem persistência: somente moradores autenticados consultam a assistência."""
from fastapi import APIRouter, Depends
from esquemas.ia import PedidoSugestao, SugestaoMateriais
from rotas.autenticacao import exigir_morador
from Ia.sugestao import sugerir
from Ia.conversa import PedidoConversa, RespostaConversa, responder
from Ia.privacidade import validar_textos

router = APIRouter(prefix="/ia", tags=["Assistência aos materiais"])


# O perfil é conferido antes de qualquer acesso aos provedores.
@router.post("/sugestao-materiais", response_model=SugestaoMateriais)
def sugerir_materiais(dados: PedidoSugestao, usuario=Depends(exigir_morador)):
    validar_textos([dados.descricao, *(texto for item in dados.esclarecimentos for texto in (item.pergunta, item.resposta))], usuario)
    return sugerir(dados, usuario.id)


@router.post("/conversa", response_model=RespostaConversa)
def conversar(dados: PedidoConversa, usuario=Depends(exigir_morador)):
    validar_textos([dados.mensagem, *dados.contexto], usuario)
    return responder(dados, usuario.id)
