import React, { useEffect, useRef, useState } from "react";
import { ResidentApp } from "../figma/screens/ResidentApp";
import { ResidentFeed } from "../figma/components/ResidentFeed";
import JanelaCici, { BotaoConversa } from "./JanelaCici";
import "../figma/figma.css";
import { criarColeta, enviar } from "../api";
import { lerMudancaDeAssunto } from "./temaCici";
import { consultarMateriais, normalizarCici, responderSobreValores, lerRascunhoCici, limparRascunhoCici } from "../regrasCici";
import AgendamentoCici, { dataDaVaga } from "./AgendamentoCici";
import { lerPreferencia, sugerirVagas } from "./agendaCici";
import Detalhe from "./Detalhe";
import Listagem from "./Listagem";
import Loja from "./Loja";
import { useAvisosComunidade } from "./AvisosComunidade";
import { CentralAvisos, Impacto } from "./Participacao";
import { data, hoje, numero, useDados } from "./interface";

const agendarAoEntrar = () => {
  const consulta = new URLSearchParams(window.location.search);
  return consulta.get("destino") === "agendar" && consulta.get("cici") === "1";
};

const perguntaDeHorario = "Qual dia ou período funciona para você? Pode dizer “amanhã de manhã”, uma data, ou pedir a primeira vaga.";
const opcoesDeHorario = [{ label: "Primeira vaga disponível", prompt: "Primeira vaga disponível" }];
const widgetAgendamento = { type: "agendamento_cici" };
const novaMensagem = (text, extra = {}) => ({ id: crypto.randomUUID(), from: "ai", text, ...extra });
const atalho = {
  "agendar uma coleta": "agendar", "quero agendar uma coleta": "agendar", "agendar coleta": "agendar",
  "mostrar minhas coletas": "minhas", "minhas coletas": "minhas",
  "quantos pontos eu tenho": "pontos", "meus pontos": "pontos", "ver meus pontos": "pontos",
  "quero avaliar minha coleta": "avaliar", "avaliar coleta": "avaliar",
  "mostrar meus beneficios": "carteira", "ver meus beneficios": "carteira", "beneficios": "carteira",
  "quais beneficios posso resgatar": "carteira",
  "mostrar meu impacto": "impacto", "meu impacto": "impacto", "qual e o meu impacto": "impacto",
  "avisos": "avisos", "notificacoes": "avisos",
  "comunidade": "comunidade",
};
const parecePrivado = (texto) => /@|https?:|\b(?:senha|token|password|cpf|cnpj|cep|me chamo|moro (?:na|no|em))\b|\b(?:rua|avenida|travessa|alameda)\s+\w+|\d{5}-\d{3}|(?:\+55|\(\d{2}\))|\b\d{9,}\b/.test(normalizarCici(texto));

