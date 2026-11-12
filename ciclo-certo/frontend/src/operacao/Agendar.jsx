import React, { useState } from "react";
import { enviar, solicitar } from "../api";
import { data, hoje, Cabecalho, Calendario, useDados, Estado } from "./interface";
import PesoEstimado, { lerPesoEstimado } from "./PesoEstimado";
import EnderecoColeta from "./EnderecoColeta";
import AssistenteMateriais from "./AssistenteMateriais";

// Reconsulta a agenda após disputa pela vaga, usando apenas horários confirmados pela API.
async function recuperarHorarios(selecao, hora) {
  const mes = selecao.dia.slice(0, 7);
  const agenda = await solicitar(`/agenda?mes=${mes}`);
  const vagas = (dias) => dias.flatMap((dia) =>
    dia.horarios.filter((horario) => horario.disponiveis > 0 && (dia.dia !== selecao.dia || horario.hora !== hora))
      .map((horario) => ({ dia, hora: horario.hora })),
  );
  const alternativas = vagas(agenda.dias);
  if (alternativas.length < 2) {
    const proximo = new Date(`${mes}-15T12:00:00`);
    proximo.setMonth(proximo.getMonth() + 1);
    const mesSeguinte = `${proximo.getFullYear()}-${String(proximo.getMonth() + 1).padStart(2, "0")}`;
    try { alternativas.push(...vagas((await solicitar(`/agenda?mes=${mesSeguinte}`)).dias)); }
    catch { /* As vagas deste mês já foram confirmadas. */ }
  }
  const referencia = Date.parse(`${selecao.dia}T${hora.slice(0, 5)}:00`);
  const distancia = (vaga) => Math.abs(Date.parse(`${vaga.dia.dia}T${vaga.hora.slice(0, 5)}:00`) - referencia);
  return {
    atual: agenda.dias.find((dia) => dia.dia === selecao.dia) || null,
    alternativas: alternativas.sort((a, b) => distancia(a) - distancia(b)).slice(0, 2),
  };
}

