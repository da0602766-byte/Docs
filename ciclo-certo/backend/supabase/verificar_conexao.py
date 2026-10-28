# Diagnóstico de infraestrutura: não consulta nem imprime dados pessoais ou senhas.
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import configuracao
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url


if __name__ == "__main__":
    url = make_url(configuracao.database_url)
    engine = create_engine(url, connect_args={"sslmode": "require", "connect_timeout": 10, "prepare_threshold": None})
    with engine.connect() as conexao:
        # pg_stat_ssl descreve pooler → banco; ssl_in_use verifica cliente → pooler.
        print({"host": url.host, "usuario": conexao.execute(text("SELECT current_user")).scalar_one(), "ssl_cliente": conexao.connection.driver_connection.pgconn.ssl_in_use})
    engine.dispose()
