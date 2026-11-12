import { useState } from "react";
import { CalendarDays, Check, LockKeyhole, MapPin, Package, Scale } from "lucide-react";
import PesoEstimado, { lerPesoEstimado } from "./PesoEstimado";
import EnderecoColeta from "./EnderecoColeta";

export const dataDaVaga = ({ dia, hora }) =>
  `${new Date(`${dia}T12:00:00-03:00`).toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long", timeZone: "America/Sao_Paulo",
  })} às ${hora}`;

export default function AgendamentoCici({ pedido, ocupado, escolher, salvarEndereco, confirmar, trocar, editarEndereco, cancelar }) {
  const [pesoEstimado, setPesoEstimado] = useState(pedido.pesoEstimado?.replace(".", ",") || "");
  const [endereco, setEndereco] = useState(pedido.endereco || "");
  if (pedido.fase === "materiais" || pedido.fase === "preferencia") return null;

  return (
    <div className="cici-etapa">
      {pedido.fase === "vagas" && (
        <ul className="cici-vagas" aria-label="Horários disponíveis para coleta">
          {pedido.vagas.map((vaga) => (
            <li key={`${vaga.dia}-${vaga.hora}`}>
              <button type="button" disabled={ocupado} onClick={() => escolher(vaga)}>
                <CalendarDays size={17} aria-hidden="true" /> {dataDaVaga(vaga)}
              </button>
            </li>
          ))}
        </ul>
      )}
      {pedido.fase === "endereco" && (
        <form className="cici-endereco" onSubmit={(evento) => {
          evento.preventDefault();
          const peso = lerPesoEstimado(pesoEstimado);
          if (!ocupado && peso && endereco.trim().length >= 10) salvarEndereco(endereco.trim(), peso);
        }}>
          <EnderecoColeta endereco={endereco} mudar={setEndereco} rotulo="Endereço completo para a coleta" />
          <PesoEstimado className="" valor={pesoEstimado} mudar={setPesoEstimado} />
          <p><LockKeyhole size={14} aria-hidden="true" /> O endereço não entra na conversa com a IA.</p>
          <button type="submit" className="cici-acao-principal" disabled={ocupado || endereco.trim().length < 10 || !lerPesoEstimado(pesoEstimado)}>Revisar pedido</button>
        </form>
      )}
      {pedido.fase === "confirmacao" && (
        <>
          <ul className="cici-resumo-coleta" aria-label="Revise os dados da coleta">
            <li><CalendarDays size={16} aria-hidden="true" /> {dataDaVaga(pedido.vaga)}</li>
            <li><MapPin size={16} aria-hidden="true" /> {pedido.endereco}</li>
            <li><Package size={16} aria-hidden="true" /> {pedido.materiais.join(", ")}</li>
            <li><Scale size={16} aria-hidden="true" /> Peso estimado: {Number(pedido.pesoEstimado).toLocaleString("pt-BR")} kg</li>
          </ul>
          <button type="button" className="cici-acao-principal" disabled={ocupado || pedido.verificar} onClick={confirmar}>
            <Check size={17} aria-hidden="true" /> Confirmar coleta
          </button>
        </>
      )}
      <div className="cici-etapa-acoes">
        <button type="button" disabled={ocupado || pedido.verificar} onClick={trocar}>Escolher outro horário</button>
        {pedido.fase === "confirmacao" && <button type="button" disabled={ocupado || pedido.verificar}
          onClick={editarEndereco}>Editar endereço e peso</button>}
        <button type="button" disabled={ocupado} onClick={cancelar}>Cancelar rascunho</button>
      </div>
    </div>
  );
}
