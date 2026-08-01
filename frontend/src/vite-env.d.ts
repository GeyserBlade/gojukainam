/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE: string
  // add other env vars here...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare const __APP_VERSION__: string

// @fontsource packages ship CSS only, with no type declarations, and TS 6
// requires a declaration even for a side-effect import.
declare module "@fontsource-variable/inter"