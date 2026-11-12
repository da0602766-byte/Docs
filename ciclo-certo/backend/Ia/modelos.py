"""Roteamento das tarefas da Cici e validação de respostas dos provedores."""
import asyncio
import logging

import configuracao
from jangada_ai import LLM

logger = logging.getLogger(__name__)


def provedores_configurados(preferido):
    if not configuracao.ia_habilitada:
        return []
    candidatos = {
        "gemini": (configuracao.modelo_gemini, configuracao.chave_do_gemini),
        "openrouter": (configuracao.modelo_openrouter, configuracao.chave_do_openrouter),
    }
    reserva = "openrouter" if preferido == "gemini" else "gemini"
    ordem = (preferido, reserva) if configuracao.ia_provedor == "auto" else (configuracao.ia_provedor,)
    return [(nome, *candidatos[nome]) for nome in ordem if nome in candidatos and candidatos[nome][1]]


def criar_modelo(provedor, modelo, chave, *, prazo, tokens):
    if provedor == "gemini":
        from google.genai import types

        # O timeout do SDK vira também um cabeçalho do servidor Gemini.
        # O prazo para a pessoa usuária é aplicado por asyncio, abaixo.
        opcoes = {"http_options": types.HttpOptions(
            timeout=15000, retry_options=types.HttpRetryOptions(attempts=1),
        )}
    else:
        opcoes = {"timeout": prazo}
    llm = LLM(provedor, modelo, api_key=chave, max_tokens=tokens, max_retries=0, **opcoes)
    if provedor == "openrouter":
        llm.provider.client_kwargs["max_retries"] = 0
    return llm


async def _consultar(candidatos, tarefa, entrada, instrucoes, esquema, prazo, tokens):
    for provedor, modelo, chave in candidatos:
        cliente = None
        prazo_provedor = prazo if prazo is not None else (8 if provedor == "openrouter" else 6)
        try:
            async with asyncio.timeout(prazo_provedor):
                # Alguns modelos do OpenRouter contam raciocínio no limite de saída.
                limite_saida = max(tokens, 1100) if provedor == "openrouter" else tokens
                cliente = criar_modelo(provedor, modelo, chave, prazo=prazo_provedor, tokens=limite_saida)
                if provedor == "gemini":
                    resposta = await cliente.acomplete(entrada, system=instrucoes, params={
                        "response_mime_type": "application/json",
                        "response_json_schema": esquema.model_json_schema(),
                    })
                    return esquema.model_validate_json(resposta.text)
                opcoes = {"provider": {"require_parameters": True, "sort": "latency"}}
                if modelo == configuracao.modelo_openrouter_padrao:
                    opcoes["reasoning"] = {"effort": "low"}
                resposta = await cliente.aparse(entrada, esquema, system=instrucoes, params={"extra_body": opcoes})
                return esquema.model_validate(resposta.parsed)
        except Exception as erro:
            logger.warning(
                "Cici falhou: tarefa=%s provedor=%s tipo=%s status=%s",
                tarefa, provedor, type(erro).__name__, getattr(erro, "status_code", None),
            )
        finally:
            if cliente is not None:
                try:
                    async with asyncio.timeout(0.25):
                        await cliente.aclose()
                except Exception:
                    logger.warning("Cici não fechou cliente: provedor=%s", provedor)
    return None


def consultar_modelos(candidatos, tarefa, entrada, instrucoes, esquema, *, prazo=None, tokens=500):
    # Os serviços síncronos da API executam no pool de threads do FastAPI.
    return asyncio.run(_consultar(candidatos, tarefa, entrada, instrucoes, esquema, prazo, tokens))
