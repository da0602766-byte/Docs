import React, { useRef, useState } from "react";
import { enviar } from "../api";
import {
  moeda,
  numero,
  useDados,
  Estado,
  Cabecalho,
  Tabela,
} from "./interface";

export default function Carteira({ catalogo }) {
  const [revisao, setRevisao] = useState(0);
  const recurso = useDados("/carteira", revisao);
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [pontos, setPontos] = useState("");
  const [destino, setDestino] = useState("dinheiro");
  const chave = useRef(crypto.randomUUID());
  async function executar(caminho, dados, metodo) {
    setOcupado(true);
    setErro("");
    try {
      await enviar(caminho, dados, metodo);
      setRevisao((n) => n + 1);
      chave.current = crypto.randomUUID();
      setPontos("");
    } catch (e) {
      setErro(e.message);
    } finally {
      setOcupado(false);
    }
  }
  return (
    <>
      <Cabecalho
        titulo="Minha carteira"
        texto="Dinheiro fictício e pontos. Sem pagamentos, saques ou parceiros reais."
      />
      <Estado recurso={recurso} />
      {recurso.dados && (
        <>
          <div className="cc-saldos">
            <section className="ws-card cc-form">
              <p>Saldo fictício</p>
              <strong>{moeda(recurso.dados.centavos)}</strong>
              <small>Resgate automático após avaliar, no modo dinheiro.</small>
            </section>
            <section className="ws-card cc-form">
              <p>Pontos disponíveis</p>
              <strong>{numero(recurso.dados.pontos)} pts</strong>
              <small>100 pontos = R$ 1 fictício.</small>
            </section>
          </div>
          <section className="ws-card cc-form">
            <h2>Como prefere receber as próximas coletas?</h2>
            <label className="ws-field">
              Destino da recompensa
              <select
                value={recurso.dados.recompensa}
                disabled={ocupado}
                onChange={(e) =>
                  executar(
                    "/carteira/preferencia",
                    { recompensa: e.target.value },
                    "PUT",
                  )
                }
              >
                <option value="dinheiro">
                  Converter automaticamente em dinheiro fictício
                </option>
                <option value="pontos">
                  Acumular pontos para trocar depois
                </option>
              </select>
            </label>
            <p className="ws-help">
              A preferência vale no momento da avaliação; não converte créditos
              anteriores.
            </p>
            <form
              className="cc-peso-form"
              onSubmit={(e) => {
                e.preventDefault();
                executar(
                  "/carteira/resgatar",
                  { pontos: Number(pontos), destino, chave: chave.current },
                  "POST",
                );
              }}
            >
              <label className="ws-field">
                Pontos para usar
                <input
                  required
                  type="number"
                  min="1"
                  step="1"
                  max={recurso.dados.pontos || 1}
                  value={pontos}
                  onChange={(e) => {
                    setPontos(e.target.value);
                    chave.current = crypto.randomUUID();
                  }}
                />
              </label>
              <label className="ws-field">
                Usar em
                <select
                  value={destino}
                  onChange={(e) => {
                    setDestino(e.target.value);
                    chave.current = crypto.randomUUID();
                  }}
                >
                  <option value="dinheiro">Saldo fictício</option>
                  <option value="troca">Vale de troca fictício</option>
                </select>
              </label>
              <button
                className="ws-btn"
                disabled={ocupado || !recurso.dados.pontos}
              >
                Resgatar pontos
              </button>
            </form>
            <p className="ws-help">
              O vale simulado consome pontos e registra um comprovante no
              extrato. Não é aceito por estabelecimentos reais.
            </p>
          </section>
          <section className="ws-card cc-form">
            <h2>Extrato</h2>
            {!recurso.dados.movimentos.length && (
              <p>
                Avalie uma coleta finalizada para receber sua primeira
                recompensa.
              </p>
            )}
            <ul className="cc-pesos">
              {recurso.dados.movimentos.map((m) => (
                <li key={m.id}>
                  <div>
                    <strong>
                      {
                        {
                          credito_dinheiro: "Recompensa convertida",
                          credito_pontos: "Pontos recebidos",
                          dinheiro: "Conversão de pontos",
                          troca: "Vale de troca fictício",
                        }[m.tipo]
                      }
                    </strong>
                    <p>
                      {new Date(m.criado_em).toLocaleDateString("pt-BR")}
                      {m.coleta_id && ` · Coleta #${m.coleta_id}`}
                    </p>
                    {m.comprovante && (
                      <small className="cc-codigo">
                        Comprovante: {m.comprovante}
                      </small>
                    )}
                  </div>
                  <span>
                    {m.pontos !== 0 && `${numero(m.pontos)} pts`}
                    {m.centavos !== 0 && ` ${moeda(m.centavos)}`}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
      {erro && (
        <p className="aviso erro" role="alert">
          {erro}
        </p>
      )}
      <Tabela catalogo={catalogo} />
    </>
  );
}
