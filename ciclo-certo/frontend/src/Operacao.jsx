import React, { useEffect, useState } from "react";
import { useDados, Estado } from "./operacao/interface";
import Listagem from "./operacao/Listagem";
import Detalhe from "./operacao/Detalhe";
import Carteira from "./operacao/Loja";
import Gestao from "./operacao/Gestao";
import "./gestao.css";
import Perfil from "./operacao/Perfil";
import Comunidade from "./operacao/Comunidade";
import { CentralAvisos, Impacto } from "./operacao/Participacao";
import AcoesBairro, { Convites, Metricas } from "./operacao/AcoesBairro";
import CiciMorador from "./operacao/CiciMorador";

// A tela principal mantém o detalhe selecionado sem transformar o perfil em autorização.
export default function Operacao({
  perfil,
  aoAtualizarPerfil,
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
    setSelecionada(perfil.tipo === "morador" && tela === "minhas" ? pedidoAviso?.id ?? null : null);
  }, [tela, pedidoAviso, perfil.tipo]);

  const mostrarResumo = tela === "cici" || tela === "agendar";
  function conteudo() {
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
    if (tela === "perfil") return <Perfil perfil={perfil} sair={sair} aoAtualizarPerfil={aoAtualizarPerfil} />;
    if (mostrarResumo) return null;
    if (tela === "carteira" && perfil.tipo === "morador")
      return <Carteira enderecoPreferido={perfil.endereco_coleta} />;
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

  return (
    <>
      {conteudo()}
      {perfil.tipo === "morador" && catalogo.dados && (
        <CiciMorador perfil={perfil} catalogo={catalogo.dados} mudarTela={mudarTela}
          abrirPublicacao={abrir} mostrarResumo={mostrarResumo} iniciarAgendamento={tela === "agendar"}
          aoAlterarColetas={() => setRevisao((n) => n + 1)} />
      )}
    </>
  );
}
