import assert from "node:assert/strict";
import test from "node:test";
import { identificarVideo } from "../src/operacao/youtube.js";

test("YouTube: watch, compartilhamento, Shorts, live e embed preservam o ID", () => {
  for (const link of [
    "https://youtu.be/M7lc1UVf-VE?si=abc",
    "www.youtube.com/watch?v=M7lc1UVf-VE&t=10",
    "https://m.youtube.com/shorts/M7lc1UVf-VE",
    "https://youtube.com/live/M7lc1UVf-VE",
    "https://www.youtube-nocookie.com/embed/M7lc1UVf-VE",
  ])
    assert.equal(identificarVideo(link), "M7lc1UVf-VE");
});

test("YouTube: recusa hosts parecidos, credenciais, HTML, protocolos e IDs inválidos", () => {
  for (const link of [
    "",
    "javascript:alert(1)",
    "https://youtube.com.evil.org/watch?v=M7lc1UVf-VE",
    "https://youtube.com@evil.org/watch?v=M7lc1UVf-VE",
    "https://127.0.0.1/M7lc1UVf-VE",
    "https://youtube.com/playlist?list=abc",
    "https://youtu.be/curto",
    "https://youtube.com/watch?v=M7lc1UVf-VE&v=12345678901",
    '<iframe src="https://youtube.com/embed/M7lc1UVf-VE"></iframe>',
  ])
    assert.equal(identificarVideo(link), null, link);
});
