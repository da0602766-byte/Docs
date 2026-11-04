"""Consultas e expurgo transacional; o serviço decide as permissões."""
from sqlalchemy import select, delete, update
from modelos.mercado import Produto, Pedido
from modelos.usuario import Usuario
from modelos.coleta import Coleta
from modelos.operacao import Movimento, Notificacao, Comprovante
from modelos.pesagem import Pesagem

def produtos(s):
    return list(s.scalars(select(Produto).order_by(Produto.pontos, Produto.id)))

def produto(s, id):
    return s.scalar(select(Produto).where(Produto.id == id).with_for_update().execution_options(populate_existing=True))

def pedidos(s, usuario_id):
    return list(s.scalars(select(Pedido).where(Pedido.usuario_id == usuario_id).order_by(Pedido.id.desc())))

def usuarios(s):
    return list(s.scalars(select(Usuario).order_by(Usuario.nome, Usuario.id)))

def avaliacoes(s, publicas=False):
    q = select(Coleta).where(Coleta.avaliada_em.is_not(None), Coleta.comentario != "")
    if publicas:
        q = q.where(Coleta.depoimento_publicado.is_(True), Coleta.autoriza_depoimento.is_(True))
    return list(s.scalars(q.order_by(Coleta.avaliada_em.desc())))

def expurgar(s, coleta):
    # O extrato permanece válido, sem referência a dados pessoais da coleta apagada.
    s.execute(update(Movimento).where(Movimento.coleta_id == coleta.id).values(coleta_id=None))
    for modelo in (Notificacao, Comprovante, Pesagem):
        s.execute(delete(modelo).where(modelo.coleta_id == coleta.id))
    s.delete(coleta)

def salvar_pedido(s, **dados):
    pedido = Pedido(**dados)
    s.add(pedido)
    s.flush()
    return pedido


def criar_produto(s):
    p = Produto()
    s.add(p)
    return p
