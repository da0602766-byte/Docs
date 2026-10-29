"""Regras da coleta e recompensa: o servidor autoriza, calcula e confirma em uma transação."""
import base64
import binascii
from io import BytesIO
from datetime import datetime, timedelta, date, timezone
from decimal import Decimal
from zoneinfo import ZoneInfo
from PIL import Image, UnidentifiedImageError
from sqlalchemy.exc import IntegrityError
import configuracao
from repositorios import operacao as repo
from repositorios import coleta as repo_coleta
from repositorios import usuario as repo_usuario
from servicos.catalogo import ITENS, tarifa, calcular_pontos
from seguranca import verificar_senha, gerar_hash_senha


class Recusa(Exception):
    def __init__(self, mensagem, status=409):
        self.status = status
        super().__init__(mensagem)


def agora():
    return datetime.now(timezone.utc)


def local():
    return datetime.now(ZoneInfo("America/Sao_Paulo"))


def exigir_perfil(usuario, tipo):
    if usuario.tipo != tipo:
        raise Recusa("Seu perfil não permite esta operação.", 403)


def obter_coleta(sessao, identificador, usuario, responsavel=False):
    registro = repo.coleta(sessao, identificador)
    if registro is None:
        raise Recusa("Coleta não encontrada.", 404)
    if usuario.tipo == "morador" and registro.morador_id != usuario.id:
        raise Recusa("Esta coleta não pertence a você.", 403)
    if responsavel and (usuario.tipo != "cooperativa" or registro.cooperador_id != usuario.id):
        raise Recusa("Somente o cooperador responsável pode alterar esta coleta.", 403)
    return registro


def saida(sessao, registro, nomes=None):
    """Listas não carregam imagens; comprovantes exigem uma consulta autorizada separada."""
    if nomes is None:
        nomes = repo.nomes(sessao, [registro.morador_id, registro.cooperador_id])
    campos = ("id", "morador_id", "endereco", "dia", "hora", "materiais_informados", "situacao", "pontos", "cooperador_id", "responsabilidade", "motivo_cancelamento", "versao", "finalizada_em", "nota", "comentario", "avaliada_em", "pontos_previstos")
    return {**{c: getattr(registro, c) for c in campos}, "nome_morador": nomes[registro.morador_id],
            "nome_cooperador": nomes.get(registro.cooperador_id), "tem_comprovante": registro.finalizada_em is not None}


def listar(sessao, usuario, dia=None, morador_id=None):
    if usuario.tipo == "morador":
        if morador_id is not None and morador_id != usuario.id:
            raise Recusa("Você só pode consultar suas coletas.", 403)
        morador_id = usuario.id
    registros = repo_coleta.listar(sessao, dia, morador_id)
    nomes = repo.nomes(sessao, {i for c in registros for i in (c.morador_id, c.cooperador_id) if i})
    return [saida(sessao, c, nomes) for c in registros]


def listar_pesagens(sessao, identificador, usuario):
    obter_coleta(sessao, identificador, usuario)
    return [dict(id=p.id, coleta_id=p.coleta_id, material=p.material, quilos=p.quilos, pontos=p.pontos, valor_kg=p.valor_kg) for p in repo.pesagens(sessao, identificador)]


def consultar_comprovante(sessao, identificador, usuario):
    obter_coleta(sessao, identificador, usuario, responsavel=usuario.tipo == "cooperativa")
    item = repo.comprovante(sessao, identificador)
    if not item:
        raise Recusa("Comprovante não encontrado.", 404)
    return dict(foto=item.foto, assinatura=item.assinatura, nome_signatario=item.nome_signatario, criado_em=item.criado_em, versao=item.versao)


def listar_notificacoes(sessao, usuario):
    return [dict(id=n.id, coleta_id=n.coleta_id, tipo=n.tipo, mensagem=n.mensagem, lida=n.lida, criado_em=n.criado_em) for n in repo.notificacoes(sessao, usuario.id)]


def ler_notificacao(sessao, identificador, usuario):
    aviso = next((n for n in repo.notificacoes(sessao, usuario.id) if n.id == identificador), None)
    if aviso is None:
        raise Recusa("Notificação não encontrada.", 404)
    aviso.lida = True
    repo.confirmar(sessao)
    return {"lida": True}


def capacidade_padrao(dia):
    return configuracao.capacidade_horario if dia.weekday() < 6 else 0


