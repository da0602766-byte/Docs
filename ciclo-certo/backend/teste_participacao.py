"""Integração das novas jornadas em PostgreSQL descartável, com papel restrito da API."""
import unittest
from datetime import datetime,timedelta,timezone
from uuid import uuid4
from sqlalchemy import text
import teste_comunidade as infraestrutura


class TesteParticipacao(unittest.TestCase):
    setUpClass=classmethod(infraestrutura.TesteComunidade.setUpClass.__func__)
    tearDownClass=classmethod(infraestrutura.TesteComunidade.tearDownClass.__func__)
    setUp=infraestrutura.TesteComunidade.setUp
    conta=infraestrutura.TesteComunidade.conta
    criar=infraestrutura.TesteComunidade.criar
    aprovar=infraestrutura.TesteComunidade.aprovar
    resumo=infraestrutura.TesteComunidade.resumo

    def tornar_publica(self,p):
        with self.admin.begin() as c:
            c.execute(text(f'UPDATE {self.esquema}.comunidade_publicacoes SET publica=true WHERE id=:p'),dict(p=p))

    def test_publico_optin_e_og_sem_expor_dados(self):
        p=self.criar();self.aprovar(p)
        self.assertEqual(self.cliente.get(f'/comunidade/publico/{p}').status_code,404)
        self.assertEqual(self.cliente.get(f'/comunidade/item/{p}').status_code,401)
        self.tornar_publica(p)
        d=self.cliente.get(f'/comunidade/publico/{p}').json()
        self.assertTrue(d['publica']);self.assertNotIn('autor_id',d);self.assertNotIn('email',d)
        og=self.cliente.get(f'/comunidade/compartilhar/{p}')
        self.assertIn('og:description',og.text);self.assertEqual(og.headers['cache-control'],'no-store')
        self.cliente.delete(f'/comunidade/publicacoes/{p}',headers=self.m)
        self.assertEqual(self.cliente.get(f'/comunidade/publico/{p}').status_code,404)

    def test_favoritos_e_detalhe_isolados(self):
        p=self.criar()
        self.assertEqual(self.cliente.get(f'/comunidade/item/{p}',headers=self.o).status_code,403)
        self.assertEqual(self.cliente.put(f'/comunidade/publicacoes/{p}/favorito',json={'valor':True},headers=self.m).status_code,404)
        self.aprovar(p)
        for _ in range(2):self.assertEqual(self.cliente.put(f'/comunidade/publicacoes/{p}/favorito',json={'valor':True},headers=self.m).status_code,200)
        d=self.cliente.get('/comunidade/publicacoes?modo=salvos',headers=self.m).json()
        self.assertEqual([x['id'] for x in d['itens']],[p])
        self.assertTrue(self.cliente.get(f'/comunidade/item/{p}',headers=self.m).json()['salva'])
        self.assertEqual(self.cliente.get('/comunidade/publicacoes?modo=salvos',headers=self.o).json()['itens'],[])
        self.cliente.put(f'/comunidade/publicacoes/{p}/favorito',json={'valor':False},headers=self.m)
        self.assertEqual(self.cliente.get('/comunidade/publicacoes?modo=salvos',headers=self.m).json()['itens'],[])

    def test_correcao_historico_e_credito_unico(self):
        p=self.criar();rota=f'/comunidade/publicacoes/{p}'
        original=self.cliente.get(f'/comunidade/item/{p}',headers=self.m).json()['conteudo']
        decisao={'aprovar':False,'motivo':'Explique melhor a experiência e sua autoria.'}
        self.cliente.post(rota+'/moderar',json=decisao,headers=self.c)
        dados={'categoria':'Reutilização','conteudo':'Transformei uma embalagem em um vaso drenado para cultivar temperos. '+uuid4().hex,'publica':True}
        self.assertEqual(self.cliente.put(rota+'/reenviar',json=dados,headers=self.o).status_code,403)
        self.assertEqual(self.cliente.put(rota+'/reenviar',json=dados,headers=self.m).status_code,429)
        self.instante+=timedelta(seconds=61)
        r=self.cliente.put(rota+'/reenviar',json=dados,headers=self.m);self.assertEqual(r.status_code,200,r.text)
        hist=self.cliente.get(rota+'/historico',headers=self.m).json()['itens']
        self.assertEqual(hist[0]['conteudo'],original);self.assertEqual(hist[0]['motivo'],decisao['motivo'])
        self.assertEqual(self.cliente.get(rota+'/historico',headers=self.o).status_code,403)
        self.aprovar(p);self.aprovar(p)
        self.assertEqual(self.resumo()['saldo'],10)
        avisos=self.cliente.get('/comunidade/avisos',headers=self.m).json()['itens']
        self.assertEqual(len(avisos),2)
        self.assertEqual(self.cliente.put(rota+'/reenviar',json=dados,headers=self.m).status_code,409)
        self.assertEqual(self.cliente.post('/comunidade/publicacoes',json={'categoria':'Plantio','conteudo':original},headers=self.o).status_code,409)

    def test_respostas_notificam_somente_destinatario(self):
        p=self.criar();self.aprovar(p)
        rota=f'/comunidade/publicacoes/{p}/comentarios'
        c=self.cliente.post(rota,json={'conteudo':'Como preparar o recipiente para as mudas?'},headers=self.o).json()['id']
        r=self.cliente.post(rota,json={'conteudo':'Faça pequenos furos no fundo para escoar a água.','resposta_id':c},headers=self.m)
        self.assertEqual(r.status_code,201,r.text)
        avisos=self.cliente.get('/comunidade/avisos',headers=self.o).json()['itens'];self.assertEqual(len(avisos),1);self.assertEqual(avisos[0]['estado'],'resposta')
        self.assertEqual(self.cliente.get('/comunidade/avisos',headers=self.c).json()['itens'],[])
        outro=self.criar();self.aprovar(outro)
        self.assertEqual(self.cliente.post(f'/comunidade/publicacoes/{outro}/comentarios',json={'conteudo':'Resposta em outra conversa','resposta_id':c},headers=self.c).status_code,404)
        self.assertEqual(self.resumo(self.o)['saldo'],0)

    def test_eventos_moderacao_datas_inscricao_e_cancelamento(self):
        inicio=datetime.now(timezone.utc)+timedelta(days=2)
        dados=dict(tipo='evento',titulo='Oficina local de compostagem',descricao='Encontro organizado para aprender a cuidar de uma composteira.',local='Praça de teste local',inicio=inicio.isoformat(),fim=(inicio+timedelta(hours=2)).isoformat())
        self.assertEqual(self.cliente.post('/comunidade/acoes',json=dados,headers=self.m).status_code,403)
        r=self.cliente.post('/comunidade/acoes',json=dados,headers=self.c);self.assertEqual(r.status_code,201,r.text);a=r.json()['id']
        for _ in range(2):self.assertEqual(self.cliente.put(f'/comunidade/acoes/{a}/inscricao',json={'valor':True},headers=self.m).status_code,200)
        acao=next(x for x in self.cliente.get('/comunidade/acoes',headers=self.m).json()['itens'] if x['id']==a)
        self.assertEqual(acao['inscritos'],1);self.assertTrue(acao['inscrito']);self.assertNotIn('autor_id',acao)
        self.assertEqual(self.resumo()['saldo'],0)
        self.assertEqual(self.cliente.delete(f'/comunidade/acoes/{a}',headers=self.m).status_code,403)
        self.cliente.delete(f'/comunidade/acoes/{a}',headers=self.c)
        self.assertEqual(self.cliente.put(f'/comunidade/acoes/{a}/inscricao',json={'valor':True},headers=self.o).status_code,404)
        dados['fim']=dados['inicio'];self.assertEqual(self.cliente.post('/comunidade/acoes',json=dados,headers=self.c).status_code,422)

    def test_impacto_sem_peso_inventado_e_metricas_restritas(self):
        self.assertEqual(self.cliente.get('/comunidade/impacto',headers=self.m).json(),dict(coletas=0,materiais=[],meses=[]))
        with self.admin.begin() as c:
            for situacao in ['coletada','agendada','cancelada']:
                p=c.scalar(text(f"INSERT INTO {self.esquema}.coletas(morador_id,cooperador_id,endereco,dia,materiais_informados,situacao,pontos) VALUES (:m,:c,'Rua do teste local, 123','2026-11-04','[\"papel\"]',:s,0) RETURNING id"),dict(m=self.morador['id'],c=self.coop['id'],s=situacao))
                c.execute(text(f"INSERT INTO {self.esquema}.pesagens(coleta_id,material,quilos,pontos) VALUES (:p,'papel',2,0)"),dict(p=p))
        impacto=self.cliente.get('/comunidade/impacto',headers=self.m).json()
        self.assertEqual(impacto['coletas'],1);self.assertEqual(float(impacto['materiais'][0]['quilos']),2)
        self.assertEqual(impacto,self.cliente.get('/comunidade/impacto',headers=self.c).json())
        self.assertEqual(self.cliente.get('/comunidade/impacto',headers=self.o).json()['coletas'],0)
        self.assertEqual(self.cliente.get('/comunidade/metricas',headers=self.m).status_code,403)
        sessao=str(uuid4())
        for _ in range(2):self.assertEqual(self.cliente.post('/comunidade/visita',json={'sessao':sessao}).status_code,200)
        for _ in range(2):self.assertEqual(self.cliente.post('/comunidade/acesso',headers=self.m).status_code,200)
        d=self.cliente.get('/comunidade/metricas',headers=self.c).json()
        self.assertGreaterEqual(d['sessoes_visitantes_30d'],1)
        self.assertGreaterEqual(d['participantes_30d'],1)
