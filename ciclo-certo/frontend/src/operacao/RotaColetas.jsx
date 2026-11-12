import { useState } from "react";
import { enviar } from "../api";
import { Estado, hoje, useDados } from "./interface";

const quilometros = (metros) => (metros / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
const minutos = (segundos) => Math.ceil(segundos / 60);

export default function RotaColetas({ coletas, abrir }) {
  const disponibilidade = useDados("/rota-coletas");
  const [origem, setOrigem] = useState("");
  const [dia, setDia] = useState(hoje);
  const [hora, setHora] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const [resultado, setResultado] = useState(null);
  const abertas = coletas.filter((coleta) => coleta.dia === dia && ["agendada", "em_coleta"].includes(coleta.situacao));
  const horarios = [...new Set(abertas.map((coleta) => coleta.hora).filter(Boolean))].sort();
  const horario = horarios.includes(hora) ? hora : "";
  const chave = JSON.stringify([dia, horario, origem.trim(), abertas.map(({ id, hora: agendada, endereco }) => [id, agendada, endereco])]);
  const rota = resultado?.chave === chave ? resultado.rota : null;

  async function calcular(evento) {
    evento.preventDefault();
    if (ocupado || origem.trim().length < 10) return;
    setOcupado(true);
    setErro("");
    setResultado(null);
    try {
      const rota = await enviar("/rota-coletas", { origem: origem.trim(), dia, hora: horario || null });
      setResultado({ chave, rota });
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setOcupado(false);
    }
  }

  return <details className="cooperador-bloco cc-rota">
    <summary>Calcular rota de coletas</summary>
    {disponibilidade.dados?.disponivel ? (
      <>
        <form className="cc-rota-form" onSubmit={calcular}>
          <label className="ws-field">Ponto de saída
            <input required minLength={10} maxLength={160} value={origem} disabled={ocupado}
              onChange={(e) => setOrigem(e.target.value)} placeholder="Rua, número, cidade e estado" />
          </label>
          <div className="ws-field-row">
            <label className="ws-field">Data da rota
              <input type="date" required value={dia} disabled={ocupado} onChange={(e) => { setDia(e.target.value); setHora(""); }} />
            </label>
            <label className="ws-field">Horário das coletas
              <select value={horario} disabled={ocupado} onChange={(e) => setHora(e.target.value)}>
                <option value="">Todos os horários</option>
                {horarios.map((opcao) => <option key={opcao}>{opcao}</option>)}
              </select>
            </label>
          </div>
          <p className="ws-help">A sugestão respeita os horários agendados. O OpenRouteService consulta os endereços para estimar o deslocamento.</p>
          {abertas.length === 0 && <p className="ws-help">Não há coletas em aberto nesta data.</p>}
          <button type="submit" className="ws-btn" disabled={ocupado || !abertas.length}>{ocupado ? "Calculando…" : "Calcular rota"}</button>
        </form>
        {erro && <p className="aviso erro" role="alert">{erro}</p>}
        {rota && <div className="cc-rota-resultado" aria-live="polite">
          {rota.paradas.length > 0 ? <>
            <h2>Rota sugerida</h2>
            <p>{quilometros(rota.metros)} km · {minutos(rota.segundos)} min de deslocamento estimado</p>
            <ol>
              {rota.paradas.map((parada) => <li key={parada.id}>
                <button type="button" onClick={() => abrir(parada.id)}>#{parada.id} · {parada.endereco}</button>
                <small>{parada.hora || "Sem horário"} · {quilometros(parada.metros)} km · {minutos(parada.segundos)} min do ponto anterior</small>
              </li>)}
            </ol>
          </> : <p>Nenhum trajeto disponível para estas coletas.</p>}
          {rota.pendentes.length > 0 && <>
            <h2>Paradas para conferir</h2>
            <ul>{rota.pendentes.map((parada) => <li key={parada.id}>
              <button type="button" onClick={() => abrir(parada.id)}>#{parada.id} · {parada.endereco}</button>
              <small>{parada.motivo}</small>
            </li>)}</ul>
          </>}
          <small><a href="https://openrouteservice.org/" target="_blank" rel="noreferrer">© openrouteservice.org by HeiGIT</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a></small>
        </div>}
      </>
    ) : disponibilidade.dados?.disponivel === false ? (
      <p className="ws-help">O serviço de rotas está indisponível no momento.</p>
    ) : <Estado recurso={disponibilidade} />}
  </details>;
}
