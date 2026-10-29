"""Acesso transacional: bloqueios serializam agenda, coleta e carteira."""
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from modelos.coleta import Coleta
from modelos.usuario import Usuario
from modelos.pesagem import Pesagem
from modelos.operacao import Horario, Comprovante, Notificacao, Movimento


def bloquear(sessao, modelo, identificador):
    return sessao.scalar(select(modelo).where(modelo.id == identificador).with_for_update().execution_options(populate_existing=True))


def coleta(sessao, identificador):
    return bloquear(sessao, Coleta, identificador)


def usuario(sessao, identificador):
    return bloquear(sessao, Usuario, identificador)


def nomes(sessao, identificadores):
    """Resolve os nomes em lote para evitar uma consulta extra por coleta na rota."""
    return dict(sessao.execute(select(Usuario.id, Usuario.nome).where(Usuario.id.in_(identificadores))).all())


def remover_pesagem(sessao, peso):
    sessao.delete(peso)


def sincronizar(sessao):
    sessao.flush()


def horario(sessao, dia, hora, capacidade):
    """A unicidade resolve criação simultânea; o bloqueio protege a contagem de reservas."""
    filtro = select(Horario).where(Horario.dia == dia, Horario.hora == hora)
    registro = sessao.scalar(filtro)
    if registro is None:
        try:
            with sessao.begin_nested():
                sessao.add(Horario(dia=dia, hora=hora, capacidade=capacidade))
                sessao.flush()
        except IntegrityError:
            pass
    return sessao.scalar(filtro.with_for_update().execution_options(populate_existing=True))


def ocupacao(sessao, dia, hora):
    return sessao.scalar(select(func.count()).select_from(Coleta).where(Coleta.dia == dia, Coleta.hora == hora, Coleta.situacao != "cancelada"))


def agenda(sessao, inicio, fim):
    horarios = list(sessao.scalars(select(Horario).where(Horario.dia >= inicio, Horario.dia <= fim)))
    ocupados = sessao.execute(select(Coleta.dia, Coleta.hora, func.count()).where(Coleta.dia >= inicio, Coleta.dia <= fim, Coleta.situacao != "cancelada").group_by(Coleta.dia, Coleta.hora)).all()
    return {(h.dia, h.hora): h.capacidade for h in horarios}, {(d, h): n for d, h, n in ocupados}


def nova_coleta(sessao, dados):
    registro = Coleta(**dados)
    sessao.add(registro)
    sessao.flush()
    return registro


def pesagens(sessao, coleta_id):
    return list(sessao.scalars(select(Pesagem).where(Pesagem.coleta_id == coleta_id).order_by(Pesagem.id)))


def nova_pesagem(sessao, dados):
    registro = Pesagem(**dados)
    sessao.add(registro)
    sessao.flush()
    return registro


def comprovante(sessao, coleta_id, dados=None):
    if dados is not None:
        sessao.add(Comprovante(coleta_id=coleta_id, **dados))
    return sessao.get(Comprovante, coleta_id) if dados is None else None


def notificar(sessao, coleta, tipo, mensagem, agora):
    registro = sessao.scalar(select(Notificacao).where(Notificacao.coleta_id == coleta.id, Notificacao.tipo == tipo))
    if registro is None:
        registro = Notificacao(coleta_id=coleta.id, usuario_id=coleta.morador_id, tipo=tipo)
        sessao.add(registro)
    registro.mensagem, registro.criado_em, registro.lida = mensagem, agora, False


def notificacoes(sessao, usuario_id):
    return list(sessao.scalars(select(Notificacao).where(Notificacao.usuario_id == usuario_id).order_by(Notificacao.criado_em.desc())))


def movimentos(sessao, usuario_id):
    return list(sessao.scalars(select(Movimento).where(Movimento.usuario_id == usuario_id).order_by(Movimento.id.desc())))


def movimento(sessao, dados):
    sessao.add(Movimento(**dados))


def confirmar(sessao):
    sessao.commit()
