// Aceita somente formatos conhecidos do YouTube; nunca converte HTML ou um host arbitrário em iframe.
export function identificarVideo(link) {
  if (!link?.trim()) return null;
  try {
    const texto = link.trim();
    const url = new URL(texto.includes("://") ? texto : `https://${texto}`);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.port
    )
      return null;
    const partes = url.pathname.replace(/^\/+|\/+$/g, "").split("/");
    let id = null;
    if (
      ["youtu.be", "www.youtu.be"].includes(url.hostname) &&
      partes.length === 1
    )
      id = partes[0];
    else if (
      [
        "youtube.com",
        "www.youtube.com",
        "m.youtube.com",
        "music.youtube.com",
      ].includes(url.hostname)
    ) {
      if (
        url.pathname === "/watch" &&
        url.searchParams.getAll("v").length === 1
      )
        id = url.searchParams.get("v");
      else if (
        partes.length === 2 &&
        ["shorts", "live", "embed"].includes(partes[0])
      )
        id = partes[1];
    } else if (
      ["youtube-nocookie.com", "www.youtube-nocookie.com"].includes(
        url.hostname,
      ) &&
      partes.length === 2 &&
      partes[0] === "embed"
    )
      id = partes[1];
    return /^[A-Za-z0-9_-]{11}$/.test(id || "") ? id : null;
  } catch {
    return null;
  }
}
