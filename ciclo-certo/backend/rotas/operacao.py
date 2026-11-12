"""Rotas finas: validação HTTP e dependências; regras no serviço e SQL no repositório."""
from datetime import date
from fastapi import APIRouter, Depends
from banco import obter_sessao
from rotas.autenticacao import obter_usuario_atual
from esquemas import operacao as entrada
from servicos import operacao as servico
from servicos.catalogo import catalogo
from servicos.equipamentos import recomendar_kit

router = APIRouter(tags=["Operação"])


@router.get("/catalogo")
def obter_catalogo():
    return catalogo()


@router.get("/agenda")
def agenda(mes: str, usuario=Depends(obter_usuario_atual), sessao=Depends(obter_sessao)):
    return servico.consultar_agenda(sessao, mes)


@router.put("/agenda")
def configurar_agenda(dados: entrada.Disponibilidade, usuario=Depends(obter_usuario_atual), sessao=Depends(obter_sessao)):
    return servico.disponibilidade(sessao, dados, usuario)


@router.get("/coletas")
def listar(dia: date | None = None, morador_id: int | None = None, usuario=Depends(obter_usuario_atual), sessao=Depends(obter_sessao)):
    return servico.listar(sessao, usuario, dia, morador_id)


@router.post("/coletas", status_code=201)
def agendar(dados: entrada.Agendamento, usuario=Depends(obter_usuario_atual), sessao=Depends(obter_sessao)):
    return servico.agendar(sessao, dados, usuario)


@router.get("/coletas/{identificador}")
def detalhe(identificador: int, usuario=Depends(obter_usuario_atual), sessao=Depends(obter_sessao)):
    coleta = servico.obter_coleta(sessao, identificador, usuario)
    dados = servico.saida(sessao, coleta)
    if usuario.tipo == "cooperativa" and coleta.situacao in {"agendada", "em_coleta"}:
        dados["kit_recomendado"] = recomendar_kit(coleta.materiais_informados, coleta.peso_estimado_kg)
    return dados


@router.post("/coletas/{identificador}/assumir")
def assumir(identificador: int, dados: entrada.Assumir, usuario=Depends(obter_usuario_atual), sessao=Depends(obter_sessao)):
    return servico.assumir(sessao, identificador, dados, usuario)


@router.get("/coletas/{identificador}/pesagens")
def pesagens(identificador: int, usuario=Depends(obter_usuario_atual), sessao=Depends(obter_sessao)):
    return servico.listar_pesagens(sessao, identificador, usuario)


@router.post("/coletas/{identificador}/pesagens", status_code=201)
def pesar(identificador: int, dados: entrada.Peso, usuario=Depends(obter_usuario_atual), sessao=Depends(obter_sessao)):
    return servico.pesar(sessao, identificador, dados, usuario)


@router.put("/coletas/{identificador}/pesagens/{pesagem_id}")
def editar_peso(identificador: int, pesagem_id: int, dados: entrada.Peso, usuario=Depends(obter_usuario_atual), sessao=Depends(obter_sessao)):
    return servico.pesar(sessao, identificador, dados, usuario, pesagem_id)


@router.delete("/coletas/{identificador}/pesagens/{pesagem_id}")
def remover_peso(identificador: int, pesagem_id: int, usuario=Depends(obter_usuario_atual), sessao=Depends(obter_sessao)):
    return servico.pesar(sessao, identificador, None, usuario, pesagem_id, apagar=True)


@router.post("/coletas/{identificador}/finalizar")
def finalizar(identificador: int, dados: entrada.Finalizacao, usuario=Depends(obter_usuario_atual), sessao=Depends(obter_sessao)):
    return servico.finalizar(sessao, identificador, dados, usuario)


@router.post("/coletas/{identificador}/cancelar")
def cancelar(identificador: int, dados: entrada.Cancelamento, usuario=Depends(obter_usuario_atual), sessao=Depends(obter_sessao)):
    return servico.cancelar(sessao, identificador, dados, usuario)


@router.post("/coletas/{identificador}/solicitar-avaliacao")
def solicitar_avaliacao(identificador: int, usuario=Depends(obter_usuario_atual), sessao=Depends(obter_sessao)):
    return servico.solicitar_avaliacao(sessao, identificador, usuario)


@router.post("/coletas/{identificador}/avaliar")
def avaliar(identificador: int, dados: entrada.Avaliacao, usuario=Depends(obter_usuario_atual), sessao=Depends(obter_sessao)):
    return servico.avaliar(sessao, identificador, dados, usuario)


@router.get("/coletas/{identificador}/comprovante")
def comprovante(identificador: int, usuario=Depends(obter_usuario_atual), sessao=Depends(obter_sessao)):
    return servico.consultar_comprovante(sessao, identificador, usuario)


@router.get("/notificacoes")
def notificacoes(usuario=Depends(obter_usuario_atual), sessao=Depends(obter_sessao)):
    return servico.listar_notificacoes(sessao, usuario)


@router.put("/notificacoes/{identificador}/lida")
def ler_notificacao(identificador: int, usuario=Depends(obter_usuario_atual), sessao=Depends(obter_sessao)):
    return servico.ler_notificacao(sessao, identificador, usuario)


@router.get("/carteira")
def carteira(usuario=Depends(obter_usuario_atual), sessao=Depends(obter_sessao)):
    return servico.carteira(sessao, usuario)


@router.patch("/usuarios/eu")
def perfil(dados: entrada.Perfil, usuario=Depends(obter_usuario_atual), sessao=Depends(obter_sessao)):
    return servico.alterar_perfil(sessao, dados, usuario)


# O serviço verifica autoria e situação antes de persistir o kit.
@router.put("/coletas/{identificador}/equipamentos")
def salvar_equipamentos(identificador: int, dados: entrada.KitEquipamentos, usuario=Depends(obter_usuario_atual), sessao=Depends(obter_sessao)):
    return servico.salvar_equipamentos(sessao, identificador, dados, usuario)
