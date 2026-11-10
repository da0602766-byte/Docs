"""Dados fictícios opcionais para revisar a loja e os fluxos no preview local."""
from datetime import timedelta
from io import BytesIO
import base64
from PIL import Image, ImageDraw
from fastapi.testclient import TestClient
from preview_teste import app
from servicos.operacao import local

def preparar():
    # preview_teste fixa a conexão no banco ciclo_certo_teste_local de 127.0.0.1.
    with TestClient(app) as cliente:
        def login(email):
            r = cliente.post('/login', data={'username': email, 'password': 'TesteLocal123!'})
            r.raise_for_status()
            return {'Authorization': 'Bearer ' + r.json()['access_token']}
        morador, cooperador = login('morador@example.org'), login('cooperador@example.org')
        if cliente.get('/coletas', headers=morador).json():
            print('Demonstração já possui coletas; nenhum registro alterado.')
            return
        def post(url, dados, cabecalho):
            r = cliente.post(url, json=dados, headers=cabecalho)
            r.raise_for_status()
            return r.json()
        dia = local().date() + timedelta(days=2)
        if dia.weekday() == 6:
            dia += timedelta(days=1)
        def nova(hora):
            return post('/coletas', dict(endereco='Rua da Comunidade, 120',dia=str(dia),hora=hora,materiais_informados=['Cobre', 'Papelão']),morador)
        c = nova('08:00')
        post(f"/coletas/{c['id']}/assumir", {'confirmar':True}, cooperador)
        c = post(f"/coletas/{c['id']}/pesagens", {'material':'cobre','quilos':2}, cooperador)
        def imagem(assinatura=False):
            img=Image.new('RGB',(300,100),'white' if assinatura else 'green')
            if assinatura:
                ImageDraw.Draw(img).line([(20,70),(60,20),(100,70),(240,30)],fill='black',width=4)
            arq=BytesIO();img.save(arq,format='PNG')
            return 'data:image/png;base64,'+base64.b64encode(arq.getvalue()).decode()
        post(f"/coletas/{c['id']}/finalizar",dict(versao=c['versao'],foto=imagem(),assinatura=imagem(True),nome_signatario='Morador de Teste',aceite=True),cooperador)
        post(f"/coletas/{c['id']}/avaliar",dict(nota=5,comentario='A equipe chegou no horário e explicou a pesagem com cuidado. Depoimento fictício de demonstração.',autoriza_depoimento=True),morador)
        nova('09:00')
        c=nova('10:00')
        post(f"/coletas/{c['id']}/assumir", {'confirmar':True}, cooperador)
        print('Demonstração criada: 3.000 pontos, uma coleta pendente, uma aceita e uma concluída.')

if __name__ == '__main__':
    preparar()
