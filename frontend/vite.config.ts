import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf8'))

export default defineConfig({
  plugins: [react(), tailwind()],
  server: { port: 5173 },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
})
