# Prepara somente um banco vazio pelos modelos; bancos existentes usam migrations.
from pathlib import Path
from alembic import command
from alembic.config import Config
from sqlalchemy import inspect

from banco import Base, engine
from modelos import coleta, pesagem, usuario


# Não apaga nem recria tabelas existentes e não insere qualquer usuário.
def criar_tabelas():
    if inspect(engine).get_table_names():
        raise RuntimeError("O banco já tem tabelas. Use alembic upgrade head para aplicar migrations.")
    Base.metadata.create_all(bind=engine)
    configuracao_alembic = Config(str(Path(__file__).with_name("alembic.ini")))
    command.stamp(configuracao_alembic, "head")


# A execução manual prepara a estrutura antes de iniciar o servidor.
if __name__ == "__main__":
    criar_tabelas()
    print("Tabelas criadas sem usuários ou registros de demonstração.")
