# ${message}
from alembic import op
import sqlalchemy as sa
${imports if imports else ""}

revision = ${repr(up_revision)}
down_revision = ${repr(down_revision)}
branch_labels = ${repr(branch_labels)}
depends_on = ${repr(depends_on)}


# Aplica a mudança gerada; revise o SQL antes de executar no banco da aplicação.
def upgrade():
    ${upgrades if upgrades else "pass"}


# Reverte somente esta mudança quando o histórico precisar voltar uma etapa.
def downgrade():
    ${downgrades if downgrades else "pass"}
