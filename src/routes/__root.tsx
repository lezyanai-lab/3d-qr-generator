import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { NotFoundPage } from '@/components/error-pages'

import '../styles.css'

const base = import.meta.env.BASE_URL
// Share previews (WhatsApp, Telegram, etc.) need an absolute image URL.
const shareImage = 'https://lezyanai-lab.github.io/3d-qr-generator/og-image.png'

const siteName = '3D QR Generator — Free 3D-Printable QR Code Maker'
const siteDescription =
  'Turn any link, text or Wi-Fi login into a 3D-printable QR code tag or keychain. Free two-color 3MF download, no account needed.'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        name: 'theme-color',
        content: '#0f1224',
      },
      {
        title: siteName,
      },
      {
        name: 'description',
        content: siteDescription,
      },
      {
        property: 'og:title',
        content: siteName,
      },
      {
        property: 'og:description',
        content: siteDescription,
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        property: 'og:image',
        content: shareImage,
      },
      {
        property: 'og:image:width',
        content: '1200',
      },
      {
        property: 'og:image:height',
        content: '630',
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'twitter:image',
        content: shareImage,
      },
    ],
    links: [
      { rel: 'icon', href: `${base}favicon.ico`, sizes: '48x48' },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: `${base}favicon-32.png`,
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '192x192',
        href: `${base}icon-192.png`,
      },
      { rel: 'apple-touch-icon', href: `${base}apple-touch-icon.png` },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@500;600;700&display=swap',
      },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFoundPage,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster />
        <Scripts />
      </body>
    </html>
  )
}
