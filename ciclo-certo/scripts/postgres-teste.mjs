// Infraestrutura opcional: PostgreSQL portátil com acesso restrito ao computador local.
import EmbeddedPostgres from "../.test-infra/node_modules/embedded-postgres/dist/index.js";
import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pasta = path.join(raiz, ".test-infra");
const arquivo = path.join(pasta, "acesso.json");
const acesso = fs.existsSync(arquivo)
  ? JSON.parse(fs.readFileSync(arquivo, "utf8"))
  : { password: crypto.randomBytes(24).toString("hex"), port: 55439 };
fs.writeFileSync(arquivo, JSON.stringify(acesso));
const pg = new EmbeddedPostgres({
  databaseDir: path.join(pasta, "dados"), user: "postgres",
  password: acesso.password, port: acesso.port, persistent: true,
  postgresFlags: ["-h", "127.0.0.1"],
  onLog: () => {}, onError: (erro) => { if (String(erro).includes("FATAL")) console.error(erro); },
});
if (!fs.existsSync(path.join(pasta, "dados", "PG_VERSION"))) await pg.initialise();
await pg.start();
const cliente = pg.getPgClient("postgres", "127.0.0.1");
await cliente.connect();
for (const papel of ["anon", "authenticated", "ciclo_certo_backend"]) {
  const existente = await cliente.query("SELECT 1 FROM pg_roles WHERE rolname=$1", [papel]);
  if (!existente.rowCount) await cliente.query(`CREATE ROLE ${papel}`);
}
if (!(await cliente.query("SELECT 1 FROM pg_database WHERE datname='ciclo_certo_teste_local'")).rowCount) {
  await cliente.query("CREATE DATABASE ciclo_certo_teste_local");
}
await cliente.end();
console.log("Banco isolado de teste pronto em 127.0.0.1:" + acesso.port);
const manter = setInterval(() => {}, 60000);
let encerrando = false;
async function encerrar() {
  if (encerrando) return;
  encerrando = true;
  clearInterval(manter);
  await pg.stop();
  process.exit(0);
}
process.on("SIGINT", encerrar);
process.on("SIGTERM", encerrar);
