# O modelo conserva a relação com o morador e os campos utilizados nas quatro telas.
from sqlalchemy import CheckConstraint, Column, Date, Enum, ForeignKey, Index, Integer, JSON, String
from sqlalchemy.dialects.mysql import DOUBLE
from banco import Base


# O banco mantém a integridade dos dados; o serviço decide dono, situação e pontuação.
class Coleta(Base):
    __tablename__ = "coletas"
    __table_args__ = (
        Index("indice_coletas_dia", "dia"),
        Index("indice_coletas_morador", "morador_id"),
        CheckConstraint("CHAR_LENGTH(endereco) >= 10", name="conferir_endereco_coleta"),
        CheckConstraint("pontos >= 0", name="conferir_pontos_coleta"),
        CheckConstraint("JSON_TYPE(materiais_informados) = 'ARRAY' AND JSON_LENGTH(materiais_informados) >= 1", name="conferir_materiais_coleta"),
        {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4", "mysql_collate": "utf8mb4_0900_as_cs"},
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    morador_id = Column(Integer, ForeignKey("usuarios.id", name="coleta_pertence_usuario"), nullable=False)
    endereco = Column(String(160), nullable=False)
    dia = Column(Date, nullable=False)
    materiais_informados = Column(JSON, nullable=False)
    situacao = Column(Enum("agendada", "coletada"), nullable=False, server_default="agendada")
    pontos = Column(DOUBLE(asdecimal=False), nullable=False, server_default="0")
