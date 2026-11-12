"""Regras, autorização e corridas reais em schema PostgreSQL descartável."""
import unittest
from unittest.mock import patch
from datetime import datetime, timedelta, timezone
from concurrent.futures import ThreadPoolExecutor
from uuid import uuid4
from sqlalchemy import text
import teste_operacao as infraestrutura


class TesteComunidade(unittest.TestCase):
    setUpClass = classmethod(infraestrutura.TesteOperacao.setUpClass.__func__)
    tearDownClass = classmethod(infraestrutura.TesteOperacao.tearDownClass.__func__)
    conta = infraestrutura.TesteOperacao.conta

    def setUp(self):
        self.morador, self.m = self.conta('morador')
        self.coop, self.c = self.conta('cooperativa')
        self.outro, self.o = self.conta('morador')
        with self.admin.begin() as conexao:
            conexao.execute(text(f'INSERT INTO {self.esquema}.comunidade_moderadores VALUES (:id)'), {'id': self.coop['id']})
        self.instante = datetime(2026, 11, 2, 15, tzinfo=timezone.utc)
        self.relogio = patch('servicos.comunidade.agora', side_effect=lambda: self.instante)
        self.relogio.start()
        self.addCleanup(self.relogio.stop)
        # Os testes de moderação manual representam registros pendentes anteriores à IA.
        self.automatica = patch('servicos.comunidade.moderar_com_cici')
        self.automatica.start()
        self.addCleanup(self.automatica.stop)
        classificador = patch('servicos.comunidade.classificar', return_value='pertinente')
        self.classificar = classificador.start()
        self.addCleanup(classificador.stop)
        denuncias = patch('servicos.comunidade.analisar', return_value=('incerta', None))
        denuncias.start()
        self.addCleanup(denuncias.stop)

    def criar(self, headers=None, conteudo=None, categoria='Plantio'):
        self.instante += timedelta(seconds=61)
        resposta = self.cliente.post('/comunidade/publicacoes', json=dict(categoria=categoria, conteudo=conteudo or f'Experiência na comunidade: {uuid4().hex}'), headers=headers or self.m)
        self.assertEqual(resposta.status_code, 201, resposta.text)
        return resposta.json()['id']

    def aprovar(self, identificador, headers=None):
        resposta = self.cliente.post(f'/comunidade/publicacoes/{identificador}/moderar', json={'aprovar': True}, headers=headers or self.c)
        self.assertEqual(resposta.status_code, 200, resposta.text)
        return resposta

    def resumo(self, headers=None):
        return self.cliente.get('/comunidade/resumo', headers=headers or self.m).json()

    def test_analise_automatica_publica_apenas_conteudo_aprovado(self):
        self.automatica.stop()
        self.classificar.side_effect = ['fora_do_tema', 'pertinente']
        rejeitada = self.criar(conteudo='Garrafas para reciclagem, mas votem no meu candidato.')
        aprovada = self.criar(conteudo='Separe garrafas de vidro para a coleta seletiva.')
        feed = self.cliente.get('/comunidade/publicacoes', headers=self.o).json()['itens']
        self.assertEqual([item['id'] for item in feed], [aprovada])
        minhas = self.cliente.get('/comunidade/publicacoes?modo=minhas', headers=self.m).json()['itens']
        self.assertEqual(next(item for item in minhas if item['id'] == rejeitada)['estado'], 'rejeitada')
        self.assertEqual(self.resumo()['saldo'], 10)
        self.assertEqual(len(self.cliente.get('/comunidade/avisos', headers=self.m).json()['itens']), 2)

    def test_falha_da_ia_preserva_rascunho_reenviavel_e_bloqueia_comentario(self):
        self.automatica.stop()
        dados = dict(categoria='Reciclagem', conteudo='Separe as latas de alumínio para a coleta.')
        self.classificar.return_value = 'indisponivel'
        falha = self.cliente.post('/comunidade/publicacoes', headers=self.m, json=dados)
        self.assertEqual(falha.status_code, 503)
        self.assertEqual(self.cliente.get('/comunidade/publicacoes?modo=minhas', headers=self.m).json()['itens'], [])
        self.classificar.return_value = 'pertinente'
        criada = self.cliente.post('/comunidade/publicacoes', headers=self.m, json=dados)
        self.assertEqual(criada.status_code, 201, criada.text)
        rota = f"/comunidade/publicacoes/{criada.json()['id']}/comentarios"
        self.classificar.return_value = 'fora_do_tema'
        recusado = self.cliente.post(rota, headers=self.o, json={'conteudo': 'Votem no meu candidato.'})
        self.assertEqual(recusado.status_code, 422)
        self.assertEqual(self.cliente.get(rota, headers=self.o).json()['itens'], [])
        self.assertEqual(self.classificar.call_args.kwargs['contexto'], (dados['conteudo'],))

    def test_reenvio_e_analisado_antes_de_ir_ao_feed(self):
        self.automatica.stop()
        self.classificar.return_value = 'incerto'
        identificador = self.criar(conteudo='Qualquer coisa que escrevi aqui.')
        self.instante += timedelta(seconds=61)
        self.classificar.return_value = 'pertinente'
        dados = dict(categoria='Plantio', conteudo='Cultivei temperos em um vaso reutilizado.')
        resposta = self.cliente.put(f'/comunidade/publicacoes/{identificador}/reenviar', headers=self.m, json=dados)
        self.assertEqual(resposta.status_code, 200, resposta.text)
        self.assertEqual(resposta.json()['estado'], 'aprovada')
        self.classificar.assert_called_with(dados['conteudo'], categoria='Plantio')

    def test_aprovacao_identidade_e_isolamento_das_coletas(self):
        antes = self.cliente.get('/carteira', headers=self.m).json()
        identificador = self.criar(conteudo='Minha horta cresce com composto preparado em casa.')
        self.assertEqual(self.resumo()['saldo'], 0)
        feed = self.cliente.get('/comunidade/publicacoes', headers=self.m).json()
        self.assertNotIn(identificador, [p['id'] for p in feed['itens']])
        self.aprovar(identificador)
        self.aprovar(identificador)
        self.assertEqual(self.resumo()['saldo'], 10)
        item = self.cliente.get('/comunidade/publicacoes', headers=self.m).json()['itens'][0]
        self.assertEqual(item['autor'], {'nome': 'Pessoa Teste', 'perfil': 'morador'})
        self.assertNotIn('email', str(item))
        self.assertEqual(self.cliente.get('/carteira', headers=self.m).json(), antes)

    def test_limite_diario_estorno_sem_reabrir_cota(self):
        ids = [self.criar() for _ in range(4)]
        for identificador in ids[:3]:
            self.aprovar(identificador)
        self.assertEqual(self.resumo()['saldo'], 20)
        self.assertEqual(self.resumo()['usadas_dia'], 2)
        for _ in range(2):
            self.assertEqual(self.cliente.delete(f'/comunidade/publicacoes/{ids[0]}', headers=self.m).status_code, 200)
        self.aprovar(ids[3])
        self.assertEqual(self.resumo()['saldo'], 10)
        self.assertEqual(self.resumo()['usadas_dia'], 2)
        itens = self.cliente.get('/comunidade/publicacoes?modo=minhas', headers=self.m).json()['itens']
        self.assertEqual(next(p for p in itens if p['id'] == ids[3])['pontos'], 0)

    def test_limite_semanal_e_virada_brasilia(self):
        for dia in range(3):
            self.instante = datetime(2026, 11, 2 + dia, 15, tzinfo=timezone.utc)
            for _ in range(2):
                self.aprovar(self.criar())
        self.instante = datetime(2026, 11, 9, 2, 55, tzinfo=timezone.utc)  # Domingo em Brasília.
        self.aprovar(self.criar())
        self.assertEqual(self.resumo()['saldo'], 60)
        self.assertEqual(self.resumo()['usadas_semana'], 6)
        self.instante = datetime(2026, 11, 9, 3, tzinfo=timezone.utc)
        self.aprovar(self.criar())
        self.assertEqual(self.resumo()['saldo'], 70)
        self.assertEqual(self.resumo()['usadas_semana'], 1)
        self.assertEqual(self.resumo()['semana'], '2026-11-09')

    def test_mesma_regra_cooperador_e_configuravel(self):
        self.aprovar(self.criar(self.c))
        self.assertEqual(self.resumo(self.c)['saldo'], 10)
        with self.admin.begin() as conexao:
            conexao.execute(text(f'UPDATE {self.esquema}.comunidade_regras SET pontos=15 WHERE id=1'))
        try:
            self.aprovar(self.criar(self.c))
            self.assertEqual(self.resumo(self.c)['saldo'], 25)
        finally:
            with self.admin.begin() as conexao:
                conexao.execute(text(f'UPDATE {self.esquema}.comunidade_regras SET pontos=10 WHERE id=1'))

    def test_autorizacao_categoria_e_campos_forjados(self):
        identificador = self.criar()
        self.assertEqual(self.cliente.get('/comunidade/publicacoes').status_code, 401)
        for caminho in ['/comunidade/publicacoes?modo=moderacao', '/comunidade/denuncias']:
            self.assertEqual(self.cliente.get(caminho, headers=self.m).status_code, 403)
        self.assertEqual(self.cliente.post(f'/comunidade/publicacoes/{identificador}/moderar', json={'aprovar': True}, headers=self.o).status_code, 403)
        self.assertEqual(self.cliente.delete(f'/comunidade/publicacoes/{identificador}', headers=self.o).status_code, 403)
        for dados in [{'conteudo': 'Um conteúdo sem categoria.'}, {'categoria': 'Outra', 'conteudo': 'Um conteúdo inválido.'}, {'categoria': 'Plantio', 'conteudo': 'Um conteúdo válido.', 'autor_id': self.coop['id']}, {'categoria': 'Plantio', 'conteudo': 'Um conteúdo válido.', 'pontos': 100}]:
            self.assertEqual(self.cliente.post('/comunidade/publicacoes', json=dados, headers=self.m).status_code, 422)
        self.assertEqual(self.cliente.get('/comunidade/publicacoes?limite=500', headers=self.m).status_code, 422)

    def test_repeticao_normalizada_e_limite_antispam(self):
        identificador = self.criar(conteudo='Separe as folhas secas para preparar o composto do jardim.')
        self.cliente.delete(f'/comunidade/publicacoes/{identificador}', headers=self.m)
        for conteudo in ['SEPARE AS FOLHAS SECAS PARA PREPARAR O COMPOSTO DO JARDIM!!!', 'Separe as folhas secas para preparar o composto do jardim hoje.']:
            r = self.cliente.post('/comunidade/publicacoes', json={'categoria': 'Plantio', 'conteudo': conteudo}, headers=self.m)
            self.assertEqual(r.status_code, 409, r.text)
        r = self.cliente.post('/comunidade/publicacoes', json={'categoria': 'Plantio', 'conteudo': 'Separe as folhas secas para preparar o composto do jardim.'}, headers=self.o)
        self.assertEqual(r.status_code, 409)
        r = self.cliente.post('/comunidade/publicacoes', json={'categoria': 'Plantio', 'conteudo': 'Garrafas podem virar vasos diferentes e coloridos.'}, headers=self.m)
        self.assertEqual(r.status_code, 429)

    def test_concorrencia_aprovacoes_e_exclusao(self):
        ids = [self.criar() for _ in range(4)]
        with ThreadPoolExecutor(max_workers=6) as executor:
            respostas = list(executor.map(lambda i: self.cliente.post(f'/comunidade/publicacoes/{i}/moderar', json={'aprovar': True}, headers=self.c), ids + ids[:2]))
        self.assertTrue(all(r.status_code == 200 for r in respostas), [r.text for r in respostas])
        self.assertEqual(self.resumo()['saldo'], 20)
        self.assertEqual(self.resumo()['usadas_dia'], 2)
        ultimo = self.criar()
        avisos = self.cliente.get('/comunidade/notificacoes', headers=self.m).json()['itens']
        self.assertEqual(len(avisos), 4, 'Moderação concorrente gera um único aviso por publicação')
        with ThreadPoolExecutor(max_workers=2) as executor:
            a = executor.submit(self.cliente.post, f'/comunidade/publicacoes/{ultimo}/moderar', json={'aprovar': True}, headers=self.c)
            b = executor.submit(self.cliente.delete, f'/comunidade/publicacoes/{ultimo}', headers=self.m)
            self.assertIn(a.result().status_code, [200, 409])
            self.assertEqual(b.result().status_code, 200)
        self.assertNotIn(ultimo, [p['id'] for p in self.cliente.get('/comunidade/publicacoes?modo=minhas', headers=self.m).json()['itens']])

    def test_comentarios_denuncias_e_moderacao(self):
        identificador = self.criar()
        rota = f'/comunidade/publicacoes/{identificador}'
        self.assertEqual(self.cliente.post(rota + '/comentarios', json={'conteudo': 'Ainda pendente.'}, headers=self.o).status_code, 404)
        self.aprovar(identificador)
        r = self.cliente.post(rota + '/comentarios', json={'conteudo': 'Gostei da experiência compartilhada!'}, headers=self.o)
        self.assertEqual(r.status_code, 201, r.text)
        comentario = r.json()['id']
        self.assertEqual(self.resumo(self.o)['saldo'], 0)
        self.assertEqual(self.cliente.post(rota + '/comentarios', json={'conteudo': 'Gostei da experiência compartilhada!'}, headers=self.o).status_code, 409)
        for _ in range(2):
            self.assertEqual(self.cliente.post(rota + '/denuncias', json={'motivo': 'Precisa de análise da moderação.', 'comentario_id': comentario}, headers=self.m).status_code, 200)
        denuncias = self.cliente.get('/comunidade/denuncias', headers=self.c).json()['itens']
        denuncia = next(d for d in denuncias if d['comentario_id'] == comentario)
        self.assertEqual(len([d for d in denuncias if d['comentario_id'] == comentario]), 1)
        self.assertNotIn('autor_id', denuncia)
        self.assertEqual(self.cliente.delete(f'/comunidade/comentarios/{comentario}', headers=self.m).status_code, 403)
        self.assertEqual(self.cliente.delete(f'/comunidade/comentarios/{comentario}', headers=self.c).status_code, 200)
        self.assertEqual(self.cliente.get(rota + '/comentarios', headers=self.m).json()['itens'], [])
        self.assertEqual(self.cliente.post(f"/comunidade/denuncias/{denuncia['id']}/resolver", json={}, headers=self.c).status_code, 200)

    def test_rejeicao_e_paginacao_filtros(self):
        ids = [self.criar(categoria='Reutilização') for _ in range(3)]
        for identificador in ids:
            self.aprovar(identificador)
        rota = '/comunidade/publicacoes?modo=minhas&categoria=Reutiliza%C3%A7%C3%A3o&perfil=morador&limite=2'
        primeira = self.cliente.get(rota, headers=self.m).json()
        self.assertEqual([p['id'] for p in primeira['itens']], ids[::-1][:2])
        segunda = self.cliente.get(rota + f"&antes={primeira['proximo']}", headers=self.m).json()
        self.assertEqual([p['id'] for p in segunda['itens']], ids[:1])
        self.assertIsNone(segunda['proximo'])
        pendente = self.criar()
        r = self.cliente.post(f'/comunidade/publicacoes/{pendente}/moderar', json={'aprovar': False, 'motivo': 'Conteúdo fora do tema da comunidade.'}, headers=self.c)
        self.assertEqual(r.status_code, 200)
        self.assertEqual(self.resumo()['saldo'], 20)

    def test_rls_e_privilegios_administrativos(self):
        with self.admin.connect() as conexao:
            tabelas = conexao.execute(text("SELECT relname, relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=:schema AND c.relkind='r' AND c.relname LIKE 'comunidade_%'"), {'schema': self.esquema}).all()
            self.assertEqual(len(tabelas), 13)
            self.assertTrue(all(t[1] for t in tabelas))
            for tabela, _ in tabelas:
                for papel in ['anon', 'authenticated']:
                    self.assertFalse(conexao.scalar(text("SELECT has_table_privilege(:papel, :tabela, 'SELECT,INSERT,UPDATE,DELETE')"), {'papel': papel, 'tabela': f'{self.esquema}.{tabela}'}))
            for tabela in ['comunidade_moderadores', 'comunidade_regras']:
                self.assertFalse(conexao.scalar(text("SELECT has_table_privilege('ciclo_certo_backend', :tabela, 'INSERT,UPDATE,DELETE')"), {'tabela': f'{self.esquema}.{tabela}'}))


    def test_avisos_persistentes_privados_credito_e_leitura(self):
        ids = [self.criar() for _ in range(3)]
        for identificador in ids:
            self.aprovar(identificador)
            self.aprovar(identificador)
        rota = '/comunidade/notificacoes'
        self.assertEqual(self.cliente.get(rota).status_code, 401)
        self.assertEqual(self.cliente.get(rota, headers=self.o).json()['itens'], [])
        avisos = self.cliente.get(rota, headers=self.m).json()['itens']
        self.assertEqual(len(avisos), 3)
        self.assertIn('10 pontos', avisos[0]['mensagem'])
        self.assertIn('sem pontos', avisos[2]['mensagem'])
        leitura = f"{rota}/{avisos[0]['id']}/lida"
        self.assertEqual(self.cliente.put(leitura, headers=self.c).status_code, 404)
        for _ in range(2):
            self.assertEqual(self.cliente.put(leitura, headers=self.m).status_code, 200)
        self.assertEqual(len(self.cliente.get(rota, headers=self.m).json()['itens']), 2)

    def test_recusa_notifica_cooperador_sem_credito(self):
        identificador = self.criar(self.c)
        rota = f'/comunidade/publicacoes/{identificador}/moderar'
        for _ in range(2):
            r = self.cliente.post(rota, json={'aprovar': False, 'motivo': 'Explique melhor a relação do conteúdo com reciclagem.'}, headers=self.c)
            self.assertEqual(r.status_code, 200)
        avisos = self.cliente.get('/comunidade/notificacoes', headers=self.c).json()['itens']
        self.assertEqual(len(avisos), 1)
        self.assertEqual(avisos[0]['estado'], 'rejeitada')
        self.assertIn('Explique melhor', avisos[0]['mensagem'])
        self.assertEqual(self.resumo(self.c)['saldo'], 0)

    def test_youtube_persistencia_moderacao_e_repeticao(self):
        r = self.cliente.post('/comunidade/publicacoes', json={'categoria': 'Plantio', 'conteudo': 'Este vídeo apresenta o processo para preparar uma pequena horta.', 'youtube_url': 'https://youtu.be/M7lc1UVf-VE?si=compartilhar'}, headers=self.m)
        self.assertEqual(r.status_code, 201, r.text)
        identificador = r.json()['id']
        minhas = self.cliente.get('/comunidade/publicacoes?modo=minhas', headers=self.m).json()['itens']
        self.assertEqual(minhas[0]['youtube_id'], 'M7lc1UVf-VE')
        self.assertNotIn(identificador, [p['id'] for p in self.cliente.get('/comunidade/publicacoes', headers=self.o).json()['itens']])
        self.aprovar(identificador)
        self.assertEqual(self.cliente.get('/comunidade/publicacoes', headers=self.o).json()['itens'][0]['youtube_id'], 'M7lc1UVf-VE')
        self.cliente.delete(f'/comunidade/publicacoes/{identificador}', headers=self.m)
        self.instante += timedelta(seconds=61)
        r = self.cliente.post('/comunidade/publicacoes', json={'categoria': 'Plantio', 'conteudo': 'Um texto completamente diferente que tenta repetir o mesmo vídeo.', 'youtube_url': 'https://www.youtube.com/shorts/M7lc1UVf-VE'}, headers=self.m)
        self.assertEqual(r.status_code, 409, r.text)
        self.assertIn('vídeo', r.json()['detail'])

    def test_youtube_validacao_sem_urls_arbitrarias(self):
        from validacao_youtube import identificar_video
        validos = ['https://youtu.be/M7lc1UVf-VE?t=15', 'www.youtube.com/watch?v=M7lc1UVf-VE&list=abc', 'https://m.youtube.com/shorts/M7lc1UVf-VE', 'https://youtube.com/live/M7lc1UVf-VE', 'https://www.youtube-nocookie.com/embed/M7lc1UVf-VE']
        for link in validos:
            self.assertEqual(identificar_video(link), 'M7lc1UVf-VE')
        invalidos = ['javascript:alert(1)', 'https://youtube.com.evil.org/watch?v=M7lc1UVf-VE', 'https://youtube.com@evil.org/watch?v=M7lc1UVf-VE', 'https://127.0.0.1/M7lc1UVf-VE', 'https://youtube.com/playlist?list=abc', 'https://youtu.be/curto', 'https://youtube.com/watch?v=M7lc1UVf-VE&v=12345678901', '<iframe src="https://youtube.com/embed/M7lc1UVf-VE"></iframe>']
        for link in invalidos:
            r = self.cliente.post('/comunidade/publicacoes', json={'categoria': 'Plantio', 'conteudo': 'Conteúdo para validar o endereço fornecido.', 'youtube_url': link}, headers=self.m)
            self.assertEqual(r.status_code, 422, link)


if __name__ == '__main__':
    unittest.main()
