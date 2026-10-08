# O Alembic compartilha a configuração do backend sem ler o .env por conta própria.
from alembic import context
from banco import Base, engine
from modelos import coleta, pesagem, usuario

# A importação dos modelos registra as três tabelas na metadata para autogenerate.
metadata_alvo = Base.metadata


# Permite gerar SQL da migration sem executar alterações no servidor.
def migrar_sem_conexao():
    context.configure(url=engine.url, target_metadata=metadata_alvo, literal_binds=True, compare_type=True)
    with context.begin_transaction():
        context.run_migrations()


# Usa uma conexão do engine para executar o histórico, sem abrir sessões de recursos.
def migrar_com_conexao():
    with engine.connect() as conexao:
        context.configure(connection=conexao, target_metadata=metadata_alvo, compare_type=True)
        with context.begin_transaction():
            context.run_migrations()


# A escolha do modo é infraestrutura do Alembic e não uma rota da API.
if context.is_offline_mode():
    migrar_sem_conexao()
else:
    migrar_com_conexao()
