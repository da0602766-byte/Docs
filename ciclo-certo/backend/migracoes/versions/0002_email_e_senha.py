# A aula 8 acrescenta credenciais sem atribuir e-mails ou senhas aos usuários antigos.
from alembic import op
import sqlalchemy as sa

revision = "0002_email_senha"
down_revision = "0001_estrutura"
branch_labels = None
depends_on = None


# Campos opcionais preservam os registros existentes e e-mail único protege o cadastro.
def upgrade():
    op.add_column("usuarios", sa.Column("email", sa.String(100), nullable=True))
    op.add_column("usuarios", sa.Column("senha_hash", sa.String(255), nullable=True))
    op.create_unique_constraint("uq_usuarios_email", "usuarios", ["email"])


# A reversão elimina credenciais e não deve ser executada sem uma decisão explícita.
def downgrade():
    op.drop_constraint("uq_usuarios_email", "usuarios", type_="unique")
    op.drop_column("usuarios", "senha_hash")
    op.drop_column("usuarios", "email")
