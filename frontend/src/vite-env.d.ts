/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE: string
  // add other env vars here...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}