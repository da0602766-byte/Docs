# O modelo liga cada leitura da balança à coleta correspondente.
from sqlalchemy import CheckConstraint, Column, Enum, ForeignKey, Index, Integer
from sqlalchemy.dialects.mysql import DOUBLE
from banco import Base


# Mantém os mesmos limites dos esquemas atuais e não calcula pontos dentro do modelo.
class Pesagem(Base):
    __tablename__ = "pesagens"
    __table_args__ = (
        Index("indice_pesagens_coleta", "coleta_id"),
        CheckConstraint("quilos > 0 AND quilos <= 1000", name="conferir_quilos_pesagem"),
        CheckConstraint("pontos >= 0", name="conferir_pontos_pesagem"),
        {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4", "mysql_collate": "utf8mb4_0900_as_cs"},
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    coleta_id = Column(Integer, ForeignKey("coletas.id", name="pesagem_pertence_coleta"), nullable=False)
    material = Column(Enum("papel", "vidro", "plástico", "metal"), nullable=False)
    quilos = Column(DOUBLE(asdecimal=False), nullable=False)
    pontos = Column(DOUBLE(asdecimal=False), nullable=False)