def consultar_agenda(sessao, mes):
    try:
        inicio = date.fromisoformat(mes + "-01")
    except ValueError:
        raise Recusa("Informe o mês no formato AAAA-MM.", 422)
    fim = (inicio.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)
    capacidades, reservas = repo.agenda(sessao, inicio, fim)
    dias = []
    instante = local()
    for numero in range(1, fim.day + 1):
        dia = inicio.replace(day=numero)
        horarios = []
        for hora in configuracao.horarios_coleta:
            capacidade = capacidades.get((dia, hora), capacidade_padrao(dia))
            ocupados = reservas.get((dia, hora), 0)
            futuro = datetime.fromisoformat(f"{dia}T{hora}").replace(tzinfo=instante.tzinfo) > instante
            horarios.append(dict(hora=hora, capacidade=capacidade, reservados=ocupados, disponiveis=max(0, capacidade - ocupados) if futuro else 0))
        dias.append(dict(dia=dia, horarios=horarios, coletas=sum(n for (d, h), n in reservas.items() if d == dia)))
    return {"mes": mes, "fuso": "America/Sao_Paulo", "dias": dias}


def agendar(sessao, dados, usuario):
    exigir_perfil(usuario, "morador")
    if dados.hora not in configuracao.horarios_coleta:
        raise Recusa("Escolha um horário da agenda.", 422)
    instante = local()
    if datetime.fromisoformat(f"{dados.dia}T{dados.hora}").replace(tzinfo=instante.tzinfo) <= instante:
        raise Recusa("Escolha um dia e horário futuros.", 422)
    materiais = [m.strip() for m in dados.materiais_informados if m.strip()]
    if not materiais or any(len(m) > 160 for m in materiais):
        raise Recusa("Informe materiais com até 160 caracteres por item.", 422)
    slot = repo.horario(sessao, dados.dia, dados.hora, capacidade_padrao(dados.dia))
    if repo.ocupacao(sessao, dados.dia, dados.hora) >= slot.capacidade:
        raise Recusa("Este horário ficou indisponível. Escolha outro na agenda.")
    registro = repo.nova_coleta(sessao, {**dados.model_dump(), "materiais_informados": materiais,
        "morador_id": usuario.id, "situacao": "agendada", "pontos": 0})
    repo.confirmar(sessao)
    return saida(sessao, registro)


def disponibilidade(sessao, dados, usuario):
    exigir_perfil(usuario, "cooperativa")
    if dados.hora not in configuracao.horarios_coleta or dados.dia < local().date():
        raise Recusa("Escolha um horário válido a partir de hoje.", 422)
    slot = repo.horario(sessao, dados.dia, dados.hora, capacidade_padrao(dados.dia))
    if dados.capacidade < repo.ocupacao(sessao, dados.dia, dados.hora):
        raise Recusa("A capacidade não pode ser menor que o número de coletas já reservadas.")
    slot.capacidade = dados.capacidade
    repo.confirmar(sessao)
    return {"mensagem": "Disponibilidade atualizada."}


def assumir(sessao, identificador, dados, usuario):
    exigir_perfil(usuario, "cooperativa")
    registro = obter_coleta(sessao, identificador, usuario)
    if registro.cooperador_id == usuario.id and registro.situacao == "em_coleta":
        return saida(sessao, registro)
    if registro.situacao != "agendada" or registro.cooperador_id:
        raise Recusa("Esta coleta não está disponível para assumir.")
    registro.cooperador_id, registro.responsabilidade, registro.situacao = usuario.id, dados.observacao, "em_coleta"
    repo.confirmar(sessao)
    return saida(sessao, registro)


def pesar(sessao, identificador, dados, usuario, pesagem_id=None, apagar=False):
    registro = obter_coleta(sessao, identificador, usuario, responsavel=True)
    if registro.situacao != "em_coleta":
        raise Recusa("Pesos só podem ser alterados antes da confirmação da coleta.")
    peso = next((p for p in repo.pesagens(sessao, identificador) if p.id == pesagem_id), None) if pesagem_id else None
    if pesagem_id and peso is None:
        raise Recusa("Pesagem não encontrada nesta coleta.", 404)
    if apagar:
        repo.remover_pesagem(sessao, peso)
    else:
        try:
            valor = tarifa(dados.material)
        except ValueError as erro:
            raise Recusa(str(erro), 422)
        campos = {"material": dados.material, "quilos": float(dados.quilos), "valor_kg": valor, "pontos": float(dados.quilos * valor * 100)}
        if peso:
            for chave, valor in campos.items():
                setattr(peso, chave, valor)
        else:
            peso = repo.nova_pesagem(sessao, {**campos, "coleta_id": identificador})
    repo.sincronizar(sessao)
    previsto = calcular_pontos(repo.pesagens(sessao, identificador))
    if previsto > 2000000000:
        raise Recusa("O valor excede a capacidade numérica desta coleta.", 422)
    registro.pontos_previstos = previsto
    registro.versao += 1
    repo.confirmar(sessao)
    return saida(sessao, registro)


