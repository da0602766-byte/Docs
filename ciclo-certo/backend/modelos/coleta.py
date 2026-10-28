# O modelo conserva a relação com o morador e os campos utilizados nas quatro telas.
from sqlalchemy import CheckConstraint, Column, Date, Enum, ForeignKey, Index, Integer, JSON, String
from sqlalchemy import Double
from banco import Base


# O banco mantém a integridade dos dados; o serviço decide dono, situação e pontuação.
class Coleta(Base):
    __tablename__ = "coletas"
    __table_args__ = (
        Index("indice_coletas_dia", "dia"),
        Index("indice_coletas_morador", "morador_id"),
        CheckConstraint("CHAR_LENGTH(endereco) >= 10", name="conferir_endereco_coleta"),
        CheckConstraint("pontos >= 0", name="conferir_pontos_coleta"),
        # CASE evita chamar json_array_length em um objeto JSON inválido para a regra.
        CheckConstraint("CASE WHEN json_typeof(materiais_informados) = 'array' THEN json_array_length(materiais_informados) >= 1 ELSE false END", name="conferir_materiais_coleta"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    morador_id = Column(Integer, ForeignKey("usuarios.id", name="coleta_pertence_usuario"), nullable=False)
    endereco = Column(String(160), nullable=False)
    dia = Column(Date, nullable=False)
    materiais_informados = Column(JSON, nullable=False)
    situacao = Column(Enum("agendada", "coletada", native_enum=False, create_constraint=True, name="conferir_situacao_coleta"), nullable=False, server_default="agendada")
    pontos = Column(Double(asdecimal=False), nullable=False, server_default="0")
