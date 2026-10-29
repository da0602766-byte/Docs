// sessionStorage isola abas; a chave por perfil também isola os dois links
// na mesma aba ou em uma aba duplicada. A API continua validando permissões.
function chave() {
  const perfil = window.location.pathname.replace(/\/+$/, "") === "/cooperador"
    ? "cooperativa" : "morador";
  return `ciclo-certo:token:${perfil}`;
}

export const obterToken = () => sessionStorage.getItem(chave());
export const salvarToken = (token) => sessionStorage.setItem(chave(), token);
export const removerToken = () => sessionStorage.removeItem(chave());
