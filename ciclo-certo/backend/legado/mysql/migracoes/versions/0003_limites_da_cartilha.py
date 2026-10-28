# Remove tetos ausentes da cartilha sem apagar tabelas, registros ou revisões anteriores.
from alembic import op
import sqlalchemy as sa

revision = "0003_limites_cartilha"
down_revision = "0002_email_senha"
branch_labels = None
depends_on = None


# As duas restrições mudam em suas próprias tabelas, preservando os dados existentes.
def upgrade():
    op.drop_constraint("conferir_quilos_pesagem", "pesagens", type_="check")
    op.create_check_constraint("conferir_quilos_pesagem", "pesagens", "quilos > 0")
    op.drop_constraint("conferir_materiais_coleta", "coletas", type_="check")
    op.create_check_constraint(
        "conferir_materiais_coleta", "coletas",
        "JSON_TYPE(materiais_informados) = 'ARRAY' AND JSON_LENGTH(materiais_informados) >= 1",
    )


# Recusa a reversão quando ela exigiria eliminar dados aceitos pela regra atual.
def downgrade():
    conexao = op.get_bind()
    pesos_incompativeis = conexao.execute(sa.text("SELECT COUNT(*) FROM pesagens WHERE quilos > 1000")).scalar_one()
    materiais_incompativeis = conexao.execute(sa.text("SELECT COUNT(*) FROM coletas WHERE JSON_LENGTH(materiais_informados) > 6")).scalar_one()
    if pesos_incompativeis or materiais_incompativeis:
        raise RuntimeError("Reversão recusada: existem dados incompatíveis com os limites antigos. Nenhum registro será apagado.")
    op.drop_constraint("conferir_quilos_pesagem", "pesagens", type_="check")
    op.create_check_constraint("conferir_quilos_pesagem", "pesagens", "quilos > 0 AND quilos <= 1000")
    op.drop_constraint("conferir_materiais_coleta", "coletas", type_="check")
    op.create_check_constraint(
        "conferir_materiais_coleta", "coletas",
        "JSON_TYPE(materiais_informados) = 'ARRAY' AND JSON_LENGTH(materiais_informados) BETWEEN 1 AND 6",
    )
