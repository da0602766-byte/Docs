# Este modulo centraliza a leitura do .env para nao espalhar configuracoes pelo projeto.
import os
from pathlib import Path

from dotenv import load_dotenv


# Carrega as variaveis locais antes de o FastAPI configurar os recursos externos.
load_dotenv(Path(__file__).with_name(".env"))

# Le o endereco exato do front, que sera a unica origem liberada pelo CORS.
origem_frontend = os.getenv("ORIGEM_FRONTEND", "http://localhost:5173")

# Mantém o acesso ao MySQL somente na configuração, sem senhas no código.
mysql_host = os.getenv("MYSQL_HOST", "127.0.0.1")
mysql_porta = int(os.getenv("MYSQL_PORTA") or "3306")
mysql_usuario = os.getenv("MYSQL_USUARIO") or "root"
mysql_senha = os.getenv("MYSQL_SENHA", "")
mysql_banco = os.getenv("MYSQL_BANCO") or "ciclo_certo"

# A chave assina os tokens e precisa existir apenas no ambiente local, nunca no Git.
chave_do_token = os.getenv("CHAVE_DO_TOKEN", "")
