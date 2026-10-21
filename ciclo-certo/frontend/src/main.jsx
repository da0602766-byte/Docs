// Este arquivo conecta o React ao elemento root da pagina.
import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import "./ajustes.css";

// Renderiza a aplicacao inteira no unico ponto de entrada do HTML.
createRoot(document.getElementById("root")).render(<StrictMode><App /></StrictMode>);
