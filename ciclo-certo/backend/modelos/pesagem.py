# O modelo liga cada leitura da balança à coleta correspondente.
from sqlalchemy import CheckConstraint, Column, Enum, ForeignKey, Index, Integer
from sqlalchemy import Double, Numeric, String
from banco import Base


# Exige uma leitura positiva e deixa o cálculo de pontos no serviço.
class Pesagem(Base):
    __tablename__ = "pesagens"
    __table_args__ = (
        Index("indice_pesagens_coleta", "coleta_id"),
        CheckConstraint("quilos > 0", name="conferir_quilos_pesagem"),
        CheckConstraint("pontos >= 0", name="conferir_pontos_pesagem"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    coleta_id = Column(Integer, ForeignKey("coletas.id", name="pesagem_pertence_coleta"), nullable=False)
    material = Column(String(40), nullable=False)
    quilos = Column(Double(asdecimal=False), nullable=False)
    pontos = Column(Double(asdecimal=False), nullable=False)
    valor_kg = Column(Numeric(12, 4), nullable=True)
