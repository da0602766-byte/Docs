import React, { useEffect, useState } from "react";
import { useDados, Estado } from "./operacao/interface";
import Agendar from "./operacao/Agendar";
import Listagem from "./operacao/Listagem";
import Detalhe from "./operacao/Detalhe";
import Carteira from "./operacao/Carteira";
import Perfil from "./operacao/Perfil";

// A tela principal mantém o detalhe selecionado sem transformar o perfil em autorização.
export default function Operacao({ perfil, tela, mudarTela, sair }) {
  const catalogo = useDados("/catalogo");
  const [selecionada, setSelecionada] = useState(null);
  const [revisao, setRevisao] = useState(0);
  useEffect(() => {
    setSelecionada(null);
  }, [tela]);
  if (!catalogo.dados) return <Estado recurso={catalogo} />;
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
