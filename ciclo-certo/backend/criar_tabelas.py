# Infraestrutura PostgreSQL: prepara somente public vazio com o SQL revisado.
from pathlib import Path
from sqlalchemy import inspect, text

from banco import engine


# Exige conexão administrativa e o papel restrito do backend previamente provisionado.
def criar_tabelas():
    with engine.begin() as conexao:
        if inspect(conexao).get_table_names(schema="public"):
            raise RuntimeError("O schema public já contém tabelas. Aplique uma nova migration SQL; não recrie a estrutura.")
        papel = conexao.execute(text("SELECT 1 FROM pg_roles WHERE rolname = 'ciclo_certo_backend'")).scalar()
        if not papel:
            raise RuntimeError("Provisione o papel ciclo_certo_backend antes de criar as tabelas.")
        sql = (Path(__file__).parent / "supabase" / "estrutura.sql").read_text(encoding="utf-8")
        conexao.exec_driver_sql(sql)


# A execução manual prepara a estrutura antes de iniciar o servidor.
if __name__ == "__main__":
    criar_tabelas()
    print("Tabelas criadas sem usuários ou registros de demonstração.")
