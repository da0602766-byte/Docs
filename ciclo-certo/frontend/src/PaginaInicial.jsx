import React from "react";

// A página pública apresenta o serviço e encaminha todas as ações para o login.
const HERO_PHOTO = "/imagens/reciclaveis.jpg";
const COOP_PHOTO = "/imagens/cooperativa.jpg";

const RATES = [
  { material: "Papel", points: 1, note: "Jornal, caixas, papelão e folhas limpas" },
  { material: "Vidro", points: 1, note: "Garrafas e potes vazios" },
  { material: "Plástico", points: 2, note: "Embalagens, frascos e garrafas PET" },
  { material: "Metal", points: 4, note: "Latas de alumínio e de aço" },
];

const FAQ = [
  { q: "Quais materiais a cooperativa recolhe?", a: "Papel, vidro, plástico e metal. Ao agendar, você informa os materiais que separou, e a equipe já sai do galpão sabendo o que vai buscar." },
  { q: "Como os pontos são calculados?", a: "Cada material tem um valor por quilo: papel e vidro valem 1 ponto, plástico vale 2 e metal vale 4. Os pontos são somados à coleta a cada pesagem registrada na balança." },
  { q: "Quando vejo os pontos de uma coleta?", a: "Assim que a cooperativa registra a primeira pesagem. Nesse momento, a coleta deixa de aparecer como agendada e passa a constar como coletada, com o detalhe de cada material." },
  { q: "Já posso trocar meus pontos por desconto?", a: "Ainda não. O Ciclo Certo registra e mostra os pontos de cada entrega. A troca por descontos não está disponível no sistema." },
  { q: "Meus dados ficam salvos?", a: "Sim. Suas coletas e pesagens ficam salvas no sistema. Entre com e-mail e senha para consultar os dados da sua conta, inclusive depois de fechar o navegador." },
];

