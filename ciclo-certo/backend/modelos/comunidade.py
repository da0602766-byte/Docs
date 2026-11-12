"""Persistência da comunidade, sem vínculo com saldos ou valores das coletas."""
from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey, Boolean
from banco import Base


class Moderador(Base):
    __tablename__ = "comunidade_moderadores"
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), primary_key=True)


class Regras(Base):
    __tablename__ = "comunidade_regras"
    id = Column(Integer, primary_key=True)
    pontos = Column(Integer, nullable=False)
    limite_dia = Column(Integer, nullable=False)
    limite_semana = Column(Integer, nullable=False)


class Publicacao(Base):
    __tablename__ = "comunidade_publicacoes"
    id = Column(Integer, primary_key=True)
    autor_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    categoria = Column(String(20), nullable=False)
    conteudo = Column(String(1200), nullable=False)
    youtube_id = Column(String(11))
    publica = Column(Boolean, nullable=False, default=False)
    revisao = Column(Integer, nullable=False, default=1)
    resumo = Column(String(64), nullable=False)
    normalizado = Column(String(1200), nullable=False)
    estado = Column(String(12), nullable=False, default="pendente")
    criado_em = Column(DateTime(timezone=True), nullable=False)
    moderado_em = Column(DateTime(timezone=True))
    moderador_id = Column(Integer, ForeignKey("usuarios.id"))
    motivo = Column(String(300))
    excluido_em = Column(DateTime(timezone=True))
    excluido_por = Column(Integer, ForeignKey("usuarios.id"))


class NotificacaoComunidade(Base):
    """Uma decisão gera um aviso durável ao autor, na mesma transação da moderação."""
    __tablename__ = "comunidade_notificacoes"
    id = Column(Integer, primary_key=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    publicacao_id = Column(Integer, ForeignKey("comunidade_publicacoes.id"), nullable=False)
    estado = Column(String(12), nullable=False)
    chave = Column(String(90), nullable=True, unique=True)
    mensagem = Column(String(600), nullable=False)
    lida = Column(Boolean, nullable=False, default=False)
    criado_em = Column(DateTime(timezone=True), nullable=False)


class Credito(Base):
    __tablename__ = "comunidade_creditos"
    publicacao_id = Column(Integer, ForeignKey("comunidade_publicacoes.id"), primary_key=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    pontos = Column(Integer, nullable=False)
    dia = Column(Date, nullable=False)
    semana = Column(Date, nullable=False)
    criado_em = Column(DateTime(timezone=True), nullable=False)
    estornado_em = Column(DateTime(timezone=True))


class Comentario(Base):
    __tablename__ = "comunidade_comentarios"
    id = Column(Integer, primary_key=True)
    publicacao_id = Column(Integer, ForeignKey("comunidade_publicacoes.id"), nullable=False)
    resposta_id = Column(Integer, ForeignKey("comunidade_comentarios.id"))
    autor_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    conteudo = Column(String(500), nullable=False)
    resumo = Column(String(64), nullable=False)
    criado_em = Column(DateTime(timezone=True), nullable=False)
    excluido_em = Column(DateTime(timezone=True))
    excluido_por = Column(Integer, ForeignKey("usuarios.id"))


class Denuncia(Base):
    __tablename__ = "comunidade_denuncias"
    id = Column(Integer, primary_key=True)
    autor_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    publicacao_id = Column(Integer, ForeignKey("comunidade_publicacoes.id"), nullable=False)
    comentario_id = Column(Integer, ForeignKey("comunidade_comentarios.id"))
    motivo = Column(String(300), nullable=False)
    criado_em = Column(DateTime(timezone=True), nullable=False)
    resolvido_em = Column(DateTime(timezone=True))
    resolvido_por = Column(Integer, ForeignKey("usuarios.id"))
    analise = Column(String(24), nullable=False, server_default="pendente")
    evidencia = Column(String(240))
    revisao_denunciada = Column(Integer)
    restringido_id = Column(Integer, ForeignKey("usuarios.id"))
    sancao_ate = Column(DateTime(timezone=True))
    revogada_em = Column(DateTime(timezone=True))
    revogada_por = Column(Integer, ForeignKey("usuarios.id"))
