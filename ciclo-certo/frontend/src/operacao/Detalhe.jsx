import React, { useRef, useState } from "react";
import { solicitar, enviar } from "../api";
import { Situacao } from "../visual";
import {
  moeda,
  numero,
  data,
  useDados,
  Estado,
  Cabecalho,
  Modal,
} from "./interface";

// A foto é reduzida no dispositivo antes do envio; a API valida novamente o arquivo.
async function prepararFoto(arquivo) {
  if (
    !arquivo ||
    !["image/jpeg", "image/png", "image/webp"].includes(arquivo.type) ||
    arquivo.size > 15000000
  )
    throw new Error("Escolha uma foto JPG, PNG ou WebP de até 15 MB.");
  const bitmap = await createImageBitmap(arquivo);
  const escala = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.8);
}

function Assinatura({ mudar }) {
  const canvas = useRef(null);
  const desenhando = useRef(false);
  function ponto(e) {
    const r = canvas.current.getBoundingClientRect();
    return [
      ((e.clientX - r.left) * 600) / r.width,
      ((e.clientY - r.top) * 180) / r.height,
    ];
  }
  function iniciar(e) {
    const c = canvas.current;
    c.setPointerCapture(e.pointerId);
    const ctx = c.getContext("2d");
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(...ponto(e));
    desenhando.current = true;
  }
  function desenhar(e) {
    if (desenhando.current) {
      const ctx = canvas.current.getContext("2d");
      ctx.lineTo(...ponto(e));
      ctx.stroke();
    }
  }
  function terminar() {
    if (desenhando.current) {
      desenhando.current = false;
      mudar(canvas.current.toDataURL("image/png"));
    }
  }
  return (
    <div>
      <p id="assinatura-ajuda">
        Solicitante: desenhe sua assinatura abaixo com o dedo, caneta ou mouse
        após conferir os pesos.
      </p>
      <canvas
        aria-label="Área para assinatura do solicitante"
        aria-describedby="assinatura-ajuda"
        className="cc-assinatura"
        ref={canvas}
        width="600"
        height="180"
        onPointerDown={iniciar}
        onPointerMove={desenhar}
        onPointerUp={terminar}
        onPointerCancel={terminar}
      />
      <button
        type="button"
        className="ws-btn ws-btn-ghost"
        onClick={() => {
          canvas.current.getContext("2d").clearRect(0, 0, 600, 180);
          mudar("");
        }}
      >
        Limpar assinatura
      </button>
    </div>
  );
}

function Celebracao({ pontos, destino, fechar }) {
  return (
    <Modal titulo="Sua coleta ganhou um novo valor!" fechar={fechar}>
      <div className="cc-celebracao">
        <div className="cc-chuva" aria-hidden="true">
          {Array.from({ length: 16 }, (_, i) => (
            <span
              style={{ left: `${i * 6}%`, animationDelay: `${i * 0.09}s` }}
              key={i}
            >
              ●
            </span>
          ))}
        </div>
        <strong>+{numero(pontos)} pontos</strong>
        <p>
          {destino === "dinheiro"
            ? `${moeda(pontos)} adicionados automaticamente ao saldo fictício.`
            : "Pontos disponíveis na carteira para converter ou trocar."}
        </p>
        <p>Obrigado por avaliar. Sua nota não altera a recompensa.</p>
        <button className="ws-btn" onClick={fechar}>
          Continuar
        </button>
      </div>
    </Modal>
  );
}

