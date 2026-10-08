# Histórico inicial das três tabelas existentes, sem cadastrar dados de demonstração.
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.mysql import DOUBLE

revision = "0001_estrutura"
down_revision = None
branch_labels = None
depends_on = None


# Cria a estrutura anterior ao login quando o histórico é aplicado em um banco vazio.
def upgrade():
    op.create_table(
        "usuarios",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("nome", sa.String(80), nullable=False),
        sa.Column("tipo", sa.Enum("morador", "cooperativa"), nullable=False),
        sa.CheckConstraint("CHAR_LENGTH(nome) >= 2", name="conferir_nome_usuario"),
        mysql_engine="InnoDB", mysql_charset="utf8mb4", mysql_collate="utf8mb4_0900_as_cs",
    )
    op.create_table(
        "coletas",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("morador_id", sa.Integer, nullable=False),
        sa.Column("endereco", sa.String(160), nullable=False),
        sa.Column("dia", sa.Date, nullable=False),
        sa.Column("materiais_informados", sa.JSON, nullable=False),
        sa.Column("situacao", sa.Enum("agendada", "coletada"), nullable=False, server_default="agendada"),
        sa.Column("pontos", DOUBLE, nullable=False, server_default="0"),
        sa.ForeignKeyConstraint(["morador_id"], ["usuarios.id"], name="coleta_pertence_usuario"),
        sa.CheckConstraint("CHAR_LENGTH(endereco) >= 10", name="conferir_endereco_coleta"),
        sa.CheckConstraint("pontos >= 0", name="conferir_pontos_coleta"),
        sa.CheckConstraint("JSON_TYPE(materiais_informados) = 'ARRAY' AND JSON_LENGTH(materiais_informados) BETWEEN 1 AND 6", name="conferir_materiais_coleta"),
        mysql_engine="InnoDB", mysql_charset="utf8mb4", mysql_collate="utf8mb4_0900_as_cs",
    )
    op.create_index("indice_coletas_dia", "coletas", ["dia"])
    op.create_index("indice_coletas_morador", "coletas", ["morador_id"])
    op.create_table(
        "pesagens",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("coleta_id", sa.Integer, nullable=False),
        sa.Column("material", sa.Enum("papel", "vidro", "plástico", "metal"), nullable=False),
        sa.Column("quilos", DOUBLE, nullable=False),
        sa.Column("pontos", DOUBLE, nullable=False),
        sa.ForeignKeyConstraint(["coleta_id"], ["coletas.id"], name="pesagem_pertence_coleta"),
        sa.CheckConstraint("quilos > 0 AND quilos <= 1000", name="conferir_quilos_pesagem"),
        sa.CheckConstraint("pontos >= 0", name="conferir_pontos_pesagem"),
        mysql_engine="InnoDB", mysql_charset="utf8mb4", mysql_collate="utf8mb4_0900_as_cs",
    )
    op.create_index("indice_pesagens_coleta", "pesagens", ["coleta_id"])


# Remove as tabelas somente se alguém solicitar explicitamente a reversão deste histórico.
def downgrade():
    op.drop_table("pesagens")
    op.drop_table("coletas")
    op.drop_table("usuarios")
