import { solicitar } from "../api";
import { normalizarCici } from "../regrasCici";
import { hoje } from "./interface";

const semana = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];

function somarDias(dia, quantidade) {
  const data = new Date(`${dia}T12:00:00Z`);
  data.setUTCDate(data.getUTCDate() + quantidade);
  return data.toISOString().slice(0, 10);
}

export function lerPreferencia(texto, referencia = hoje()) {
  const normal = normalizarCici(texto);
  const iso = normal.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0];
  const dataCurta = normal.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?\b/);
  let dia = iso;
  if (!dia && dataCurta) {
    const [, d, m, ano] = dataCurta;
    dia = `${ano || referencia.slice(0, 4)}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  if (!dia && /\b(?:hoje|amanha)\b/.test(normal)) {
    dia = somarDias(referencia, normal.includes("depois de amanha") ? 2 : normal.includes("amanha") ? 1 : 0);
  }
  const indice = semana.findIndex((nome) => new RegExp(`\\b${nome}\\b`).test(normal));
  if (!dia && indice >= 0) {
    const atual = new Date(`${referencia}T12:00:00Z`).getUTCDay();
    dia = somarDias(referencia, (indice + 7 - atual) % 7 || 7);
  }
  if (dia) {
    const data = new Date(`${dia}T12:00:00Z`);
    if (Number.isNaN(+data) || data.toISOString().slice(0, 10) !== dia || dia < referencia || dia > somarDias(referencia, 366)) {
      return { erro: "Informe uma data válida, a partir de hoje e dentro dos próximos 12 meses." };
    }
  }
  const horario = normal.match(/\b([01]?\d|2[0-3])(?:h([0-5]\d)?|:([0-5]\d))\b/);
  const hora = horario && `${horario[1].padStart(2, "0")}:${horario[2] || horario[3] || "00"}`;
  const turno = /\b(?:manha|matutino)\b/.test(normal) ? "manha" : /\b(?:tarde|vespertino)\b/.test(normal) ? "tarde" : null;
  const flexivel = /primeir|proxim|qualquer|tanto faz|sem preferencia/.test(normal);
  return dia || hora || turno || flexivel ? { dia, hora, turno } : null;
}

export async function sugerirVagas(preferencia = {}) {
  const primeiroDia = preferencia.dia || hoje();
  const mesAtual = primeiroDia.slice(0, 7);
  const mesSeguinte = somarDias(`${mesAtual}-28`, 5).slice(0, 7);
  const listar = (mes) => solicitar(`/agenda?mes=${mes}`).then(({ dias }) => dias.flatMap(({ dia, horarios }) =>
    dia >= primeiroDia ? horarios.filter((h) => h.disponiveis > 0).map(({ hora }) => ({ dia, hora })) : []));
  const agenda = await listar(mesAtual);
  const encaixa = (vaga) => (!preferencia.dia || vaga.dia === preferencia.dia) &&
    (!preferencia.hora || vaga.hora === preferencia.hora) &&
    (!preferencia.turno || (vaga.hora < "12:00" ? "manha" : "tarde") === preferencia.turno);
  const filtradas = agenda.filter(encaixa);
  if (filtradas.length && (preferencia.dia || filtradas.length >= 3)) {
    return { vagas: filtradas.slice(0, 3), alternativa: false };
  }
  if (!preferencia.dia || !agenda.length) {
    agenda.push(...await listar(mesSeguinte));
  }
  const vagas = agenda.filter(encaixa);
  return { vagas: (vagas.length ? vagas : agenda).slice(0, 3), alternativa: !vagas.length && Boolean(agenda.length) };
}
