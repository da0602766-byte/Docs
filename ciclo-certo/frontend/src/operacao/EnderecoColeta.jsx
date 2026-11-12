import { useEffect, useRef, useState } from "react";

// O ViaCEP recebe apenas o CEP e o endereço preenchido continua editável.
export default function EnderecoColeta({ endereco, mudar, rotulo = "Endereço completo", obrigatorio = true }) {
  const [cep, setCep] = useState(() => endereco.match(/\b\d{5}-\d{3}\b/)?.[0] || "");
  const [status, setStatus] = useState("");
  const [buscando, setBuscando] = useState(false);
  const consulta = useRef(null);
  const campoEndereco = useRef(null);
  const posicaoNumero = useRef(null);

  useEffect(() => () => consulta.current?.abort(), []);
  useEffect(() => {
    if (posicaoNumero.current === null) return;
    campoEndereco.current.focus();
    campoEndereco.current.setSelectionRange(posicaoNumero.current, posicaoNumero.current);
    posicaoNumero.current = null;
  }, [endereco]);

  function cancelarConsulta() {
    consulta.current?.abort();
    consulta.current = null;
    setBuscando(false);
    setStatus("");
  }

  async function buscar() {
    const digitos = cep.replace("-", "");
    if (!/^\d{8}$/.test(digitos) || consulta.current) return;
    const controle = new AbortController();
    const limite = window.setTimeout(() => controle.abort(), 5_000);
    consulta.current = controle;
    setBuscando(true);
    setStatus("");
    try {
      const resposta = await fetch(`https://viacep.com.br/ws/${digitos}/json/`, { signal: controle.signal, credentials: "omit" });
      if (!resposta.ok) throw new Error();
      const dados = await resposta.json();
      if (consulta.current !== controle || controle.signal.aborted) return;
      if (dados.erro === true || dados.erro === "true" || !dados.localidade || !dados.uf) {
        setStatus("CEP não encontrado. Confira os dígitos ou preencha o endereço manualmente.");
        return;
      }
      const completo = [dados.logradouro, dados.bairro, `${dados.localidade} - ${dados.uf}`, cep].filter(Boolean).join(", ");
      if (completo !== endereco && completo.length <= 160) {
        campoEndereco.current.setCustomValidity(dados.logradouro ? "Inclua o número no endereço." : "Inclua a rua e o número no endereço.");
        posicaoNumero.current = dados.logradouro?.length || 0;
        mudar(completo);
      }
      setStatus(completo.length > 160 ? "Preencha o endereço manualmente usando o CEP informado." : dados.logradouro
        ? "Inclua o número após o nome da rua e o complemento, se houver."
        : "Este CEP identifica a localidade. Inclua a rua, o número e o bairro.");
    } catch {
      if (consulta.current === controle) setStatus("Não foi possível consultar o CEP agora. Preencha o endereço manualmente.");
    } finally {
      window.clearTimeout(limite);
      if (consulta.current === controle) {
        consulta.current = null;
        setBuscando(false);
      }
    }
  }

  return <div className="endereco-coleta">
    <div className="endereco-cep">
      <label className="ws-field">CEP (opcional)
        <input value={cep} inputMode="numeric" autoComplete="postal-code" placeholder="00000-000"
          onChange={(e) => {
            cancelarConsulta();
            const digitos = e.target.value.replace(/\D/g, "").slice(0, 8);
            setCep(digitos.length > 5 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos);
          }} onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            buscar();
          }} />
      </label>
      <button type="button" className="ws-btn ws-btn-ghost" disabled={buscando || cep.length !== 9} onClick={buscar}>
        {buscando ? "Buscando…" : "Buscar CEP"}
      </button>
    </div>
    {status && <p role="status" className="ws-help">{status}</p>}
    <label className="ws-field">{rotulo}
      <input ref={campoEndereco} value={endereco} onChange={(e) => {
        if (consulta.current) cancelarConsulta();
        e.target.setCustomValidity("");
        mudar(e.target.value);
      }}
        maxLength={160} minLength={10} required={obrigatorio} autoComplete="street-address"
        placeholder="Rua, número, complemento, bairro e município" />
    </label>
  </div>;
}
