# Este modulo centraliza a leitura do .env para nao espalhar configuracoes pelo projeto.
import os

from dotenv import load_dotenv


# Carrega as variaveis locais antes de o FastAPI configurar os recursos externos.
load_dotenv()

# Le o endereco exato do front, que sera a unica origem liberada pelo CORS.
origem_frontend = os.getenv("ORIGEM_FRONTEND", "http://localhost:5173")
