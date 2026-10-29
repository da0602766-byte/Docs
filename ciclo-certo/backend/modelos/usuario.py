# O modelo representa os campos da tabela, sem autenticar nem aplicar regras de acesso.
from sqlalchemy import CheckConstraint, Column, Enum, Integer, String, UniqueConstraint
from banco import Base


# Os campos novos são opcionais para preservar os usuários anteriores à aula 8.
class Usuario(Base):
    __tablename__ = "usuarios"
    __table_args__ = (
        CheckConstraint("CHAR_LENGTH(nome) >= 2", name="conferir_nome_usuario"),
        UniqueConstraint("email", name="uq_usuarios_email"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String(80), nullable=False)
    tipo = Column(Enum("morador", "cooperativa", native_enum=False, create_constraint=True, name="conferir_tipo_usuario"), nullable=False)
    email = Column(String(100), nullable=True)
    senha_hash = Column(String(255), nullable=True)
    versao_token = Column(Integer, nullable=False, server_default="0")
    recompensa = Column(String(12), nullable=False, server_default="dinheiro")
