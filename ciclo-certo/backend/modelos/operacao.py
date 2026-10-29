"""Persistência de agenda, comprovantes privados, avisos e extrato fictício."""
from sqlalchemy import Column, Integer, String, Date, DateTime, Boolean, Text, ForeignKey, UniqueConstraint, CheckConstraint
from banco import Base


class Horario(Base):
    __tablename__ = "horarios"
    __table_args__ = (UniqueConstraint("dia", "hora", name="uq_horario"), CheckConstraint("capacidade >= 0", name="capacidade_positiva"))
    id = Column(Integer, primary_key=True)
    dia = Column(Date, nullable=False)
    hora = Column(String(5), nullable=False)
    capacidade = Column(Integer, nullable=False)


class Comprovante(Base):
    __tablename__ = "comprovantes"
    coleta_id = Column(Integer, ForeignKey("coletas.id"), primary_key=True)
    foto = Column(Text, nullable=False)
    assinatura = Column(Text, nullable=False)
    nome_signatario = Column(String(80), nullable=False)
    criado_em = Column(DateTime(timezone=True), nullable=False)
    versao = Column(Integer, nullable=False)


class Notificacao(Base):
    __tablename__ = "notificacoes"
    __table_args__ = (UniqueConstraint("coleta_id", "tipo", name="uq_aviso_coleta_tipo"),)
    id = Column(Integer, primary_key=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    coleta_id = Column(Integer, ForeignKey("coletas.id"), nullable=False)
    tipo = Column(String(24), nullable=False)
    mensagem = Column(String(600), nullable=False)
    lida = Column(Boolean, nullable=False, default=False)
    criado_em = Column(DateTime(timezone=True), nullable=False)


class Movimento(Base):
    __tablename__ = "movimentos"
    __table_args__ = (UniqueConstraint("coleta_id", name="uq_credito_coleta"), UniqueConstraint("usuario_id", "chave", name="uq_movimento_chave"))
    id = Column(Integer, primary_key=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    coleta_id = Column(Integer, ForeignKey("coletas.id"), nullable=True)
    chave = Column(String(64), nullable=False)
    tipo = Column(String(30), nullable=False)
    pontos = Column(Integer, nullable=False, default=0)
    centavos = Column(Integer, nullable=False, default=0)
    criado_em = Column(DateTime(timezone=True), nullable=False)