// A conversa mantém o rascunho só nesta tela. Endereço e dados da conta não entram no contexto do modelo.
export default function CiciMorador({ perfil, catalogo, mudarTela, abrirPublicacao, mostrarResumo, iniciarAgendamento = false, aoAlterarColetas }) {
  const [aberta, setAberta] = useState(() => iniciarAgendamento || agendarAoEntrar());
  const [painel, setPainel] = useState(null);
  const [pedido, setPedido] = useState(() => {
    if (!iniciarAgendamento && !agendarAoEntrar()) return null;
    const materiais = lerRascunhoCici(catalogo).map((item) => item.nome);
    return { fase: materiais.length ? "preferencia" : "materiais", materiais };
  });
  const [mensagens, setMensagens] = useState(() => [
    pedido ? novaMensagem(pedido.materiais.length
      ? "Já tenho sua lista de materiais. " + perguntaDeHorario
      : "Vamos marcar sua coleta. Quais materiais você separou?",
    pedido.materiais.length ? { actions: opcoesDeHorario } : {}) :
      novaMensagem("Olá! Sou a Cici. Você pode me perguntar como separar seus materiais, acompanhar uma coleta ou marcar uma retirada."),
  ]);
  const [analisando, setAnalisando] = useState(false);
  const contexto = useRef([]);
  const ocupada = useRef(false);
  const novaAgenda = useRef(iniciarAgendamento);
  const [revisao, setRevisao] = useState(0);
  const [erroAviso, setErroAviso] = useState("");
  const { notificar } = useAvisosComunidade();
  const sequencia = useRef(0);
  const acaoRef = useRef(null);
  const coletas = useDados("/coletas", revisao);
  const carteira = useDados("/carteira", revisao);
  const avisos = useDados("/notificacoes", revisao);
  const impacto = useDados(mostrarResumo ? "/comunidade/impacto" : null, revisao);
  const proxima = coletas.dados?.filter((item) => item.situacao === "agendada" && item.dia >= hoje())
    .sort((a, b) => `${a.dia}${a.hora}`.localeCompare(`${b.dia}${b.hora}`))[0];
  const avaliacao = coletas.dados?.find((item) => item.situacao === "aguardando_avaliacao");
  const naoLidos = avisos.dados?.filter((item) => !item.lida) || [];
  const coletaAnterior = coletas.dados?.filter((item) => item.endereco && item.materiais_informados?.length)
    .reduce((ultima, item) => !ultima || item.dia > ultima.dia ? item : ultima, null);

  useEffect(() => {
    if (painel?.versao) acaoRef.current?.focus();
  }, [painel]);

  useEffect(() => {
    const atualizar = () => setRevisao((valor) => valor + 1);
    window.addEventListener("ciclo-certo-avisos-coleta-lidos", atualizar);
    return () => window.removeEventListener("ciclo-certo-avisos-coleta-lidos", atualizar);
  }, []);

  function responder(acao) {
    switch (acao) {
      case "pontos":
        return { texto: carteira.dados ? `Seu saldo é de ${numero(carteira.dados.pontos)} pontos.` : "O saldo ainda não está disponível aqui. Consulte a loja para tentar novamente.", acao: "carteira", rotulo: "Ver loja e extrato" };
      case "carteira":
        return { texto: "Veja os produtos e cupons disponíveis para trocar com seu saldo.", acao, rotulo: "Ver recompensas" };
      case "avaliar":
        return avaliacao
          ? { texto: `A coleta de ${data(avaliacao.dia)} aguarda sua avaliação. Sua nota libera os pontos previstos nessa coleta.`, acao, id: avaliacao.id, rotulo: "Avaliar coleta" }
          : { texto: coletas.dados ? "Você não tem coletas aguardando avaliação." : "Ainda não consegui consultar suas coletas. Você pode tentar pelo histórico.", acao: "minhas", rotulo: "Ver coletas" };
      case "minhas":
        return {
          texto: proxima ? `Sua próxima coleta está marcada para ${data(proxima.dia)}${proxima.hora ? `, às ${proxima.hora.slice(0, 5)}` : ""}.`
            : coletas.dados ? `Você tem ${coletas.dados.length} ${coletas.dados.length === 1 ? "coleta" : "coletas"} no histórico.` : "Consulte o histórico para ver suas coletas.",
          acao, rotulo: "Acompanhar coletas",
        };
      case "impacto":
        return { texto: "Confira os quilos registrados nas suas coletas e os indicadores de participação.", acao, rotulo: "Ver meu impacto" };
      case "avisos":
        return {
          texto: avisos.dados ? (naoLidos[0]?.mensagem || "Você está em dia com os avisos de coleta.") : "Abra a central de avisos para consultar as novidades.",
          acao, rotulo: "Abrir central de avisos",
        };
      case "comunidade":
        return { texto: "Na Comunidade você pode compartilhar ideias, dicas, dúvidas e vídeos com o bairro.", acao, rotulo: "Abrir Comunidade" };
    }
  }

  function abrir(acao, itens = [], id) {
    if (acao === "comunidade") {
      setAberta(false);
      mudarTela("comunidade");
      return;
    }
    setPainel({ acao, itens, id, versao: ++sequencia.current });
  }

  function conteudo() {
    switch (painel.acao) {
      case "avaliar":
        return <Detalhe key={painel.id} id={painel.id} perfil={perfil} catalogo={catalogo}
          sugerirAvaliacao voltar={() => abrir("minhas")} atualizar={() => setRevisao((n) => n + 1)} />;
      case "minhas":
        return <Listagem perfil={perfil} selecionar={(id) => abrir("avaliar", [], id)} revisao={revisao} />;
      case "carteira":
        return <Loja enderecoPreferido={perfil.endereco_coleta} aoTrocar={() => {
          setRevisao((n) => n + 1);
          notificar({ titulo: "Cici · Troca confirmada", texto: "Confira o resgate no histórico da loja." });
        }} />;
      case "impacto":
        return <Impacto />;
      case "avisos":
        return (
          <>
            <section className="ws-card cici-avisos-coleta" aria-label="Avisos de coleta">
              <h2>Avisos de coleta</h2>
              {erroAviso && <p role="alert">{erroAviso}</p>}
              {avisos.erro && <p role="alert">Não consegui carregar os avisos de coleta.</p>}
              {avisos.dados?.length === 0 && <p>Nenhum aviso de coleta.</p>}
              {avisos.dados?.slice(0, 8).map((item) => (
                <article key={item.id}>
                  <p>{item.mensagem}</p>
                  <button type="button" className="ws-btn ws-btn-ghost" onClick={async () => {
                    abrir("avaliar", [], item.coleta_id);
                    if (item.lida) return;
                    setErroAviso("");
                    try {
                      await enviar(`/notificacoes/${item.id}/lida`, {}, "PUT");
                      setRevisao((n) => n + 1);
                    } catch (erro) {
                      setErroAviso(erro.message);
                    }
                  }}>Ver coleta nº {item.coleta_id}</button>
                </article>
              ))}
            </section>
            <CentralAvisos abrir={(id) => { setAberta(false); abrirPublicacao(id); }} />
          </>
        );
    }
  }

  const pickups = (coletas.dados || []).map((item) => ({
    id: String(item.id), dateLabel: data(item.dia), slot: item.hora?.slice(0, 5) || "Sem horário",
    address: item.endereco, items: [], points: item.pontos,
    status: item.situacao === "aguardando_avaliacao" ? "pesada"
      : item.situacao === "coletada" ? "concluida" : item.situacao === "agendada" ? "agendada" : null,
    rated: Boolean(item.nota), stars: item.nota,
  })).filter((item) => item.status);
  const proximaColeta = proxima ? pickups.filter((item) => item.id === String(proxima.id)) : [];

  const feed = (avisos.dados || []).slice(0, 16).map((item) => ({
    id: String(item.id), kind: item.tipo === "avaliacao" ? "pontos" : "coleta",
    title: item.tipo === "avaliacao" ? "Avaliação da coleta" : "Atualização da coleta",
    body: item.mensagem, time: new Date(item.criado_em).toLocaleDateString("pt-BR"),
    ask: item.tipo === "avaliacao" ? "Quero avaliar minha coleta" : "Mostrar minhas coletas",
  }));

  function adicionar(texto, extra) {
    setMensagens((lista) => [...lista.slice(-34), novaMensagem(texto, extra)]);
  }

  function comecarAgendamento(materiais = []) {
    setPainel(null);
    setPedido({ fase: materiais.length ? "preferencia" : "materiais", materiais });
    const reutilizar = coletaAnterior ? [{ label: "Reaproveitar dados da última coleta", prompt: "Reaproveitar dados da última coleta" }] : [];
    adicionar(materiais.length ? perguntaDeHorario : "Quais materiais você quer que a cooperativa recolha?",
      { actions: materiais.length ? opcoesDeHorario : reutilizar });
  }

  useEffect(() => {
    if (iniciarAgendamento && !novaAgenda.current) {
      setAberta(true);
      if (!pedido) comecarAgendamento();
    }
    novaAgenda.current = iniciarAgendamento;
  }, [iniciarAgendamento, pedido]);

  async function comEspera(operacao) {
    if (ocupada.current) return;
    ocupada.current = true;
    setAnalisando(true);
    try {
      await operacao();
    } finally {
      ocupada.current = false;
      setAnalisando(false);
    }
  }

  async function mostrarVagas(rascunho, preferencia) {
    try {
      const { vagas, alternativa } = await sugerirVagas(preferencia);
      if (vagas.length) {
        setPedido({ ...rascunho, fase: "vagas", vagas, preferencia, vaga: null });
        adicionar(alternativa ? "Não encontrei uma vaga no dia ou período que você pediu. Estas são as opções mais próximas."
          : "Encontrei estes horários disponíveis. Qual fica melhor para você?", { widget: widgetAgendamento });
      } else {
        setPedido({ ...rascunho, fase: "preferencia" });
        adicionar("Não encontrei vagas para esse período. Pode me dizer outro dia?", { actions: opcoesDeHorario });
      }
    } catch {
      setPedido({ ...rascunho, fase: "preferencia" });
      adicionar("A agenda não respondeu agora. Seus materiais continuam no rascunho. Pode me dizer o dia de novo?", { actions: opcoesDeHorario });
    }
  }

  function dataEHorario(vaga) {
    setPedido({ ...pedido, endereco: pedido.endereco || perfil.endereco_coleta || "",
      fase: pedido.endereco && pedido.pesoEstimado ? "confirmacao" : "endereco", vaga });
    adicionar(pedido.endereco && pedido.pesoEstimado ? "Atualizei o horário. Confira os dados antes de confirmar."
      : "Informe o endereço e o peso estimado para a retirada.", { widget: widgetAgendamento });
  }

  async function confirmarColeta() {
    if (!pedido || pedido.fase !== "confirmacao" || pedido.verificar) return;
    await comEspera(async () => {
      try {
        await criarColeta({ ...pedido.vaga, endereco: pedido.endereco, materiais_informados: pedido.materiais, peso_estimado_kg: pedido.pesoEstimado });
        limparRascunhoCici();
        if (agendarAoEntrar()) {
          const url = new URL(window.location.href);
          for (const campo of ["destino", "cadastro", "cici"]) url.searchParams.delete(campo);
          window.history.replaceState(null, "", url);
        }
        setPedido(null);
        setRevisao((n) => n + 1);
        aoAlterarColetas?.();
        adicionar("Sua coleta ficou marcada para " + dataDaVaga(pedido.vaga) + ".", {
          actions: [{ label: "Acompanhar coleta", prompt: "Mostrar minhas coletas" }],
        });
        notificar({ titulo: "Cici · Coleta agendada", texto: "Você pode acompanhar o atendimento em Coletas." });
      } catch (erro) {
        if (erro.status === 409) {
          await mostrarVagas(pedido, pedido.preferencia || {});
        } else {
          setPedido({ ...pedido, verificar: !erro.status || erro.status >= 500 });
          adicionar(!erro.status || erro.status >= 500
            ? "A confirmação não chegou. Confira suas coletas antes de marcar de novo."
            : "O pedido não foi aceito. Confira o endereço, o peso estimado e o horário.", {
            widget: widgetAgendamento, actions: [{ label: "Ver minhas coletas", prompt: "Mostrar minhas coletas" }],
          });
        }
      }
    });
  }

  function apresentarAcao(acao, texto) {
    const dados = responder(acao);
    adicionar(dados?.texto || texto, dados?.acao ? { widget: {
      type: "integrado", acao: dados.acao, itens: [], coleta: dados.id, rotulo: dados.rotulo,
    } } : {});
  }

  async function conversar(texto) {
    if (ocupada.current) return;
    const mudanca = lerMudancaDeAssunto(texto);
    if (mudanca?.coletaRegistrada) {
      adicionar("Para consultar uma coleta já marcada, abra Minhas coletas. Encerrar a conversa cancela apenas o rascunho.");
      return;
    }
    if (mudanca) {
      contexto.current = [];
      setPedido(null);
      setPainel(null);
      setMensagens((lista) => [...lista.slice(-33).map((mensagem) => {
        const { actions, widget, ...historico } = mensagem;
        return historico;
      }), novaMensagem("Tudo bem, encerramos esse assunto. Sobre o que você quer falar agora?")]);
      if (!mudanca.proximaPergunta) return;
      texto = mudanca.proximaPergunta;
    }
    const rascunhoAtual = mudanca ? null : pedido;
    const privado = parecePrivado(texto);
    const normal = normalizarCici(texto).replace(/[.!?]+$/g, "").trim();
    const acaoRapida = Object.hasOwn(atalho, normal) ? atalho[normal] : null;
    const resultado = consultarMateriais(texto, catalogo);
    setMensagens((lista) => [...lista.slice(-34), {
      id: crypto.randomUUID(), from: "user", text: privado ? "Mensagem com dados privados omitida." : texto,
    }]);
    await comEspera(async () => {
      if (privado) {
        adicionar("Para proteger seus dados, escreva a pergunta sem informações pessoais. O endereço da retirada tem um campo próprio.",
          rascunhoAtual ? { widget: widgetAgendamento } : {});
        return;
      }
      const numeroColeta = texto.match(/\bcoleta\s*(?:#|n[º°.]\s*)?(\d+)\b/i)?.[1];
      if (/^(?:repetir|reaproveitar|usar dados)/.test(normal) && normal.includes("coleta")) {
        const coleta = numeroColeta ? coletas.dados?.find((item) => String(item.id) === numeroColeta) : coletaAnterior;
        if (!coleta?.endereco || !coleta.materiais_informados?.length) {
          adicionar("Não encontrei uma coleta no seu histórico com os dados necessários.");
          return;
        }
        setPainel(null);
        setPedido({ fase: "preferencia", materiais: coleta.materiais_informados, endereco: coleta.endereco });
        adicionar("Usei os dados da coleta anterior no rascunho. " + perguntaDeHorario, { actions: opcoesDeHorario });
        return;
      }
      if (numeroColeta) {
        const coleta = coletas.dados?.find((item) => String(item.id) === numeroColeta);
        const estados = { agendada: "agendada", em_coleta: "em atendimento", aguardando_avaliacao: "aguardando sua avaliação", coletada: "concluída", cancelada: "cancelada" };
        if (!coleta) adicionar("Não encontrei essa coleta no seu histórico.");
        else adicionar("A coleta nº " + numeroColeta + " está " + (estados[coleta.situacao] || "registrada") + ".", {
          widget: { type: "integrado", acao: "avaliar", itens: [], coleta: coleta.id, rotulo: "Ver detalhes da coleta" },
        });
        return;
      }
      if (acaoRapida) {
        if (acaoRapida === "agendar") {
          if (rascunhoAtual) adicionar("Seu agendamento está em andamento. " + (pedido.fase === "materiais" ? "Quais materiais você separou?" : perguntaDeHorario),
            { widget: widgetAgendamento, actions: pedido.fase === "preferencia" ? opcoesDeHorario : [] });
          else comecarAgendamento();
        } else apresentarAcao(acaoRapida);
        return;
      }

      const valores = responderSobreValores(texto, catalogo, resultado.itens);
      if (valores) {
        adicionar(valores, rascunhoAtual ? { widget: widgetAgendamento } : {});
        return;
      }

      const pergunta = /\?|^(?:como|qual|quais|quando|onde|quem|por que|o que|quanto|posso)\b/.test(normal);
      if (rascunhoAtual && !pergunta && (pedido.fase === "preferencia" || pedido.fase === "vagas")) {
        const preferencia = lerPreferencia(texto);
        if (preferencia && !preferencia.erro) {
          await mostrarVagas(pedido, preferencia);
          return;
        }
        if (preferencia?.erro) {
          adicionar(preferencia.erro, { widget: widgetAgendamento, actions: opcoesDeHorario });
          return;
        }
      }
      if (rascunhoAtual?.fase === "materiais" && !pergunta && (resultado.itens.length || resultado.pergunta)) {
        const itens = resultado.itens.map((item) => item.nome);
        if (resultado.pergunta) {
          setPedido({ ...pedido, materiais: [...new Set([...pedido.materiais, ...itens])] });
          adicionar(resultado.pergunta.texto, { actions: resultado.pergunta.opcoes.map((opcao) => ({ label: opcao, prompt: opcao })) });
          return;
        }
        const materiais = [...new Set([...pedido.materiais, ...itens])];
        const rascunho = { ...pedido, fase: "preferencia", materiais };
        if (pedido.preferencia) {
          await mostrarVagas(rascunho, pedido.preferencia);
          return;
        }
        setPedido(rascunho);
        adicionar("Anotei: " + materiais.join(", ") + ". " + perguntaDeHorario, { actions: opcoesDeHorario });
        return;
      }

      const controle = new AbortController();
      const limite = window.setTimeout(() => controle.abort(), 16_500);
      try {
        const resposta = await enviar("/ia/conversa", { mensagem: texto, contexto: contexto.current }, "POST", { signal: controle.signal });
        contexto.current = [...contexto.current, texto].slice(-3);
        if (resposta.acao === "agendar" && !rascunhoAtual) {
          const preferencia = lerPreferencia(texto);
          const materiais = resultado.itens.map((item) => item.nome);
          if (materiais.length && preferencia && !preferencia.erro) {
            await mostrarVagas({ materiais }, preferencia);
          } else {
            setPainel(null);
            setPedido({ materiais, fase: materiais.length ? "preferencia" : "materiais",
              preferencia: preferencia && !preferencia.erro ? preferencia : null });
            adicionar(materiais.length ? perguntaDeHorario : "Quais materiais você quer que a cooperativa recolha?",
              materiais.length ? { actions: opcoesDeHorario } : {});
          }
        } else if (resposta.acao === "orientar" || resposta.acao === "agendar") {
          adicionar(resposta.resposta, rascunhoAtual ? { widget: widgetAgendamento } : {});
        } else {
          apresentarAcao(resposta.acao, resposta.resposta);
        }
      } catch (erro) {
        if (erro.status === 422) {
          setMensagens((lista) => [...lista.slice(0, -1), { ...lista.at(-1), text: "Mensagem com dados privados omitida." }]);
          adicionar("Envie a pergunta sem dados pessoais. O endereço da retirada tem um campo próprio.", rascunhoAtual ? { widget: widgetAgendamento } : {});
        } else if (/^(?:quero|preciso|gostaria de) (?:agendar|marcar|pedir|solicitar)\b/.test(normal)) {
          comecarAgendamento(resultado.itens.map((item) => item.nome));
        } else {
          const orientacao = [...resultado.itens.map((item) => item.nome + ": " + item.orientacao), ...resultado.avisos].join("\n");
          const extra = rascunhoAtual ? { widget: widgetAgendamento } : {};
          if (orientacao) {
            adicionar(orientacao, extra);
          } else if (erro.status === 429) {
            adicionar("Recebi várias perguntas em pouco tempo. Tente de novo em instantes.", extra);
          } else {
            adicionar("Não consegui consultar essa resposta agora. Você pode tentar a mesma pergunta ou usar os atalhos abaixo.", {
              ...extra, actions: [{ label: "Tentar novamente", prompt: texto }],
            });
          }
        }
      } finally {
        window.clearTimeout(limite);
      }
    });
  }

  const ultimoCartaoId = mensagens.slice().reverse().find((mensagem) => mensagem.widget?.type === widgetAgendamento.type)?.id;

  return (
    <div className="figma-operacao">
      {mostrarResumo && (
        <div className="morador-inicio">
          <section className="morador-bem-vindo">
            <h1>Minha área</h1>
            <p>Acompanhe suas coletas, veja seu impacto e converse com a Cici quando precisar.</p>
            <BotaoConversa onClick={() => { setPainel(null); setAberta(true); }}>Conversar com a Cici</BotaoConversa>
          </section>
          <ResidentFeed feed={feed} pickups={proximaColeta} aiOffline={false}
            impact={impacto.dados?.materiais ? {
              kg: impacto.dados.materiais.reduce((soma, item) => soma + Number(item.quilos || 0), 0),
              count: impacto.dados.coletas,
            } : null}
            impactUnavailable={Boolean(impacto.erro)}
            onAsk={(texto) => { setPainel(null); setAberta(true); conversar(texto); }} />
        </div>
      )}
      <JanelaCici aberta={aberta} definirAbertura={(valor) => {
        if (valor) setPainel(null);
        setAberta(valor);
      }} subtitulo="Assistente de reciclagem" aoAgendar={() => {
        setPainel(null);
        setAberta(true);
        conversar("Quero agendar uma coleta");
      }}>
        <div className="cici-vista" hidden={Boolean(painel)}>
          <ResidentApp messages={mensagens} thinking={analisando} onSend={conversar}
            onStop={pedido ? () => conversar("Cancelar rascunho") : undefined}
        ctx={{
          points: carteira.dados?.pontos || 0, pickups, plain: false, rewards: [],
          render: (widget, msgId) => {
            if (widget.type === "agendamento_cici") {
              if (!pedido || msgId !== ultimoCartaoId) return null;
              return <AgendamentoCici pedido={pedido} ocupado={analisando} escolher={dataEHorario}
                salvarEndereco={(endereco, pesoEstimado) => {
                  setPedido({ ...pedido, endereco, pesoEstimado, fase: "confirmacao" });
                  adicionar("Confira os dados e confirme para registrar sua coleta.", { widget: widgetAgendamento });
                }}
                confirmar={confirmarColeta} trocar={() => {
                  setPedido({ ...pedido, fase: "preferencia", verificar: false });
                  adicionar(perguntaDeHorario, { actions: opcoesDeHorario });
                }}
                editarEndereco={() => {
                  setPedido({ ...pedido, fase: "endereco" });
                  adicionar("Edite o endereço ou o peso estimado abaixo.", { widget: widgetAgendamento });
                }}
                cancelar={() => { setPedido(null); adicionar("Rascunho cancelado."); }} />;
            }
            return widget.type === "integrado" ? (
              <button type="button" className="cici-acao-principal" onClick={() => abrir(widget.acao, widget.itens, widget.coleta)}>
                {widget.rotulo}
              </button>
            ) : undefined;
          },
        }} />
        </div>
        {painel && <section className="cici-vista-detalhe" aria-label="Ação da conversa" tabIndex={-1} ref={acaoRef}>
          <button className="cici-voltar" type="button" onClick={() => setPainel(null)}>← Voltar à conversa</button>
          {conteudo()}
        </section>}
      </JanelaCici>
    </div>
  );
}