def validar_imagem(dados, assinatura=False):
    """Decodifica e regrava JPEG/PNG, removendo metadados e recusando conteúdo inválido."""
    try:
        cabecalho, conteudo = dados.split(",", 1)
        if cabecalho not in ("data:image/jpeg;base64", "data:image/png;base64"):
            raise ValueError()
        bruto = base64.b64decode(conteudo, validate=True)
        if len(bruto) > (250000 if assinatura else 1600000):
            raise ValueError()
        with Image.open(BytesIO(bruto)) as img:
            if img.format not in ("JPEG", "PNG") or img.width * img.height > 16000000:
                raise ValueError()
            img.load()
            if min(img.size) < 20:
                raise ValueError()
            # Uma assinatura precisa ter marcas visíveis, além de um canvas vazio.
            if assinatura:
                fundo = Image.new("RGBA", img.size, "white")
                fundo.alpha_composite(img.convert("RGBA"))
                extremos = fundo.convert("L").getextrema()
                if extremos[1] - extremos[0] < 20:
                    raise ValueError()
            img.thumbnail((1600, 1600))
            destino = BytesIO()
            img.convert("RGB").save(destino, format="JPEG", quality=85)
            return "data:image/jpeg;base64," + base64.b64encode(destino.getvalue()).decode()
    except (ValueError, binascii.Error, UnidentifiedImageError, OSError, Image.DecompressionBombError):
        raise Recusa("Envie uma imagem JPEG/PNG válida e uma assinatura desenhada; foto até 1,6 MB e assinatura até 250 KB.", 422)


def finalizar(sessao, identificador, dados, usuario):
    registro = obter_coleta(sessao, identificador, usuario, responsavel=True)
    if registro.situacao != "em_coleta":
        raise Recusa("Esta coleta já foi finalizada ou cancelada.")
    if dados.versao != registro.versao:
        raise Recusa("Os pesos mudaram. Atualize a coleta e solicite uma nova assinatura.")
    if not repo.pesagens(sessao, identificador):
        raise Recusa("Registre pelo menos uma pesagem antes de finalizar.")
    nome = repo_usuario.buscar_por_id(sessao, registro.morador_id).nome
    if " ".join(dados.nome_signatario.casefold().split()) != " ".join(nome.casefold().split()):
        raise Recusa("A confirmação deve ser assinada pelo morador solicitante.", 422)
    foto = validar_imagem(dados.foto)
    assinatura = validar_imagem(dados.assinatura, assinatura=True)
    instante = agora()
    repo.comprovante(sessao, identificador, dict(foto=foto, assinatura=assinatura, nome_signatario=dados.nome_signatario, criado_em=instante, versao=registro.versao))
    registro.situacao, registro.finalizada_em = "aguardando_avaliacao", instante
    repo.notificar(sessao, registro, "avaliacao", f"Sua coleta nº {registro.id} foi finalizada. Avalie para liberar {registro.pontos_previstos} pontos. Qualquer nota de 1 a 5 libera o mesmo valor.", instante)
    repo.confirmar(sessao)
    return saida(sessao, registro)


def cancelar(sessao, identificador, dados, usuario):
    registro = obter_coleta(sessao, identificador, usuario, responsavel=True)
    if registro.situacao != "em_coleta":
        raise Recusa("Somente uma coleta em atendimento pode ser cancelada.")
    registro.situacao, registro.motivo_cancelamento = "cancelada", dados.motivo
    registro.pontos, registro.pontos_previstos = 0, 0
    repo.notificar(sessao, registro, "cancelamento", f"Coleta nº {registro.id} cancelada: {dados.motivo}", agora())
    repo.confirmar(sessao)
    return saida(sessao, registro)


