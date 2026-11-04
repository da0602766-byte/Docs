// Som sintetizado localmente: nenhuma mídia externa, permissão de microfone ou reprodução ao abrir a tela.
export function prepararSom(contexto) {
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return null;
    const audio = contexto || new Audio();
    audio.resume().catch(() => {});
    return audio;
  } catch {
    return null;
  }
}

export function tocarPublicacao(audio) {
  if (!audio || audio.state !== "running") return;
  try {
    [659.25, 880].forEach((frequencia, indice) => {
      const inicio = audio.currentTime + indice * 0.11;
      const nota = audio.createOscillator();
      const volume = audio.createGain();
      nota.type = "sine";
      nota.frequency.value = frequencia;
      volume.gain.setValueAtTime(0, inicio);
      volume.gain.linearRampToValueAtTime(0.07, inicio + 0.018);
      volume.gain.exponentialRampToValueAtTime(0.001, inicio + 0.22);
      nota.connect(volume);
      volume.connect(audio.destination);
      nota.onended = () => {
        nota.disconnect();
        volume.disconnect();
      };
      nota.start(inicio);
      nota.stop(inicio + 0.24);
    });
  } catch {
    // Dispositivos sem áudio não impedem a confirmação visual nem o envio.
  }
}
