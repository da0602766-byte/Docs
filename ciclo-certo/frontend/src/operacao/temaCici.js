// Encerrar o assunto atua apenas no rascunho da conversa.
export function lerMudancaDeAssunto(texto) {
  texto = texto.trim().normalize("NFC");
  const normal = texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  if (/^(?:(?:eu )?quero )?cancelar(?: o| a)? coleta(?:\b|$)/.test(normal)) {
    return { coletaRegistrada: true };
  }
  const comando = normal.match(/^(?:(?:eu )?nao quero mais(?: (?:falar?|conversar|saber) sobre (?:isso|esse assunto)|(?=$|[,.!?;:—-]))|(?:vamos )?mudar de assunto|mudando de assunto|(?:vamos )?falar de outra coisa|(?:pode )?deixa(?:r)? (?:isso )?(?:pra|para) la|(?:eu )?(?:quero |prefiro )?parar por aqui|(?:quero )?cancelar(?: o)? (?:rascunho|agendamento)|desisti)(?=$|[\s,.!?;:—-])/);
  if (!comando) return null;
  const resto = texto.slice(comando[0].length)
    .replace(/^[\s,.!?;:—-]+/, "")
    .replace(/^(?:mudando de assunto|vamos mudar de assunto)[\s,.!?;:—-]*/i, "");
  return { proximaPergunta: resto };
}
