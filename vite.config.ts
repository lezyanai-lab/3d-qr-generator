import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Static single-page build for GitHub Pages, served from /3d-qr-generator/.
// Use BASE_PATH=/ to build for a site root (custom domain).
const base = process.env.BASE_PATH ?? '/3d-qr-generator/'

const config = defineConfig({
  base,
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(),
    tanstackStart({
      spa: { enabled: true, prerender: { outputPath: '/index.html' } },
    }),
    viteReact(),
  ],
})

export default config
