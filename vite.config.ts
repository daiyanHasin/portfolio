import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// `npm run build` produces a normal multi-file build for any static host.
// `npm run build:single` inlines everything into one index.html (handy for
// hosts that accept a single file).
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), ...(mode === "single" ? [viteSingleFile()] : [])],
  build: { outDir: mode === "single" ? "dist-single" : "dist" },
}));
