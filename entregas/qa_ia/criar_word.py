from docx import Document
from docx.shared import Cm, Pt, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from pathlib import Path
out = Path('C:/Users/douglas63054626/Documents/Docs/entregas/Ciclo_Certo_Proposta_IA.docx')
doc = Document()
sec = doc.sections[0]
sec.page_width = Cm(21); sec.page_height = Cm(29.7)
sec.top_margin = sec.bottom_margin = Cm(2)
sec.left_margin = sec.right_margin = Cm(2.2)
for name in ['Normal','Title','Subtitle','Heading 1','Heading 2','List Bullet','List Number']:
    st = doc.styles[name]
    st.font.name = 'Calibri'; st.font.color.rgb = RGBColor(0,0,0)
    st.font.size = Pt(11)
    st.paragraph_format.space_after = Pt(6)
    st.paragraph_format.line_spacing = 1.08
    lang = OxmlElement('w:lang'); lang.set(qn('w:val'),'pt-BR'); st.element.get_or_add_rPr().append(lang)
doc.styles['Title'].font.size = Pt(23)
doc.styles['Title'].paragraph_format.space_after = Pt(9)
doc.styles['Subtitle'].font.size = Pt(12)
doc.styles['Heading 1'].font.size = Pt(14)
doc.styles['Heading 1'].paragraph_format.space_before = Pt(12)
doc.styles['Heading 1'].paragraph_format.space_after = Pt(5)
doc.core_properties.title = 'Proposta de inteligência artificial para o Ciclo Certo'
doc.core_properties.subject = 'Assistência à descrição de materiais no agendamento'
doc.core_properties.author = ''
doc.core_properties.keywords = 'Ciclo Certo, IA, planejamento, OpenAI'
def p(t,style=None): return doc.add_paragraph(t,style)
def h(t): doc.add_heading(t,1)
p('Proposta de inteligência artificial para o Ciclo Certo','Title')
p('Assistência à descrição de materiais no agendamento','Subtitle')
p('Funcionalidade planejada • 21 de outubro de 2026')
p('A proposta é usar a API da OpenAI para ajudar Joana, a moradora, a descrever os materiais que separou. Na tela Agendar coleta, a IA organiza o texto, sugere categorias e faz uma pergunta curta quando houver ambiguidade. Joana revisa a sugestão antes de utilizá-la. A integração ainda não foi implementada.')
h('Problema e benefício esperado')
p('O briefing descreve Joana usando o celular com pressa e pouca paciência para formulários longos. A assistência pretende facilitar a transformação de uma descrição espontânea em uma lista compreensível. A IA agrega valor ao interpretar expressões variadas e pedir o esclarecimento adequado ao texto recebido.')
p('A dificuldade para descrever materiais é uma hipótese a validar. O benefício esperado é diminuir o esforço de preenchimento sem transformar o agendamento em uma conversa longa. Osmar permanece como coordenador da cooperativa.')
h('Como Joana usaria')
for t in [
'Joana escreve o que separou e solicita ajuda no campo de materiais.',
'A IA organiza os itens e sugere papel, vidro, plástico ou metal quando houver informação suficiente.',
'Se faltar informação, a IA faz uma pergunta curta por vez. Joana pode responder ou manter o item sem categoria definida.',
'A tela apresenta uma lista editável. Joana confere, corrige e seleciona Usar descrição para preencher o formulário.',
'Joana confirma o agendamento pela ação normal da tela. Somente então o serviço grava a coleta.'
]: p(t,'List Number')
h('Exemplo fictício')
p('Joana escreve: “Tenho jornais, garrafas e latas de alumínio”. A IA pergunta: “As garrafas são de vidro ou plástico?”. Após a resposta “De vidro”, a prévia sugere jornais como papel, garrafas de vidro como vidro e latas de alumínio como metal. Todas as sugestões ficam disponíveis para revisão.')
p('Se Joana não souber informar o material, a descrição permanece e a categoria fica indefinida. O exemplo é ilustrativo e não representa um teste executado pela API.')
doc.add_page_break()
h('Integração prevista com o backend')
p('O React envia a descrição a uma rota autenticada no FastAPI. O serviço verifica o perfil morador e chama a API da OpenAI. O backend valida a resposta estruturada e devolve uma pergunta ou a sugestão para a tela. A chave do provedor fica exclusivamente no backend.')
p('O modelo recebe apenas a descrição, os esclarecimentos e as orientações necessárias. Nome, endereço, e-mail e credenciais não precisam ser enviados. Após a confirmação humana, a descrição segue pelo agendamento existente, que já recebe materiais_informados como uma lista de textos.')
h('Complexidade necessária')
p('O recorte proposto usa chamadas ao modelo controladas pelo backend. Uma descrição clara pode ser resolvida em uma chamada; um esclarecimento exige outra após a resposta de Joana. Esse funcionamento não caracteriza um sistema multiagente.')
p('Não há necessidade demonstrada de ferramentas ou de agentes separados. Consultar um catálogo oficial poderia justificar um agente com ferramenta no futuro, mas esse recurso não foi estabelecido no contexto atual. OpenAI foi o provedor escolhido; modelo, custo e desempenho ainda precisam ser definidos e avaliados.')
h('Revisão humana e limites')
p('A IA organiza descrições e sugere categorias. Ela não certifica aceitação pela cooperativa, estima pesos, calcula pontos, registra pesagens ou cria coletas. Uma classificação sugerida não transforma o material informado em material efetivamente pesado.')
p('A regra da cartilha permanece no serviço: a coleta nasce agendada com zero pontos; somente pesagens geram pontuação. Papel e vidro valem 1 ponto por quilo, plástico 2 e metal 4. A primeira pesagem muda a situação para coletada.')
p('Se a sugestão estiver errada, Joana pode editar ou descartar. Se a IA não responder, devolver um resultado inválido ou estiver indisponível, o texto digitado deve ser preservado e o preenchimento manual permite continuar. A resposta estruturada facilita a validação do formato, mas não garante uma classificação correta.')
h('Pendências do planejamento')
for t in [
'? Validar se a assistência reduz o esforço real de Joana.',
'? Confirmar categorias somente na prévia, salvando a descrição revisada na lista atual.',
'? Definir modelo OpenAI, orçamento, tempo de espera e limite de interações.',
'? Definir o nome da rota e os formatos de entrada e saída da assistência.'
]: p(t)
h('Referências do projeto')
p('Plano atual: .docs/ia.md. Contexto de uso: docs/BRIEFING.md, seções Público e Dores e soluções. Regras de negócio: docs/CARTILHA.md, seção A regra que o serviço cuida.')
doc.save(out)
print(out)
print(f'{out.stat().st_size} bytes')
