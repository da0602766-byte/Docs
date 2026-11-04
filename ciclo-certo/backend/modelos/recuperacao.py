"""Somente o hash do segredo de recuperação é persistido no banco."""
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from banco import Base

class Recuperacao(Base):
    __tablename__ = 'recuperacoes_senha'
    usuario_id = Column(Integer, ForeignKey('usuarios.id'), primary_key=True)
    versao_token = Column(Integer, nullable=False)
    resumo = Column(String(64), nullable=False)
    criado_em = Column(DateTime(timezone=True), nullable=False)
    expira_em = Column(DateTime(timezone=True), nullable=False)
