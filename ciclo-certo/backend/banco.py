# Infraestrutura compartilhada: o banco fornece uma sessão independente por requisição.
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.engine import make_url

import configuracao as configuracao

# O driver psycopg preserva transações e SELECT FOR UPDATE no PostgreSQL.
if not configuracao.database_url:
    raise ValueError("Configure DATABASE_URL com a conexão PostgreSQL no backend/.env.")
endereco_banco = make_url(configuracao.database_url)
if endereco_banco.drivername in ("postgres", "postgresql"):
    endereco_banco = endereco_banco.set(drivername="postgresql+psycopg")
if endereco_banco.drivername != "postgresql+psycopg":
    raise ValueError("DATABASE_URL deve usar PostgreSQL com o driver postgresql+psycopg.")
argumentos_conexao = {"sslmode": "require", "connect_timeout": 15, "prepare_threshold": None}
engine = create_engine(endereco_banco, pool_pre_ping=True, connect_args=argumentos_conexao)
Sessao = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
Base = declarative_base()


# yield entrega a sessão ao Depends e finally libera os recursos mesmo se a rota falhar.
def obter_sessao():
    sessao = Sessao()
    try:
        yield sessao
    finally:
        sessao.close()
