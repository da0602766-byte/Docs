# Infraestrutura de migração: mantém o MySQL intacto e recusa sobrescrever o destino.
import argparse
from datetime import date, datetime, timezone
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import configuracao
from banco import Base, endereco_mysql
from modelos import coleta, pesagem, usuario
from sqlalchemy import create_engine, select, text


# A conversão serve apenas ao backup JSON; a cópia usa tipos nativos do SQLAlchemy.
def serializar(valor):
    if isinstance(valor, (date, datetime)):
        return valor.isoformat()
    raise TypeError(type(valor).__name__)


# A leitura ordenada permite comparar todos os campos, inclusive IDs e hashes, sem logá-los.
def ler(conexao):
    return {
        tabela.name: [dict(linha) for linha in conexao.execute(select(tabela).order_by(tabela.c.id)).mappings()]
        for tabela in Base.metadata.sorted_tables
    }


# Bloqueio de leitura impede alterações no MySQL durante backup e cópia transacional.
def copiar(aplicar=False):
    if not configuracao.database_url_destino:
        raise RuntimeError("Configure DATABASE_URL_DESTINO no .env antes de migrar.")
    origem = create_engine(endereco_mysql, connect_args={"use_pure": True})
    destino = create_engine(configuracao.database_url_destino, connect_args={"sslmode": "require", "connect_timeout": 15, "prepare_threshold": None})
    if destino.dialect.name != "postgresql":
        raise RuntimeError("O destino precisa ser PostgreSQL.")
    try:
        with origem.connect() as leitura:
            leitura.execute(text("LOCK TABLES usuarios READ, coletas READ, pesagens READ"))
            try:
                dados = ler(leitura)
                contagens = {nome: len(linhas) for nome, linhas in dados.items()}
                if not aplicar:
                    print({"origem": contagens, "acao": "Somente leitura; use --aplicar para copiar."})
                    return
                pasta = Path(__file__).resolve().parents[1] / "backups"
                pasta.mkdir(exist_ok=True)
                arquivo = pasta / ("mysql_" + datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ") + ".json")
                arquivo.write_text(json.dumps(dados, default=serializar, ensure_ascii=False, indent=2), encoding="utf-8")
                with destino.begin() as escrita:
                    # Só uma execução desta ferramenta pode copiar para este destino por vez.
                    escrita.execute(text("SELECT pg_advisory_xact_lock(20261028, 1)"))
                    if any(ler(escrita).values()):
                        raise RuntimeError("Destino não está vazio; nenhuma linha foi sobrescrita.")
                    for tabela in Base.metadata.sorted_tables:
                        if dados[tabela.name]:
                            escrita.execute(tabela.insert(), dados[tabela.name])
                    if ler(escrita) != dados:
                        raise RuntimeError("Cópia divergente: a transação será desfeita.")
                print({"copiados_e_conferidos": contagens, "backup": str(arquivo), "pendencia": "Ajustar sequences pelo administrador antes de ativar a API."})
            finally:
                leitura.execute(text("UNLOCK TABLES"))
    finally:
        origem.dispose()
        destino.dispose()


if __name__ == "__main__":
    argumentos = argparse.ArgumentParser(description="Copia MySQL para PostgreSQL vazio com backup e conferência integral.")
    argumentos.add_argument("--aplicar", action="store_true")
    copiar(argumentos.parse_args().aplicar)
