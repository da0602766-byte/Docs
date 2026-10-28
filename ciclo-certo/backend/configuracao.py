# Este modulo centraliza a leitura do .env para nao espalhar configuracoes pelo projeto.
import os
from pathlib import Path

from dotenv import load_dotenv


# Carrega as variaveis locais antes de o FastAPI configurar os recursos externos.
load_dotenv(Path(__file__).with_name(".env"))

# Le o endereco exato do front, que sera a unica origem liberada pelo CORS.
origem_frontend = os.getenv("ORIGEM_FRONTEND", "http://localhost:5173")

# PostgreSQL é obrigatório; uma configuração ausente não seleciona outro banco.
database_url = os.getenv("DATABASE_URL", "").strip()
esquema_teste_supabase = os.getenv("SUPABASE_ESQUEMA_TESTE", "").strip()

# A chave assina os tokens e precisa existir apenas no ambiente local, nunca no Git.
chave_do_token = os.getenv("CHAVE_DO_TOKEN", "")
