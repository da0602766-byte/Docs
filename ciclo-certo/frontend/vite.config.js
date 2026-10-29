import { defineConfig, loadEnv } from "vite";

// Infraestrutura: um deploy não pode apontar para a API local do visitante.
export default defineConfig(({ mode }) => {
  const ambiente = loadEnv(mode, process.cwd(), "");
  if ((process.env.VERCEL || ambiente.VERCEL) === "1") {
    let endereco;
    try {
      endereco = new URL(process.env.VITE_API_URL || ambiente.VITE_API_URL);
    } catch {
      throw new Error("Configure VITE_API_URL com a URL HTTPS do backend na Vercel.");
    }
    if (endereco.protocol !== "https:" || ["localhost", "127.0.0.1", "[::1]"].includes(endereco.hostname) || endereco.username || endereco.password || endereco.search || endereco.hash || endereco.pathname !== "/") {
      throw new Error("VITE_API_URL deve ser a origem HTTPS pública da API, sem credenciais ou caminho.");
    }
  }
  return {};
});
