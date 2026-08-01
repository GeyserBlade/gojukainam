/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE: string
  // add other env vars here...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare const __APP_VERSION__: string

// Side-effect CSS-only packages imported without a file extension
declare module '@fontsource-variable/inter'