export default function Detalhe({ id, perfil, catalogo, voltar, atualizar }) {
  const [revisao, setRevisao] = useState(0);
  const recurso = useDados(`/coletas/${id}`, revisao);
  const pesos = useDados(`/coletas/${id}/pesagens`, revisao);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [modal, setModal] = useState("");
  const [observacao, setObservacao] = useState("");
  const [motivo, setMotivo] = useState("");
  const [material, setMaterial] = useState("aluminio");
  const [quilos, setQuilos] = useState("");
  const [editando, setEditando] = useState(null);
  const [foto, setFoto] = useState("");
  const [assinatura, setAssinatura] = useState("");
  const [nome, setNome] = useState("");
  const [aceite, setAceite] = useState(false);
  const [nota, setNota] = useState("");
  const [comentario, setComentario] = useState("");
  const [celebracao, setCelebracao] = useState(null);
  const [comprovante, setComprovante] = useState(null);
  const coleta = recurso.dados;
  const responsavel =
    coleta?.cooperador_id === perfil.id && perfil.tipo === "cooperativa";
  const editavel = responsavel && coleta?.situacao === "em_coleta";
  function recarregar() {
    setRevisao((n) => n + 1);
    atualizar();
  }
  async function acao(caminho, dados = {}, metodo = "POST") {
    setOcupado(true);
    setErro("");
    setMensagem("");
    try {
      const r = await enviar(`/coletas/${id}/${caminho}`, dados, metodo);
      setModal("");
      recarregar();
      return r;
    } catch (e) {
      setErro(e.message);
      return null;
    } finally {
      setOcupado(false);
    }
  }
  async function salvarPeso(e) {
    e.preventDefault();
    const r = await acao(
      `pesagens${editando ? `/${editando}` : ""}`,
      { material, quilos },
      editando ? "PUT" : "POST",
    );
    if (r) {
      setQuilos("");
      setEditando(null);
      setAssinatura("");
      setAceite(false);
    }
  }
  async function avaliar(e) {
    e.preventDefault();
    const r = await acao("avaliar", { nota: Number(nota), comentario });
    if (r?.creditada)
      setCelebracao({ pontos: r.coleta.pontos, destino: r.destino });
    else if (r)
      setMensagem("Esta coleta já foi avaliada. Nenhum crédito foi duplicado.");
  }
  async function verComprovante() {
    setOcupado(true);
    setErro("");
    try {
      setComprovante(await solicitar(`/coletas/${id}/comprovante`));
    } catch (e) {
      setErro(e.message);
    } finally {
      setOcupado(false);
    }
  }
  return (
    <>
      <button className="ws-back" onClick={voltar}>
        ← Voltar às coletas
      </button>
      <Estado recurso={recurso} />
      {coleta && (
        <>
          <Cabecalho
            titulo={`Coleta nº ${id}`}
            texto={`${data(coleta.dia)} · ${coleta.hora || "Sem horário"} · ${coleta.nome_morador}`}
          />
          <div className="cc-resumo ws-card">
            <Situacao valor={coleta.situacao} />
            <p>{coleta.endereco}</p>
            <p>{coleta.materiais_informados.join(" · ")}</p>
            <p>
              Responsável: {coleta.nome_cooperador || "Aguardando cooperador"}
            </p>
            <strong>
              {numero(
                coleta.situacao === "coletada"
                  ? coleta.pontos
                  : coleta.pontos_previstos,
              )}{" "}
              pontos{" "}
              {coleta.situacao === "coletada" ? "liberados" : "previstos"}
            </strong>
            <p className="ws-help">
              {coleta.situacao === "coletada"
                ? "Recompensa já liberada; consulte o extrato da carteira."
                : "Pontos liberados após confirmação e avaliação. Saldo em dinheiro é fictício."}
            </p>
            {coleta.motivo_cancelamento && (
              <p className="cc-cuidado">
                Cancelamento: {coleta.motivo_cancelamento}
              </p>
            )}
            {coleta.nota && (
              <p>
                Avaliação: {coleta.nota}/5 ·{" "}
                {coleta.comentario || "Sem comentário"}
              </p>
            )}
            {perfil.tipo === "cooperativa" &&
              coleta.situacao === "agendada" && (
                <button className="ws-btn" onClick={() => setModal("assumir")}>
                  Assumir coleta
                </button>
              )}
            {responsavel && coleta.situacao === "aguardando_avaliacao" && (
              <button
                className="ws-btn"
                disabled={ocupado}
                onClick={async () => {
                  const r = await acao("solicitar-avaliacao");
                  if (r) setMensagem(r.mensagem);
                }}
              >
                Reenviar solicitação de avaliação
              </button>
            )}
          </div>
          <section className="ws-card cc-form">
            <h2>Pesagens {editavel ? "em conferência" : "registradas"}</h2>
            <Estado recurso={pesos} />
            <ul className="cc-pesos">
              {pesos.dados?.map((p) => (
                <li key={p.id}>
                  <div>
                    <strong>
                      {catalogo.itens.find((i) => i.codigo === p.material)
                        ?.nome || p.material}
                    </strong>
                    <p>
                      {numero(p.quilos)} kg · {numero(p.pontos)} pontos
                      estimados
                    </p>
                  </div>
                  {editavel && (
                    <div className="cc-acoes">
                      <button
                        className="ws-btn ws-btn-ghost"
                        disabled={ocupado}
                        onClick={() => {
                          setEditando(p.id);
                          setMaterial(p.material);
                          setQuilos(String(p.quilos));
                        }}
                      >
                        Editar
                      </button>
                      <button
                        className="ws-btn ws-btn-ghost"
                        disabled={ocupado}
                        onClick={() => acao(`pesagens/${p.id}`, {}, "DELETE")}
                      >
                        Remover
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            {pesos.dados?.length === 0 && <p>Nenhum peso registrado.</p>}
            {editavel && (
              <>
                <form className="cc-peso-form" onSubmit={salvarPeso}>
                  <label className="ws-field">
                    Categoria
                    <select
                      value={material}
                      onChange={(e) => setMaterial(e.target.value)}
                    >
                      {catalogo.itens.map((i) => (
                        <option key={i.codigo} value={i.codigo}>
                          {i.nome}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="ws-field">
                    Peso (kg)
                    <input
                      type="number"
                      required
                      min="0.001"
                      max="999999999.999"
                      step="0.001"
                      value={quilos}
                      onChange={(e) => setQuilos(e.target.value)}
                    />
                  </label>
                  <button className="ws-btn" disabled={ocupado}>
                    {editando ? "Salvar peso" : "Adicionar peso"}
                  </button>
                  {editando && (
                    <button
                      className="ws-btn ws-btn-ghost"
                      type="button"
                      onClick={() => {
                        setEditando(null);
                        setQuilos("");
                      }}
                    >
                      Desistir da edição
                    </button>
                  )}
                </form>
                <p className="ws-help">
                  Eletrônicos precisam de orientação da equipe; não possuem
                  preço tabelado. A categoria Eletrônicos registra o peso com
                  recompensa zero, após a equipe orientar o recebimento.
                </p>
                <div className="cc-acoes">
                  <button
                    className="ws-btn"
                    disabled={
                      ocupado || !pesos.dados?.length || Boolean(editando)
                    }
                    onClick={() => {
                      setAssinatura("");
                      setAceite(false);
                      setModal("finalizar");
                    }}
                  >
                    Foto e assinatura · finalizar
                  </button>
                  <button
                    className="ws-btn ws-btn-ghost"
                    disabled={ocupado}
                    onClick={() => setModal("cancelar")}
                  >
                    Cancelar coleta
                  </button>
                </div>
              </>
            )}
          </section>
          {perfil.tipo === "morador" &&
            coleta.situacao === "aguardando_avaliacao" && (
              <form className="ws-card cc-form cc-avaliacao" onSubmit={avaliar}>
                <h2>Como foi sua coleta?</h2>
                <p>
                  Qualquer nota libera os mesmos{" "}
                  {numero(coleta.pontos_previstos)} pontos.
                </p>
                <fieldset>
                  <legend>Sua avaliação</legend>
                  <div className="cc-estrelas">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <label key={n}>
                        <input
                          type="radio"
                          name="nota"
                          required
                          value={n}
                          checked={nota === n}
                          onChange={() => setNota(n)}
                        />
                        <span>{n} ★</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label className="ws-field">
                  Comentário (opcional)
                  <textarea
                    maxLength={500}
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                  />
                </label>
                <button className="ws-btn" disabled={ocupado}>
                  Avaliar e liberar recompensa
                </button>
              </form>
            )}
          {coleta.tem_comprovante &&
            (perfil.tipo === "morador" || responsavel) && (
              <section className="ws-card cc-form">
                <button
                  className="ws-btn ws-btn-ghost"
                  disabled={ocupado}
                  onClick={verComprovante}
                >
                  Ver foto e assinatura
                </button>
                {comprovante && (
                  <div className="cc-comprovante">
                    <img
                      src={comprovante.foto}
                      alt="Foto de confirmação da coleta"
                    />
                    <img
                      src={comprovante.assinatura}
                      alt={`Assinatura de ${comprovante.nome_signatario}`}
                    />
                    <p>
                      {comprovante.nome_signatario} ·{" "}
                      {new Date(comprovante.criado_em).toLocaleString("pt-BR", {
                        timeZone: "America/Sao_Paulo",
                      })}
                    </p>
                  </div>
                )}
              </section>
            )}
        </>
      )}
      {erro && !modal && (
        <p className="aviso erro" role="alert">
          {erro}
        </p>
      )}
      {mensagem && (
        <p className="aviso" role="status">
          {mensagem}
        </p>
      )}
      {modal === "assumir" && (
        <Modal
          titulo="Responsabilidade pela coleta"
          fechar={() => !ocupado && setModal("")}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              acao("assumir", { confirmar: true, observacao });
            }}
          >
            <p>
              {perfil.nome}, você ficará responsável por conferir, pesar e
              finalizar esta coleta.
            </p>
            <label className="ws-field">
              Observação (opcional)
              <textarea
                value={observacao}
                maxLength={300}
                onChange={(e) => setObservacao(e.target.value)}
              />
            </label>
            <label className="cc-checkbox">
              <input required type="checkbox" />
              Confirmo minha responsabilidade por este atendimento.
            </label>
            {erro && <p role="alert">{erro}</p>}
            <button className="ws-btn" disabled={ocupado}>
              Confirmar responsabilidade
            </button>
          </form>
        </Modal>
      )}
      {modal === "cancelar" && (
        <Modal
          titulo="Cancelar atendimento"
          fechar={() => !ocupado && setModal("")}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              acao("cancelar", { motivo });
            }}
          >
            <p>
              O motivo será enviado às notificações do morador. Exemplo: morador
              ausente no horário combinado.
            </p>
            <label className="ws-field">
              Motivo do cancelamento
              <textarea
                required
                minLength={10}
                maxLength={500}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              />
            </label>
            {erro && <p role="alert">{erro}</p>}
            <button className="ws-btn" disabled={ocupado}>
              Cancelar e avisar morador
            </button>
          </form>
        </Modal>
      )}
      {modal === "finalizar" && (
        <Modal
          titulo="Confirmar retirada e pesos"
          fechar={() => !ocupado && setModal("")}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              acao("finalizar", {
                versao: coleta.versao,
                foto,
                assinatura,
                nome_signatario: nome,
                aceite,
              });
            }}
          >
            <p>
              <strong>{coleta.nome_morador}</strong>, confira antes de assinar:
            </p>
            <ul>
              {pesos.dados?.map((p) => (
                <li key={p.id}>
                  {catalogo.itens.find((i) => i.codigo === p.material)?.nome ||
                    p.material}
                  : {numero(p.quilos)} kg
                </li>
              ))}
            </ul>
            <p>
              {numero(coleta.pontos_previstos)} pontos previstos. Após
              confirmar, os pesos serão bloqueados.
            </p>
            <label className="ws-field">
              Foto da coleta
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                disabled={ocupado}
                onChange={async (e) => {
                  setOcupado(true);
                  setErro("");
                  try {
                    setFoto(await prepararFoto(e.target.files[0]));
                  } catch (e) {
                    setErro(e.message);
                    setFoto("");
                  } finally {
                    setOcupado(false);
                  }
                }}
              />
            </label>
            {foto && (
              <img
                className="cc-previa"
                src={foto}
                alt="Prévia da foto da coleta"
              />
            )}
            <label className="ws-field">
              Nome completo do solicitante
              <input
                required
                minLength={2}
                maxLength={80}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </label>
            <Assinatura mudar={setAssinatura} />
            <label className="cc-checkbox">
              <input
                type="checkbox"
                required
                checked={aceite}
                onChange={(e) => setAceite(e.target.checked)}
              />
              Sou o solicitante e confirmo a retirada e os pesos apresentados.
            </label>
            <p className="ws-help">
              Registro de ciência no atendimento; não é uma assinatura digital
              certificada.
            </p>
            {erro && (
              <p role="alert" className="aviso erro">
                {erro}
              </p>
            )}
            <button
              className="ws-btn"
              disabled={ocupado || !foto || !assinatura || !aceite}
            >
              Confirmar e solicitar avaliação
            </button>
          </form>
        </Modal>
      )}
      {celebracao && (
        <Celebracao {...celebracao} fechar={() => setCelebracao(null)} />
      )}
    </>
  );
}
