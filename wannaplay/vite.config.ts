import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@assets': path.resolve(__dirname, './attached_assets'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
  root: '.',
  publicDir: 'public',
  server: {
    port: 5175,
    host: '0.0.0.0',
  },
  build: {
    outDir: 'dist/public',
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
    },
  },
});