export default function Agendar({ catalogo, concluir, materiaisIniciais = [], comCici = false }) {
  const [selecao, setSelecao] = useState(null);
  const [hora, setHora] = useState("");
  const [endereco, setEndereco] = useState("");
  const [pesoEstimado, setPesoEstimado] = useState("");
  const [texto, setTexto] = useState("");
  const [materiais, setMateriais] = useState(materiaisIniciais);
  const [alternativas, setAlternativas] = useState([]);
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [buscandoHorario, setBuscandoHorario] = useState(false);
  const [revisao, setRevisao] = useState(0);
  const anteriores = useDados("/coletas");
  const [reutilizada, setReutilizada] = useState("");
  const [confirmada, setConfirmada] = useState(false);
  const normalizar = (v) =>
    v
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const sugestoes = catalogo.itens
    .filter((i) =>
      normalizar(`${i.nome} ${i.referencia}`).includes(normalizar(texto)),
    )
    .slice(0, 6);
  const cuidados = catalogo.itens.filter(
    (i) =>
      i.cuidado &&
      (materiais.includes(i.nome) ||
        (texto.length > 2 &&
          normalizar(`${i.nome} ${i.referencia}`).includes(normalizar(texto)))),
  );
  const eletronicoLivre = /eletr[oô]n|bateria|pilha|celular/i.test(
    [texto, ...materiais].join(" "),
  );
  const vidroLivre = /vidro|caco/i.test([texto, ...materiais].join(" "));
  function incluir(valor) {
    if (valor.trim()) setMateriais((m) => [...new Set([...m, valor.trim()])]);
    setTexto("");
  }
  async function sugerirHorario() {
    setBuscandoHorario(true);
    setErro("");
    try {
      const primeiroDia = hoje();
      const resposta = await recuperarHorarios({ dia: primeiroDia }, "00:00");
      const vaga = resposta.alternativas[0];
      if (!vaga) {
        setErro("A Cici não encontrou uma vaga próxima. Consulte outros dias no calendário.");
        return;
      }
      setSelecao(vaga.dia);
      setHora(vaga.hora);
      setAlternativas([]);
    } catch {
      setErro("A Cici não conseguiu consultar horários. Você pode escolher pelo calendário.");
    } finally {
      setBuscandoHorario(false);
    }
  }
  async function salvar(e) {
    e.preventDefault();
    if (ocupado || buscandoHorario) return;
    setErro("");
    setAlternativas([]);
    const lista = [
      ...new Set([...materiais, ...(texto.trim() ? [texto.trim()] : [])]),
    ];
    if (!selecao || !hora || !lista.length || (reutilizada && !confirmada)) {
      setErro("Escolha dia, horário e ao menos um material.");
      return;
    }
    const peso = lerPesoEstimado(pesoEstimado);
    if (!peso) { setErro("Informe o peso estimado em kg."); return; }
    setOcupado(true);
    try {
      await enviar("/coletas", {
        endereco,
        dia: selecao.dia,
        hora,
        materiais_informados: lista,
        peso_estimado_kg: peso,
      });
      concluir();
    } catch (e) {
      setErro(e.message);
      setRevisao((n) => n + 1);
      setHora("");
      if (e.status === 409) {
        try {
          const resposta = await recuperarHorarios(selecao, hora);
          setSelecao(resposta.atual);
          setAlternativas(resposta.alternativas);
        } catch {
          setSelecao(null);
        }
      }
    } finally {
      setOcupado(false);
    }
  }
  return (
    <>
      <Cabecalho
        titulo="Agendar coleta"
        texto="Escolha uma vaga e conte o que você separou."
      />
      <details className="ws-card com-reagendar">
        <summary>Agendar novamente usando uma coleta anterior</summary>
        <Estado recurso={anteriores} />
        <label className="ws-field">
          Reaproveitar endereço e materiais
          <select
            value={reutilizada}
            onChange={(e) => {
              const id = e.target.value;
              setReutilizada(id);
              setConfirmada(false);
              setSelecao(null);
              setHora("");
              const c = anteriores.dados?.find((c) => c.id === Number(id));
              setEndereco(c?.endereco || "");
              setMateriais(c?.materiais_informados || []);
              setPesoEstimado("");
              setTexto("");
            }}
          >
            <option value="">Começar com campos vazios</option>
            {anteriores.dados?.map((c) => (
              <option key={c.id} value={c.id}>
                {data(c.dia)} · {c.endereco}
              </option>
            ))}
          </select>
        </label>
        <p className="ws-help">
          Escolha um novo dia e horário. Nenhuma coleta será criada antes da
          confirmação.
        </p>
      </details>
      <div className="cc-duas-colunas">
        <Calendario
          dia={selecao?.dia}
          escolher={(d) => {
            setSelecao(d);
            setHora("");
          }}
          revisao={revisao}
        />
        <form className="ws-card cc-form" onSubmit={salvar}>
          <h2>Sua próxima coleta</h2>
          {materiaisIniciais.length > 0 && <p className="cc-cuidado">Sugestão da Cici. Confira ou edite os materiais antes de confirmar.</p>}
          <p>
            {selecao ? data(selecao.dia) : "Selecione um dia no calendário"}
          </p>
          {comCici && !selecao && (
            <button className="ws-btn ws-btn-ghost" type="button" disabled={buscandoHorario || ocupado} onClick={sugerirHorario}>
              {buscandoHorario ? "Consultando a agenda…" : "Sugerir horário com a Cici"}
            </button>
          )}
          <fieldset>
            <legend>Horários disponíveis</legend>
            <div className="cc-horarios">
              {selecao?.horarios.map((h) => (
                <button
                  type="button"
                  className={`ws-btn ${hora === h.hora ? "" : "ws-btn-ghost"}`}
                  disabled={!h.disponiveis}
                  key={h.hora}
                  aria-pressed={hora === h.hora}
                  onClick={() => setHora(h.hora)}
                >
                  {h.hora}
                  <small>
                    {h.disponiveis ? `${h.disponiveis} vagas` : "Indisponível"}
                  </small>
                </button>
              ))}
            </div>
          </fieldset>
          <EnderecoColeta endereco={endereco} mudar={setEndereco} />
          <PesoEstimado key={reutilizada} valor={pesoEstimado} mudar={setPesoEstimado} />
          <label className="ws-field">
            O que você separou?
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              maxLength={160}
              placeholder="Ex.: latinhas, papel, garrafas…"
            />
          </label>
          <div className="cc-sugestoes">
            {sugestoes.map((i) => (
              <button
                type="button"
                className="cc-chip"
                key={i.codigo}
                onClick={() => incluir(i.nome)}
              >
                + {i.nome}
              </button>
            ))}
            {texto.trim() && (
              <button
                type="button"
                className="cc-chip"
                onClick={() => incluir(texto)}
              >
                Adicionar “{texto}”
              </button>
            )}
          </div>
          <ul className="cc-selecionados">
            {materiais.map((m) => (
              <li key={m}>
                {m}
                <button
                  type="button"
                  aria-label={`Remover ${m}`}
                  onClick={() =>
                    setMateriais((lista) => lista.filter((v) => v !== m))
                  }
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <AssistenteMateriais
            descricao={[...materiais, texto].filter((valor) => valor.trim()).join("; ")}
            aplicar={(lista) => { setMateriais(lista); setTexto(""); }}
          />
          {cuidados.map((i) => (
            <p className="cc-cuidado" role="status" key={i.codigo}>
              <strong>{i.nome}: </strong>
              {i.cuidado}
            </p>
          ))}
          {vidroLivre &&
            !cuidados.some((i) => i.codigo.startsWith("vidro")) && (
              <p className="cc-cuidado">
                Vidro: proteja cacos em embalagem rígida identificada e avise a
                equipe.
              </p>
            )}
          {eletronicoLivre && (
            <p className="cc-cuidado">
              Eletrônicos e baterias: não desmonte nem perfure. Mantenha
              separados e combine a destinação com a cooperativa. Não há
              recompensa tabelada para eletrônicos.
            </p>
          )}
          <p className="ws-help">
            Você ganha pontos somente após a pesagem confirmada e sua avaliação.
          </p>
          {reutilizada && (
            <label className="com-consentimento">
              <input
                type="checkbox"
                required
                checked={confirmada}
                onChange={(e) => setConfirmada(e.target.checked)}
              />{" "}
              Conferi o endereço e os materiais para esta nova coleta.
            </label>
          )}
          {erro && (
            <p role="alert" className="aviso erro">
              {erro}
            </p>
          )}
          {alternativas.length > 0 && (
            <fieldset>
              <legend>Horários disponíveis mais próximos</legend>
              <div className="cc-horarios">
                {alternativas.map((vaga) => (
                  <button type="button" className="ws-btn ws-btn-ghost" key={`${vaga.dia.dia}-${vaga.hora}`}
                    onClick={() => { setSelecao(vaga.dia); setHora(vaga.hora); setErro(""); setAlternativas([]); }}>
                    {data(vaga.dia.dia)} · {vaga.hora}
                  </button>
                ))}
              </div>
            </fieldset>
          )}
          <button className="ws-btn" disabled={ocupado || buscandoHorario}>
            {ocupado ? "Agendando…" : "Confirmar agendamento"}
          </button>
        </form>
      </div>
    </>
  );
}
