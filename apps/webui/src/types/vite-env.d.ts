/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TERMUSIC_HOST: string
  readonly VITE_TERMUSIC_PORT: string
  readonly VITE_TERMUSIC_WEBSOCKET_ENABLED: string
  readonly VITE_TERMUSIC_PROTOCOL: string
  readonly VITE_TERMUSIC_TIMEOUT: string
  readonly VITE_POSTMSG_ORIGINS: string
  readonly VITE_MUSIC_SERVICE_HOST: string
  readonly VITE_MUSIC_SERVICE_PORT: string
  readonly VITE_EVENT_BUS_ENABLED: string
  readonly VITE_AUTO_ORCHESTRATION_ENABLED: string
  readonly VITE_DEBUG_MODE: string
  readonly VITE_PERFORMANCE_MONITORING: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
