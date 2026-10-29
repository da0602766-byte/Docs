import assert from "node:assert/strict";
import test from "node:test";
import configurar from "../vite.config.js";

// Confere erros de configuração antes de gerar um frontend com API inacessível.
test("Vercel exige origem HTTPS pública e aceita a URL válida", () => {
  const anteriorVercel = process.env.VERCEL;
  const anteriorApi = process.env.VITE_API_URL;
  try {
    process.env.VERCEL = "1";
    for (const url of ["", "http://127.0.0.1:8000", "https://localhost", "https://usuario:senha@api.example.org", "https://api.example.org/caminho"]) {
      process.env.VITE_API_URL = url;
      assert.throws(() => configurar({ mode: "production" }), /VITE_API_URL/);
    }
    process.env.VITE_API_URL = "https://api.example.org/";
    assert.doesNotThrow(() => configurar({ mode: "production" }));
  } finally {
    if (anteriorVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = anteriorVercel;
    if (anteriorApi === undefined) delete process.env.VITE_API_URL;
    else process.env.VITE_API_URL = anteriorApi;
  }
});
