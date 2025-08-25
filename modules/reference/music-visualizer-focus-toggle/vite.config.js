import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const port = Number(env.VITE_PORT) || 5173;
  const base = env.VITE_BASE || '/';

  return {
    base,
    server: { port, host: true }, // host:true 便于容器/内网访问
    preview: { port, host: true },
  };
});