function Icon({ name, size = 20 }) {
  const paths = {
    leaf: <><path d="M19.5 4.5C13 4.6 6.8 6.2 5.2 11.4c-1 3.2 1.2 6.2 4.4 6.1 5.8-.2 8-6.7 9.9-13Z" /><path d="M4.2 20c2.4-5 6-8.2 11.1-10.2" /></>,
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
    phone: <><rect x="6" y="2.5" width="12" height="19" rx="2.5" /><path d="M10.5 18.5h3" /></>,
    sheet: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M4 9h16M4 15h16M10 3v18" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    list: <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />,
    scale: <path d="M12 4v17M6 21h12M5 7h14M5 7l-3 6h6L5 7ZM19 7l-3 6h6l-3-6Z" />,
    truck: <><path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z" /><circle cx="7" cy="19" r="2" /><circle cx="18" cy="19" r="2" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    x: <path d="M6 6l12 12M18 6 6 18" />,
    plus: <path d="M12 5v14M5 12h14" />,
  };
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

function Logo() {
  return (
    <a href="#inicio" className="lp-logo" aria-label="Ciclo Certo, voltar ao início">
      <span className="lp-logo-mark"><Icon name="leaf" size={18} /></span>
      Ciclo Certo
    </a>
  );
}

export default function PaginaInicial() {
  return (
    <div className="lp">
      <div className="lp-topline">
        <div className="lp-wrap">
          <span>Aplicativo de coletas da Cooperativa Ciclo Certo</span>
          <div className="lp-topline-right">
            <span className="lp-topline-meta">Coleta, pesagem e pontos</span>
          </div>
        </div>
      </div>

      <header className="lp-wrap lp-nav">
        <Logo />
        <nav aria-label="Navegação principal" className="lp-nav-links">
          <a href="#moradores">Para moradores</a>
          <a href="#cooperativa">Para a cooperativa</a>
          <a href="#pontos">Tabela de pontos</a>
          <a href="#perguntas">Perguntas</a>
        </nav>
        <div className="lp-nav-actions">
          <a className="lp-link-btn" href="/cooperador">Área da cooperativa</a>
          <a className="lp-btn lp-btn-sm" href="/login">Agendar coleta</a>
        </div>
      </header>

      <main>
        <section id="inicio" className="lp-wrap lp-hero">
          <div className="lp-hero-copy">
            <p className="lp-kicker">Coleta seletiva porta a porta</p>
            <h1>Separou em casa? A cooperativa busca na sua porta.</h1>
            <p className="lp-lead">
              Agende a coleta de papel, vidro, plástico e metal pelo celular. Depois da pesagem no galpão,
              você vê quantos quilos entregou e quantos pontos cada material rendeu.
            </p>
            <div className="lp-actions">
              <a className="lp-btn" href="/login">Agendar minha coleta <Icon name="arrow" size={18} /></a>
              <a className="lp-btn lp-btn-ghost" href="/cooperador">Sou da cooperativa</a>
            </div>
            <dl className="lp-facts">
              <div><dt>3 passos</dt><dd>endereço, dia e materiais</dd></div>
              <div><dt>4 materiais</dt><dd>com pontos por quilo</dd></div>
              <div><dt>Cada pesagem</dt><dd>registrada no seu histórico</dd></div>
            </dl>
          </div>

          <figure className="lp-hero-media">
            <img src={HERO_PHOTO} alt="Garrafas plásticas e latas de alumínio reunidas para reciclagem" />
            <div className="lp-receipt" aria-label="Exemplo de detalhe de coleta no aplicativo">
              <div className="lp-receipt-head">
                <div>
                  <span>Coleta nº 1071</span>
                  <strong>Quarta, 11 de junho</strong>
                </div>
                <span className="lp-tag lp-tag-done">Coletada</span>
              </div>
              <table>
                <thead><tr><th>Material</th><th>Peso</th><th>Pontos</th></tr></thead>
                <tbody>
                  <tr><td>Vidro</td><td>6 kg</td><td>6</td></tr>
                  <tr><td>Metal</td><td>5 kg</td><td>20</td></tr>
                  <tr><td>Plástico</td><td>6 kg</td><td>12</td></tr>
                </tbody>
                <tfoot><tr><td>Total</td><td>17 kg</td><td>38 pts</td></tr></tfoot>
              </table>
            </div>
            <figcaption>Tela do aplicativo com dados de exemplo.</figcaption>
          </figure>
        </section>

        <section className="lp-problem" aria-labelledby="problema">
          <div className="lp-wrap lp-problem-grid">
            <h2 id="problema">Hoje, a coleta é marcada por telefone e os pontos ficam numa planilha que o morador nunca vê.</h2>
            <div className="lp-compare">
              <div>
                <h3>Como funciona hoje</h3>
                <ul>
                  <li><Icon name="phone" size={18} /> Ligação para combinar dia e horário</li>
                  <li><Icon name="sheet" size={18} /> Pesos anotados à mão e passados para a planilha</li>
                  <li><Icon name="x" size={18} /> Morador sem acesso ao que foi pesado</li>
                </ul>
              </div>
              <div>
                <h3>Com o Ciclo Certo</h3>
                <ul>
                  <li><Icon name="calendar" size={18} /> Agendamento pelo celular, a qualquer hora</li>
                  <li><Icon name="scale" size={18} /> Pesagem registrada assim que o material chega</li>
                  <li><Icon name="check" size={18} /> Pontos e quilos visíveis para os dois lados</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section id="moradores" className="lp-wrap lp-section lp-split">
          <div>
            <p className="lp-kicker">Para moradores</p>
            <h2>Marque a coleta no intervalo entre uma tarefa e outra.</h2>
            <p className="lp-body">O agendamento foi pensado para o celular com três informações para preencher. Você acompanha cada coleta até a pesagem, sem precisar ligar para perguntar.</p>
            <ol className="lp-steps">
              <li><span>1</span><div><strong>Agende</strong><p>Informe o endereço, escolha o dia e informe os materiais que separou.</p></div></li>
              <li><span>2</span><div><strong>Acompanhe</strong><p>Veja a situação de cada coleta: agendada enquanto aguarda, coletada depois da pesagem.</p></div></li>
              <li><span>3</span><div><strong>Confira</strong><p>Abra qualquer coleta para ver o peso de cada material e os pontos que ele rendeu.</p></div></li>
            </ol>
            <a className="lp-btn" href="/login">Entrar na minha conta <Icon name="arrow" size={18} /></a>
          </div>

          <div className="lp-phone" aria-label="Exemplo da tela Minhas coletas">
            <div className="lp-phone-head">
              <span>Minhas coletas <small className="exemplo">Exemplo ilustrativo</small></span>
              <span className="lp-phone-balance"><small>Saldo</small>38 pts</span>
            </div>
            <div className="lp-phone-next">
              <small>Próxima coleta</small>
              <strong>Quarta, 18 de junho</strong>
              <span>Rua das Acácias, 82</span>
              <div className="lp-chips"><i>Papel</i><i>Plástico</i></div>
            </div>
            <ul className="lp-phone-list">
              <li><div><strong>18 jun</strong><span>Papel, Plástico</span></div><span className="lp-tag">Agendada</span></li>
              <li><div><strong>11 jun</strong><span>Vidro, Metal, Plástico · 17 kg</span></div><span className="lp-points">+38 pts</span></li>
            </ul>
          </div>
        </section>

        <section id="cooperativa" className="lp-coop">
          <div className="lp-wrap">
            <div className="lp-coop-intro">
              <div>
                <p className="lp-kicker">Para a cooperativa</p>
                <h2>A rota do caminhão e a balança do galpão na mesma tela.</h2>
              </div>
              <div>
                <p className="lp-body">O coordenador vê todas as coletas do dia de uma vez, monta a rota e registra cada pesagem logo que o material desce do caminhão. A conta dos pontos é feita pelo sistema, com a mesma regra para todo mundo.</p>
                <a className="lp-btn lp-btn-light" href="/cooperador">Abrir área da cooperativa <Icon name="arrow" size={18} /></a>
              </div>
            </div>

            <div className="lp-coop-grid">
              <img loading="lazy" className="lp-coop-photo" src={COOP_PHOTO} alt="Trabalhador alimentando uma esteira de triagem com material reciclável" />

              <div className="lp-desk" aria-label="Exemplo da tela de rota da cooperativa">
                <div className="lp-desk-bar">
                  <strong>Rota do dia <small className="exemplo">Exemplo ilustrativo</small></strong>
                  <span className="lp-desk-filter"><Icon name="calendar" size={15} /> 18 jun 2025</span>
                </div>
                <table className="lp-desk-table">
                  <thead><tr><th>Nº</th><th>Morador</th><th className="lp-hide-sm">Endereço</th><th>Situação</th><th aria-label="Ação" /></tr></thead>
                  <tbody>
                    <tr><td>1084</td><td>Joana Martins</td><td className="lp-hide-sm">Rua das Acácias, 82</td><td><span className="lp-tag">Agendada</span></td><td><span className="lp-desk-action">Pesar</span></td></tr>
                    <tr><td>1085</td><td>Carlos Vieira</td><td className="lp-hide-sm">Av. Independência, 340</td><td><span className="lp-tag">Agendada</span></td><td><span className="lp-desk-action">Pesar</span></td></tr>
                  </tbody>
                </table>
                <div className="lp-desk-scale">
                  <Icon name="scale" size={18} />
                  <span>Coleta 1085 · Metal · 5 kg × 4 pts/kg</span>
                  <strong>= 20 pts</strong>
                </div>
              </div>

              <ul className="lp-coop-points">
                <li><Icon name="truck" size={20} /><strong>Rota filtrada por dia</strong><p>Endereços, materiais esperados e situação de cada parada.</p></li>
                <li><Icon name="scale" size={20} /><strong>Pesagem por material</strong><p>Tipo e quilos, registrados direto na coleta correspondente.</p></li>
                <li><Icon name="list" size={20} /><strong>Total sempre conferido</strong><p>Os pontos são somados a cada pesagem, sem refazer a conta.</p></li>
              </ul>
            </div>
          </div>
        </section>

        <section id="pontos" className="lp-wrap lp-section lp-rates">
          <div className="lp-rates-intro">
            <p className="lp-kicker">Tabela de pontos</p>
            <h2>Quanto vale cada quilo.</h2>
            <p className="lp-body">A regra é a mesma para todos os moradores e é aplicada automaticamente em cada pesagem.</p>
            <div className="lp-example">
              <span>Exemplo</span>
              <p>6 kg de plástico × 2 pts = <strong>12 pontos</strong></p>
            </div>
          </div>
          <div className="lp-rate-table" role="table" aria-label="Pontos por quilo de cada material">
            {RATES.map(rate => (
              <div className="lp-rate-row" role="row" key={rate.material}>
                <div role="cell"><strong>{rate.material}</strong><span>{rate.note}</span></div>
                <div role="cell" className="lp-rate-value">{rate.points}<small> {rate.points === 1 ? "ponto" : "pontos"} por kg</small></div>
              </div>
            ))}
            <p className="lp-rate-foot">Toda coleta começa agendada, com zero pontos. A primeira pesagem muda a situação para coletada.</p>
          </div>
        </section>

        <section className="lp-people" aria-labelledby="perfis">
          <div className="lp-wrap">
            <div className="lp-people-head">
              <h2 id="perfis">Desenhado a partir de duas rotinas.</h2>
              <p>Perfis de referência usados no projeto. Não são depoimentos de clientes.</p>
            </div>
            <div className="lp-people-grid">
              <article>
                <header><span className="lp-avatar">J</span><div><strong>Joana, 45 anos</strong><span>Professora · usa no celular</span></div></header>
                <p>Separa o lixo de casa há anos. Quer marcar a coleta entre uma aula e outra e saber quantos pontos cada entrega rendeu.</p>
              </article>
              <article>
                <header><span className="lp-avatar lp-avatar-dark">O</span><div><strong>Osmar</strong><span>Coordenador da cooperativa · usa no computador</span></div></header>
                <p>Monta a rota do caminhão e confere a balança no galpão. Precisa ver as coletas do dia de uma vez e registrar cada pesagem na hora.</p>
              </article>
            </div>
          </div>
        </section>

        <section id="perguntas" className="lp-wrap lp-section lp-faq">
          <h2>Perguntas frequentes</h2>
          <div>
            {FAQ.map(item => (
              <details key={item.q}>
                <summary>{item.q}<Icon name="plus" size={18} /></summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="lp-wrap lp-cta">
          <div>
            <h2>Tem material separado em casa?</h2>
            <p>Agende a coleta e acompanhe a pesagem pelo celular.</p>
          </div>
          <div className="lp-actions">
            <a className="lp-btn lp-btn-light" href="/login">Agendar coleta <Icon name="arrow" size={18} /></a>
            <a className="lp-btn lp-btn-outline-light" href="/cooperador">Área da cooperativa</a>
          </div>
        </section>
      </main>

      <footer className="lp-wrap lp-footer">
        <div className="lp-footer-brand">
          <Logo />
          <p>Agendamento de coletas e registro de pesagens para a Cooperativa Ciclo Certo.</p>
        </div>
        <nav aria-label="Rodapé" className="lp-footer-links">
          <a href="#moradores">Para moradores</a>
          <a href="#cooperativa">Para a cooperativa</a>
          <a href="#pontos">Tabela de pontos</a>
          <a href="#perguntas">Perguntas</a>
        </nav>
        <p className="lp-footer-note">© {new Date().getFullYear()} Ciclo Certo · Cooperativa de recicláveis.</p>
      </footer>
    </div>
  );
}
