# Este modulo centraliza a leitura do .env para nao espalhar configuracoes pelo projeto.
import os
from pathlib import Path
from urllib.parse import urlsplit

from dotenv import load_dotenv
from pydantic import SecretStr


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

# IA é opcional; o site pode iniciar sem chaves ou modelos de nenhum provedor.
_provedores_ia = {
    "gemini": ("GEMINI_API_KEY", "GEMINI_MODEL"),
    "openrouter": ("OPENROUTER_API_KEY", "OPENROUTER_MODEL"),
}


# O futuro serviço chama esta função antes de integrar um provedor, sem trocar de chave em caso de falha.
def obter_configuracao_ia():
    habilitada = os.getenv("IA_HABILITADA", "0").strip()
    if habilitada == "0":
        return None
    if habilitada != "1":
        raise ValueError("Configure IA_HABILITADA com 0 ou 1.")

    provedor = os.getenv("IA_PROVEDOR", "gemini").strip().lower()
    if provedor not in _provedores_ia:
        raise ValueError("Configure IA_PROVEDOR com gemini ou openrouter.")

    nome_chave, nome_modelo = _provedores_ia[provedor]
    chave = os.getenv(nome_chave, "").strip()
    modelo = os.getenv(nome_modelo, "").strip()
    faltando = [nome for nome, valor in ((nome_chave, chave), (nome_modelo, modelo)) if not valor]
    if faltando:
        raise ValueError(f"Preencha {', '.join(faltando)} no ambiente do backend.")

    # SecretStr oculta a chave na representação do objeto; só o cliente do provedor deve abri-la.
    return {"provedor": provedor, "modelo": modelo, "chave": SecretStr(chave)}


# Executar este arquivo diretamente verifica só a configuração local, sem banco nem rede.
if __name__ == "__main__":
    for nomes in _provedores_ia.values():
        for nome in nomes:
            estado = "preenchido" if os.getenv(nome, "").strip() else "vazio"
            print(f"{nome}: {estado}")
    try:
        configuracao_ia = obter_configuracao_ia()
    except ValueError as erro:
        raise SystemExit(str(erro))
    if configuracao_ia is None:
        print("IA desativada (IA_HABILITADA=0).")
    else:
        print(f"Configuração preenchida para {configuracao_ia['provedor']}. Nenhuma chamada foi feita.")
