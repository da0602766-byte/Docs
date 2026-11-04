import React, { useEffect, useState } from "react";
import { useDados, Estado } from "./operacao/interface";
import Agendar from "./operacao/Agendar";
import Listagem from "./operacao/Listagem";
import Detalhe from "./operacao/Detalhe";
import Carteira from "./operacao/Loja";
import Gestao from "./operacao/Gestao";
import "./gestao.css";
import Perfil from "./operacao/Perfil";
import Comunidade from "./operacao/Comunidade";
import { CentralAvisos, Impacto } from "./operacao/Participacao";
import AcoesBairro, { Convites, Metricas } from "./operacao/AcoesBairro";

// A tela principal mantém o detalhe selecionado sem transformar o perfil em autorização.
export default function Operacao({
  perfil,
  tela,
  mudarTela,
  sair,
  pedidoAviso,
}) {
  const catalogo = useDados("/catalogo");
  const [selecionada, setSelecionada] = useState(null);
  const [revisao, setRevisao] = useState(0);
  const [publicacao, setPublicacao] = useState(
    () =>
      Number(new URLSearchParams(window.location.search).get("publicacao")) ||
      null,
  );
  const [pergunta, setPergunta] = useState("");
  useEffect(() => {
    const mostrar = (e) => {
      setPublicacao(e.detail);
      mudarTela("comunidade");
    };
    window.addEventListener("ciclo-certo-abrir-publicacao", mostrar);
    return () =>
      window.removeEventListener("ciclo-certo-abrir-publicacao", mostrar);
  }, [mudarTela]);
  const abrir = (id) => {
    setPublicacao(id);
    mudarTela("comunidade");
  };
  useEffect(() => {
    setSelecionada(null);
  }, [tela]);
  if (tela === "comunidade")
    return (
      <Comunidade
        perfil={perfil}
        selecionada={publicacao}
        fecharSelecionada={() => setPublicacao(null)}
        pergunta={pergunta}
        limparPergunta={() => setPergunta("")}
      />
    );
  if (tela === "avisos") return <CentralAvisos abrir={abrir} />;
  if (tela === "impacto") return <Impacto />;
  if (tela === "acoes")
    return (
      <AcoesBairro
        abrir={abrir}
        participarConversa={(titulo) => {
          setPergunta(titulo);
          mudarTela("comunidade");
        }}
      />
    );
  if (tela === "convites") return <Convites />;
  if (tela === "metricas") return <Metricas />;
  if (!catalogo.dados) return <Estado recurso={catalogo} />;
  if (perfil.tipo === "cooperativa")
    return (
      <Gestao
        perfil={perfil}
        tela={tela}
        catalogo={catalogo.dados}
        pedidoAviso={pedidoAviso}
        sair={sair}
      />
    );
  if (tela === "perfil") return <Perfil perfil={perfil} sair={sair} />;
  if (tela === "carteira" && perfil.tipo === "morador")
    return <Carteira catalogo={catalogo.dados} />;
  if (tela === "agendar" && perfil.tipo === "morador")
    return (
      <Agendar
        catalogo={catalogo.dados}
        concluir={() => {
          setRevisao((n) => n + 1);
          mudarTela("minhas");
        }}
      />
    );
  if (selecionada)
    return (
      <Detalhe
        key={selecionada}
        id={selecionada}
        perfil={perfil}
        catalogo={catalogo.dados}
        voltar={() => setSelecionada(null)}
        atualizar={() => setRevisao((n) => n + 1)}
      />
    );
  return (
    <Listagem perfil={perfil} selecionar={setSelecionada} revisao={revisao} />
  );
}