def solicitar_avaliacao(sessao, identificador, usuario):
    registro = obter_coleta(sessao, identificador, usuario, responsavel=True)
    if registro.situacao != "aguardando_avaliacao":
        raise Recusa("Esta coleta não tem avaliação pendente.")
    repo.notificar(sessao, registro, "avaliacao", f"Lembrete: avalie a coleta nº {registro.id} para liberar sua recompensa fictícia.", agora())
    repo.confirmar(sessao)
    return {"mensagem": "Solicitação disponível nas notificações do morador."}


def avaliar(sessao, identificador, dados, usuario):
    exigir_perfil(usuario, "morador")
    registro = obter_coleta(sessao, identificador, usuario)
    if registro.avaliada_em:
        return {"coleta": saida(sessao, registro), "creditada": False}
    if registro.situacao != "aguardando_avaliacao":
        raise Recusa("A coleta precisa ser finalizada antes da avaliação.")
    dono = repo.usuario(sessao, usuario.id)
    instante = agora()
    registro.nota, registro.comentario, registro.avaliada_em = dados.nota, dados.comentario, instante
    registro.situacao, registro.pontos = "coletada", registro.pontos_previstos
    dinheiro = dono.recompensa == "dinheiro"
    repo.movimento(sessao, dict(usuario_id=usuario.id, coleta_id=registro.id, chave=f"coleta-{registro.id}", tipo="credito_dinheiro" if dinheiro else "credito_pontos", pontos=0 if dinheiro else registro.pontos_previstos, centavos=registro.pontos_previstos if dinheiro else 0, criado_em=instante))
    for aviso in repo.notificacoes(sessao, usuario.id):
        if aviso.coleta_id == registro.id and aviso.tipo == "avaliacao":
            aviso.lida = True
    repo.confirmar(sessao)
    return {"coleta": saida(sessao, registro), "creditada": True, "destino": dono.recompensa}


def carteira(sessao, usuario):
    exigir_perfil(usuario, "morador")
    movimentos = repo.movimentos(sessao, usuario.id)
    return {"recompensa": usuario.recompensa, "ficticio": True, "pontos": sum(m.pontos for m in movimentos),
            "centavos": sum(m.centavos for m in movimentos), "movimentos": [dict(id=m.id, coleta_id=m.coleta_id, tipo=m.tipo, pontos=m.pontos, centavos=m.centavos, criado_em=m.criado_em, comprovante=m.chave if m.tipo == "troca" else None) for m in movimentos]}


def preferencia(sessao, dados, usuario):
    exigir_perfil(usuario, "morador")
    dono = repo.usuario(sessao, usuario.id)
    dono.recompensa = dados.recompensa
    repo.confirmar(sessao)
    return carteira(sessao, dono)


def resgatar(sessao, dados, usuario):
    exigir_perfil(usuario, "morador")
    dono = repo.usuario(sessao, usuario.id)
    movimentos = repo.movimentos(sessao, usuario.id)
    anterior = next((m for m in movimentos if m.chave == dados.chave), None)
    if anterior:
        if anterior.pontos != -dados.pontos or anterior.tipo != dados.destino:
            raise Recusa("Esta chave já identifica outro resgate.")
        return carteira(sessao, dono)
    if sum(m.pontos for m in movimentos) < dados.pontos:
        raise Recusa("Saldo de pontos insuficiente.")
    repo.movimento(sessao, dict(usuario_id=usuario.id, chave=dados.chave, tipo=dados.destino, pontos=-dados.pontos, centavos=dados.pontos if dados.destino == "dinheiro" else 0, criado_em=agora()))
    repo.confirmar(sessao)
    return carteira(sessao, dono)


def alterar_perfil(sessao, dados, usuario):
    dono = repo.usuario(sessao, usuario.id)
    if not verificar_senha(dados.senha_atual.get_secret_value(), dono.senha_hash):
        raise Recusa("Senha atual incorreta.", 403)
    if not dados.email and not dados.nova_senha:
        raise Recusa("Informe o novo e-mail ou uma nova senha.", 422)
    if dados.email:
        email = str(dados.email).casefold()
        outro = repo_usuario.buscar_por_email(sessao, email)
        if outro and outro.id != dono.id:
            raise Recusa("Este e-mail já está em uso.")
        dono.email = email
    if dados.nova_senha:
        dono.senha_hash = gerar_hash_senha(dados.nova_senha.get_secret_value())
    dono.versao_token += 1
    try:
        repo.confirmar(sessao)
    except IntegrityError:
        sessao.rollback()
        raise Recusa("Este e-mail já está em uso.")
    return {"mensagem": "Perfil atualizado. Entre novamente com seus dados novos."}
