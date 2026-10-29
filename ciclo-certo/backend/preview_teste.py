"""Preview com dados fictícios em banco local isolado; não usar em implantação."""
import os
import json
import secrets
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
acesso = json.loads((RAIZ / ".test-infra/acesso.json").read_text(encoding="utf-8-sig"))
os.environ["DATABASE_URL"] = f"postgresql+psycopg://postgres:{acesso['password']}@127.0.0.1:{acesso['port']}/ciclo_certo_teste_local"
os.environ["CHAVE_DO_TOKEN"] = secrets.token_hex(32)
os.environ["ORIGEM_FRONTEND"] = "http://127.0.0.1:5175"
os.environ.pop("VERCEL", None)

from sqlalchemy import create_engine, inspect, text, event
from sqlalchemy.orm import sessionmaker
from main import app
from banco import obter_sessao
from seguranca import gerar_hash_senha

engine_admin = create_engine(os.environ["DATABASE_URL"])
with engine_admin.begin() as conexao:
    assert conexao.scalar(text("SELECT current_database()")) == "ciclo_certo_teste_local"
    if not inspect(conexao).has_table("usuarios", schema="public"):
        conexao.exec_driver_sql((RAIZ / "backend/supabase/estrutura.sql").read_text(encoding="utf-8"))
        for migration in sorted((RAIZ / "supabase/migrations").glob("*.sql")):
            conexao.exec_driver_sql(migration.read_text(encoding="utf-8"))
    for nome, tipo, email in [("Morador de Teste", "morador", "morador@example.org"), ("Cooperador de Teste", "cooperativa", "cooperador@example.org")]:
        if not conexao.scalar(text("SELECT id FROM usuarios WHERE email=:email"), {"email": email}):
            conexao.execute(text("INSERT INTO usuarios(nome,tipo,email,senha_hash) VALUES (:nome,:tipo,:email,:senha)"), dict(nome=nome,tipo=tipo,email=email,senha=gerar_hash_senha("TesteLocal123!")))
engine_admin.dispose()
engine = create_engine(os.environ["DATABASE_URL"])


@event.listens_for(engine, "connect")
def limitar_papel(dbapi, registro):
    dbapi.autocommit = True
    with dbapi.cursor() as cursor:
        cursor.execute("SET ROLE ciclo_certo_backend")
    dbapi.autocommit = False


Sessao = sessionmaker(bind=engine, expire_on_commit=False, autoflush=False)


def sessao_preview():
    with Sessao() as sessao:
        yield sessao


app.dependency_overrides[obter_sessao] = sessao_preview
