import { defineConfig } from 'vite';

export default defineConfig({
  base: '/WebRPG/',
  build: { target: 'es2022', chunkSizeWarningLimit: 1500 },
});
