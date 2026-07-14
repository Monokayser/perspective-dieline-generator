import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "../src/styles/globals.css";
import { Workbench } from "../src/components/Workbench";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Workbench />
  </React.StrictMode>,
);
