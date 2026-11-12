import { useState } from "react";
import { CoopDispatch, ordenarFila } from "../figma/screens/CoopDispatch";
import "../figma/figma.css";
import { consultarMateriais } from "../regrasCici";

export default function PainelCooperador({ coletas, catalogo, abrir }) {
  const [ignoradas, setIgnoradas] = useState({});
  const [hora, minuto] = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(new Date()).split(":").map(Number);
  const agora = hora + minuto / 60;
  const chaves = { vidro_transparente: "vidro", vidro_colorido: "vidro", papel_misto: "papel", papel_branco: "papel", papelao: "papel", pet: "plastico", plastico_duro: "plastico", plastico_filme: "plastico", aluminio: "metal", ferro: "metal", cobre: "metal", longa_vida: "cartonado" };
  const orders = coletas.filter((c) => c.situacao !== "cancelada").map((c) => {
    const [h, m] = (c.hora || "").split(":").map(Number);
    const start = c.hora && Number.isFinite(h) && Number.isFinite(m) ? h + m / 60 : Infinity;
    const itens = consultarMateriais((c.materiais_informados || []).join(", "), catalogo).itens;
    const expected = itens.filter((item) => chaves[item.codigo]).map((item) => ({ key: chaves[item.codigo], name: item.nome, kg: 0 }));
    const materiais = c.materiais_informados || [];
    const vidro = expected.some((item) => item.key === "vidro");
    const status = c.situacao === "em_coleta" ? "doing" : c.situacao === "agendada" ? "todo" : "done";
    const atrasada = status === "todo" && start < agora;
    return {
      id: String(c.id), resident: c.nome_morador, address: c.endereco, start, end: start + 0.5,
      route: start < 12 ? 1 : 2, status, expected, materiais, pesoEstimado: c.peso_estimado_kg, heavyGlass: vidro, points: c.pontos,
      awaitingReview: c.situacao === "aguardando_avaliacao",
      priority: atrasada ? "urgente" : vidro || status === "doing" ? "alta" : "normal",
      reasons: vidro ? ["Revisar o kit de vidro"] : [],
    };
  });
  function direcionar(id) {
    const candidato = ordenarFila(orders.filter((o) => o.status !== "done"))
      .find((o) => id === "guide" || (id === "cart" ? o.heavyGlass : o.expected.some((i) => i.key === "papel")));
    if (candidato) abrir(Number(candidato.id));
  }
  return <div className="figma-operacao figma-cooperador">
    <CoopDispatch orders={orders}
      recs={{ cart: ignoradas.cart || "pending", rain: ignoradas.rain || "pending", guide: ignoradas.guide || "pending" }}
      onAccept={direcionar} onDismiss={(id) => setIgnoradas((r) => ({ ...r, [id]: "dismissed" }))}
      onUndo={(id) => setIgnoradas((r) => ({ ...r, [id]: "pending" }))} onOpenOrder={(id) => abrir(Number(id))} />
  </div>;
}
