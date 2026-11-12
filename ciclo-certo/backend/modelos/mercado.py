"""Produtos de demonstração e pedidos preservam preço e nome no momento da troca."""
from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime, ForeignKey, UniqueConstraint
from banco import Base

class Produto(Base):
    __tablename__ = "produtos"
    id = Column(Integer, primary_key=True)
    nome = Column(String(100), nullable=False)
    descricao = Column(String(500), nullable=False)
    categoria = Column(String(40), nullable=False)
    pontos = Column(Integer, nullable=False)
    estoque = Column(Integer, nullable=False)
    foto = Column(String(300), nullable=False, server_default="/imagens/produtos/ecobag.jpg")
    ativo = Column(Boolean, nullable=False, server_default="true")

class Pedido(Base):
    __tablename__ = "pedidos_recompensa"
    __table_args__ = (UniqueConstraint("usuario_id", "chave"),)
    id = Column(Integer, primary_key=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    produto_id = Column(Integer, ForeignKey("produtos.id"), nullable=False)
    nome = Column(String(100), nullable=False)
    pontos = Column(Integer, nullable=False)
    chave = Column(String(64), nullable=False)
    endereco_entrega = Column(String(160))
    data_entrega = Column(Date)
    criado_em = Column(DateTime(timezone=True), nullable=False)
