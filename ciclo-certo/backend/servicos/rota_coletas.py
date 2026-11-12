"""Sugestão de percurso por tempo de viagem, mantendo a sequência dos horários."""
import json
from concurrent.futures import ThreadPoolExecutor
from itertools import groupby
from math import isfinite
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

import configuracao
from repositorios import coleta
from servicos.operacao import Recusa


def consultar(caminho, corpo=None):
    requisicao = Request("https://api.openrouteservice.org" + caminho,
                         json.dumps(corpo).encode() if corpo is not None else None,
                         {"Authorization": configuracao.openrouteservice_api_key, "Content-Type": "application/json"})
    try:
        with urlopen(requisicao, timeout=5) as resposta:
            return json.load(resposta)
    except HTTPError as erro:
        if erro.code == 429:
            raise Recusa("O serviço de rotas atingiu o limite de consultas. Tente mais tarde.", 503) from erro
        raise Recusa("Não foi possível consultar o serviço de rotas agora.", 502) from erro
    except (OSError, ValueError) as erro:
        raise Recusa("Não foi possível consultar o serviço de rotas agora.", 502) from erro


def localizar(endereco):
    dados = consultar("/geocode/search?" + urlencode({
        "text": endereco, "boundary.country": "BR", "layers": "address", "size": 1,
    }))
    try:
        ponto = dados["features"][0]
        longitude, latitude = ponto["geometry"]["coordinates"]
        if (ponto["properties"]["confidence"] >= 0.8 and -180 <= longitude <= 180 and -90 <= latitude <= 90):
            return longitude, latitude
    except (IndexError, KeyError, TypeError, ValueError):
        return None
    return None


def ordenar(paradas, indices, duracoes, distancias):
    posicao = 0
    roteiro = []
    pendentes = []
    segundos = metros = 0
    for _, mesmo_horario in groupby(paradas, key=lambda parada: parada.hora):
        restantes = list(mesmo_horario)
        while restantes:
            candidatos = []
            for parada in restantes:
                destino = indices.get(parada.endereco)
                if destino is None:
                    continue
                tempo, distancia = duracoes[posicao][destino], distancias[posicao][destino]
                if all(isinstance(valor, (int, float)) and isfinite(valor) and valor >= 0 for valor in (tempo, distancia)):
                    candidatos.append((tempo, distancia, parada.id, destino, parada))
            if not candidatos:
                pendentes.extend({"id": p.id, "endereco": p.endereco, "hora": p.hora,
                                  "motivo": "Endereço não localizado" if p.endereco not in indices else "Trajeto indisponível"}
                                 for p in restantes)
                break
            tempo, distancia, _, posicao, parada = min(candidatos)
            restantes.remove(parada)
            roteiro.append({"id": parada.id, "endereco": parada.endereco, "hora": parada.hora,
                            "segundos": round(tempo), "metros": round(distancia)})
            segundos += tempo
            metros += distancia
    return {"paradas": roteiro, "pendentes": pendentes, "segundos": round(segundos), "metros": round(metros)}


def sugerir(sessao, dia, hora, origem):
    if not configuracao.openrouteservice_api_key:
        raise Recusa("O cálculo de rotas ainda não está configurado.", 503)
    paradas = coleta.paradas_da_rota(sessao, dia, hora)
    # A consulta externa não precisa manter uma conexão com o banco aberta.
    sessao.rollback()
    if not paradas:
        return {"paradas": [], "pendentes": [], "segundos": 0, "metros": 0}
    enderecos = list(dict.fromkeys([origem, *(parada.endereco for parada in paradas)]))
    if len(enderecos) > 25:
        raise Recusa("Há muitos endereços para calcular de uma vez. Selecione um horário da agenda.", 422)
    with ThreadPoolExecutor(max_workers=6) as executor:
        pontos = list(executor.map(localizar, enderecos))
    if pontos[0] is None:
        raise Recusa("Não encontrei o ponto de saída. Inclua rua, número, cidade e estado.", 422)
    locais = []
    indices = {}
    for endereco, ponto in zip(enderecos, pontos):
        if ponto is not None:
            indices[endereco] = len(locais)
            locais.append(ponto)
    if len(locais) == 1:
        return ordenar(paradas, indices, [[0]], [[0]])
    matriz = consultar("/v2/matrix/driving-car", {"locations": locais, "metrics": ["duration", "distance"]})
    try:
        return ordenar(paradas, indices, matriz["durations"], matriz["distances"])
    except (IndexError, KeyError, TypeError) as erro:
        raise Recusa("O serviço de rotas retornou dados incompletos. Tente novamente.", 502) from erro
