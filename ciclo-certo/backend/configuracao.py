# Este modulo centraliza a leitura do .env para nao espalhar configuracoes pelo projeto.
import os
from pathlib import Path
from urllib.parse import urlsplit

from dotenv import load_dotenv


# Carrega as variaveis locais antes de o FastAPI configurar os recursos externos.
load_dotenv(Path(__file__).with_name(".env"))

# Le o endereco exato do front, que sera a unica origem liberada pelo CORS.
na_vercel = os.getenv("VERCEL") == "1"
origem_frontend = os.getenv("ORIGEM_FRONTEND", "" if na_vercel else "http://localhost:5173").strip().rstrip("/")
# Na nuvem, CORS exige a origem pública exata, sem liberar outros sites por wildcard.
if na_vercel:
    origem = urlsplit(origem_frontend)
    if origem.scheme != "https" or not origem.hostname or origem.hostname in ("localhost", "127.0.0.1", "::1") or origem.username or origem.password or origem.path or origem.query or origem.fragment or "*" in origem_frontend:
        raise ValueError("Configure ORIGEM_FRONTEND com a origem HTTPS exata do frontend na Vercel.")

# O cadastro livre dos dois perfis é apenas do exercício local; na Vercel só morador.
permitir_cadastro_cooperativa = not na_vercel

# PostgreSQL é obrigatório; uma configuração ausente não seleciona outro banco.
database_url = os.getenv("DATABASE_URL", "").strip()
esquema_teste_supabase = os.getenv("SUPABASE_ESQUEMA_TESTE", "").strip()

# A chave assina os tokens e precisa existir apenas no ambiente local, nunca no Git.
chave_do_token = os.getenv("CHAVE_DO_TOKEN", "")
