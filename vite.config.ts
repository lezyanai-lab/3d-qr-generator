import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import netlify from '@netlify/vite-plugin-tanstack-start'

// GitHub Pages build: static SPA served from /3d-qr-generator/.
// Set GITHUB_PAGES=true to build it; the default build targets Netlify (SSR).
const isPages = process.env.GITHUB_PAGES === 'true'

const config = defineConfig({
  base: isPages ? '/3d-qr-generator/' : '/',
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(),
    ...(isPages ? [] : [netlify()]),
    tanstackStart(
      isPages
        ? { spa: { enabled: true, prerender: { outputPath: '/index.html' } } }
        : {},
    ),
    viteReact(),
  ],
})

export default config
