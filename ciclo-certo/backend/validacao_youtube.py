"""Extrai somente IDs de endereços conhecidos, sem requisitar URLs fornecidas pelo usuário."""
import re
from urllib.parse import urlsplit, parse_qs


def identificar_video(link):
    if not link or not link.strip():
        return None
    valor = link.strip()
    if '://' not in valor:
        valor = 'https://' + valor
    try:
        url = urlsplit(valor)
        if url.scheme not in ('http', 'https') or url.username or url.password or url.port not in (None, 443 if url.scheme == 'https' else 80):
            raise ValueError()
        partes = url.path.strip('/').split('/')
        identificador = None
        if url.hostname in ('youtu.be', 'www.youtu.be') and len(partes) == 1:
            identificador = partes[0]
        elif url.hostname in ('youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com'):
            if url.path == '/watch':
                valores = parse_qs(url.query).get('v', [])
                identificador = valores[0] if len(valores) == 1 else None
            elif len(partes) == 2 and partes[0] in ('shorts', 'live', 'embed'):
                identificador = partes[1]
        elif url.hostname in ('youtube-nocookie.com', 'www.youtube-nocookie.com') and len(partes) == 2 and partes[0] == 'embed':
            identificador = partes[1]
        if not identificador or not re.fullmatch(r'[A-Za-z0-9_-]{11}', identificador):
            raise ValueError()
        return identificador
    except ValueError:
        raise ValueError('Informe um link válido de vídeo do YouTube (watch, youtu.be, Shorts ou live).') from None
