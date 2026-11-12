import React, { useId } from "react";

// Aceita a vírgula do teclado brasileiro sem reformatação durante a digitação.
export function lerPesoEstimado(valor) {
  const peso = valor.trim().replace(",", ".");
  return /^\d+(?:\.\d{1,3})?$/.test(peso) && Number(peso) > 0 && Number(peso) < 1e9 ? peso : null;
}

export default function PesoEstimado({ valor, mudar, className = "ws-field" }) {
  const ajuda = useId();
  return <label className={className}>
    Peso estimado (kg)
    <input inputMode="decimal" required maxLength={13} placeholder="Ex.: 4,5" value={valor}
      onChange={(e) => mudar(e.target.value)} aria-describedby={ajuda}
      onInput={(e) => e.currentTarget.setCustomValidity(lerPesoEstimado(e.currentTarget.value) ? "" : "Informe um peso maior que zero, com até três casas decimais.")} />
    <small id={ajuda}>Informe o peso total aproximado. Ele ajuda a planejar a retirada.</small>
  </label>;
}
