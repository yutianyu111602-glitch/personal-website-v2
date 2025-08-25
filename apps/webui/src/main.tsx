
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  import { initCoreManagers, startCoreManagers } from './core';

  async function bootstrap() {
    try {
      await initCoreManagers();
      await startCoreManagers();
    } catch (e) {
      console.error('[core] managers init/start failed', e);
    }
    createRoot(document.getElementById("root")!).render(<App />);
  }

  bootstrap();
  