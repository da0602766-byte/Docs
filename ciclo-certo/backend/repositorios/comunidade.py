"""Consultas paginadas e bloqueios; decisões de negócio permanecem no serviço."""
from sqlalchemy import select, func
from modelos.usuario import Usuario
from modelos.comunidade import Publicacao, Comentario, Credito, Denuncia, Moderador, Regras


def moderador(sessao, usuario_id):
    return sessao.get(Moderador, usuario_id) is not None


def regras(sessao):
    return sessao.get(Regras, 1)


def bloquear_autor(sessao, usuario_id):
    """Serializa criação, aprovação e estorno da mesma conta, inclusive entre instâncias."""
    return sessao.scalar(select(Usuario).where(Usuario.id == usuario_id).with_for_update())


def obter(sessao, modelo, identificador, bloquear=False):
    consulta = select(modelo).where(modelo.id == identificador)
    if bloquear:
        consulta = consulta.with_for_update().execution_options(populate_existing=True)
    return sessao.scalar(consulta)


def gravar(sessao, registro):
    sessao.add(registro)
    sessao.flush()
    return registro


def cotas(sessao, usuario_id, dia, semana):
    filtro = [Credito.usuario_id == usuario_id]
    # Estornos continuam consumindo cotas: não filtrar por estornado_em.
    diaria = sessao.scalar(select(func.count()).select_from(Credito).where(*filtro, Credito.dia == dia))
    semanal = sessao.scalar(select(func.count()).select_from(Credito).where(*filtro, Credito.semana == semana))
    saldo = sessao.scalar(select(func.coalesce(func.sum(Credito.pontos), 0)).where(*filtro, Credito.estornado_em.is_(None)))
    return diaria, semanal, saldo


def credito(sessao, publicacao_id):
    return sessao.get(Credito, publicacao_id)


def atividade(sessao, modelo, autor_id, inicio):
    return sessao.execute(select(func.count(), func.max(modelo.criado_em)).where(modelo.autor_id == autor_id, modelo.criado_em >= inicio)).one()


def repetida(sessao, resumo):
    return sessao.scalar(select(Publicacao.id).where(Publicacao.resumo == resumo)) is not None


def recentes(sessao, autor_id):
    return list(sessao.scalars(select(Publicacao.normalizado).where(Publicacao.autor_id == autor_id).order_by(Publicacao.id.desc()).limit(100)))


def publicacoes(sessao, usuario_id, modo, categoria, perfil, antes, limite):
    consulta = select(Publicacao, Usuario.nome, Usuario.tipo, Credito.pontos, Credito.estornado_em).join(Usuario, Usuario.id == Publicacao.autor_id).outerjoin(Credito, Credito.publicacao_id == Publicacao.id)
    if modo == 'minhas':
        consulta = consulta.where(Publicacao.autor_id == usuario_id, Publicacao.estado != 'excluida')
    else:
        consulta = consulta.where(Publicacao.estado == ('pendente' if modo == 'moderacao' else 'aprovada'))
    if categoria:
        consulta = consulta.where(Publicacao.categoria == categoria)
    if perfil:
        consulta = consulta.where(Usuario.tipo == perfil)
    if antes:
        consulta = consulta.where(Publicacao.id < antes)
    linhas = sessao.execute(consulta.order_by(Publicacao.id.desc()).limit(limite + 1)).all()
    ids = [r[0].id for r in linhas]
    contagens = dict(sessao.execute(select(Comentario.publicacao_id, func.count()).where(Comentario.publicacao_id.in_(ids), Comentario.excluido_em.is_(None)).group_by(Comentario.publicacao_id)).all())
    return linhas, contagens


def comentarios(sessao, publicacao_id, antes, limite):
    consulta = select(Comentario, Usuario.nome, Usuario.tipo).join(Usuario, Usuario.id == Comentario.autor_id).where(Comentario.publicacao_id == publicacao_id, Comentario.excluido_em.is_(None))
    if antes:
        consulta = consulta.where(Comentario.id < antes)
    return sessao.execute(consulta.order_by(Comentario.id.desc()).limit(limite + 1)).all()


def denuncias(sessao, antes, limite):
    consulta = select(Denuncia, Publicacao.conteudo, Publicacao.estado, Comentario.conteudo, Comentario.excluido_em).join(Publicacao, Publicacao.id == Denuncia.publicacao_id).outerjoin(Comentario, Comentario.id == Denuncia.comentario_id).where(Denuncia.resolvido_em.is_(None))
    if antes:
        consulta = consulta.where(Denuncia.id < antes)
    return sessao.execute(consulta.order_by(Denuncia.id.desc()).limit(limite + 1)).all()


def denuncia_existente(sessao, autor_id, publicacao_id, comentario_id):
    return sessao.scalar(select(Denuncia).where(Denuncia.autor_id == autor_id, Denuncia.publicacao_id == publicacao_id, Denuncia.comentario_id == comentario_id))


def comentario_repetido(sessao, autor_id, publicacao_id, resumo):
    return sessao.scalar(select(Comentario.id).where(Comentario.autor_id == autor_id, Comentario.publicacao_id == publicacao_id, Comentario.resumo == resumo)) is not None
