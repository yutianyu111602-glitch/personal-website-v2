import { defineConfig } from 'vite';

const PORT = Number(process.env.PORT || 3000);

export default defineConfig({
  server: { host: true, port: PORT },
  optimizeDeps: { include: [] },
});
