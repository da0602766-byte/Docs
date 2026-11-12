# Este modulo centraliza a leitura do .env para nao espalhar configuracoes pelo projeto.
import os
from pathlib import Path
from urllib.parse import urlsplit

from dotenv import load_dotenv


# Carrega as variaveis locais antes de o FastAPI configurar os recursos externos.
load_dotenv(Path(__file__).with_name(".env"))
if os.getenv("VERCEL") != "1":
    load_dotenv(Path(__file__).with_name(".env.local"))

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

# Regras iniciais de simulação, configuráveis sem editar os cálculos da API.
percentual_morador = int(os.getenv("PERCENTUAL_MORADOR", "50"))
capacidade_horario = int(os.getenv("CAPACIDADE_HORARIO", "3"))
horarios_coleta = os.getenv("HORARIOS_COLETA", "08:00,09:00,10:00,11:00,13:00,14:00,15:00,16:00").split(",")
if not 1 <= percentual_morador <= 99 or capacidade_horario < 1:
    raise ValueError("Configure participação entre 1 e 99 e capacidade positiva.")
import re
if not horarios_coleta or len(set(horarios_coleta)) != len(horarios_coleta) or any(not re.fullmatch(r"(?:[01]\d|2[0-3]):[0-5]\d", h) for h in horarios_coleta):
    raise ValueError("HORARIOS_COLETA deve conter horários únicos no formato HH:MM.")

# SMTP é opcional na demonstração; a caixa local só funciona no banco de teste local.
recuperacao_local = os.getenv("RECUPERACAO_LOCAL") == "1" and not na_vercel and '@127.0.0.1:' in database_url and database_url.endswith('/ciclo_certo_teste_local')
smtp_host = os.getenv('SMTP_HOST', '')
smtp_porta = int(os.getenv('SMTP_PORTA', '587'))
smtp_usuario = os.getenv('SMTP_USUARIO', '')
smtp_senha = os.getenv('SMTP_SENHA', '')
smtp_remetente = os.getenv('SMTP_REMETENTE', '')
resend_api_key = os.getenv('RESEND_API_KEY', '').strip()
resend_remetente = os.getenv('RESEND_REMETENTE', '').strip()
openrouteservice_api_key = os.getenv('OPENROUTESERVICE_API_KEY', '').strip()

# Mantém os nomes de credenciais usados pela API atual.
chave_do_gemini = (os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or os.getenv("CHAVE_DO_GEMINI") or "").strip()
chave_do_openrouter = (os.getenv("OPENROUTER_API_KEY") or os.getenv("CHAVE_DO_OPENROUTER") or "").strip()
modelo_gemini = os.getenv("GEMINI_MODEL", "").strip() or "gemini-3.1-flash-lite"
modelo_openrouter_padrao = "baidu/ernie-5.5-flash-preview:free"
modelo_openrouter = os.getenv("OPENROUTER_MODEL", "").strip() or modelo_openrouter_padrao
ia_habilitada = os.getenv("IA_HABILITADA", "1").strip() == "1"
ia_provedor = os.getenv("IA_PROVEDOR", "").strip().lower() or "auto"

# Executar diretamente verifica a presença de credenciais, sem chamar os provedores.
if __name__ == "__main__":
    print(f"IA habilitada: {ia_habilitada}")
    print(f"Roteamento: {ia_provedor}")
    print("Gemini:", "configurado" if chave_do_gemini else "sem chave")
    print("OpenRouter:", "configurado" if chave_do_openrouter else "sem chave")
