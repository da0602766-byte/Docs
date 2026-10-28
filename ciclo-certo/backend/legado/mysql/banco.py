# Infraestrutura compartilhada: o banco fornece uma sessão independente por requisição.
from sqlalchemy import URL, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.engine import make_url

import configuracao as configuracao

# URL.create trata caracteres especiais da senha sem montar uma URL por concatenação.
endereco_mysql = URL.create(
    "mysql+mysqlconnector",
    username=configuracao.mysql_usuario,
    password=configuracao.mysql_senha,
    host=configuracao.mysql_host,
    port=configuracao.mysql_porta,
    database=configuracao.mysql_banco,
    query={"charset": "utf8mb4"},
)
# O driver psycopg preserva transações e SELECT FOR UPDATE no PostgreSQL.
endereco_banco = make_url(configuracao.database_url) if configuracao.database_url else endereco_mysql
if endereco_banco.drivername in ("postgres", "postgresql"):
    endereco_banco = endereco_banco.set(drivername="postgresql+psycopg")
if endereco_banco.get_backend_name() == "postgresql":
    argumentos_conexao = {"sslmode": "require", "connect_timeout": 15, "prepare_threshold": None}
elif endereco_banco.get_backend_name() == "mysql":
    argumentos_conexao = {"use_pure": True}
else:
    raise ValueError("DATABASE_URL deve usar PostgreSQL ou MySQL.")
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
