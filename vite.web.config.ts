import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  root: resolve(__dirname, "desktop"),
  base: process.env.PDG_BASE_PATH ?? "/",
  publicDir: resolve(__dirname, "public"),
  plugins: [react()],
  resolve: { alias: { "@": resolve(__dirname, "src") } },
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
    target: "es2022",
  },
  clearScreen: false,
});
