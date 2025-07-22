import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Minimal vite config that won't crash in production
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": "/client/src",
      "@shared": "/shared",
    },
  },
  root: "client",
  build: {
    outDir: "../dist/public",
    emptyOutDir: true,
  },
});