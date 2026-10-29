import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { NotFoundPage } from '@/components/error-pages'
import { ServiceWorkerRegistration } from '@/components/app-controls'
import { I18nProvider } from '@/lib/i18n'

import '../styles.css'

const base = import.meta.env.BASE_URL
// Share previews (WhatsApp, Telegram, etc.) need an absolute image URL.
const shareImage = 'https://lezyanai-lab.github.io/3d-qr-generator/og-image.png'

// Runs before first paint: applies saved theme + language (no flash), and keeps the
// browser's "install app" prompt so the Install button can use it later.
const bootScript = `(function(){try{var d=document.documentElement;var t=localStorage.getItem('theme');if(t!=='dark'&&t!=='light'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}
d.classList.toggle('dark',t==='dark');var m=document.querySelector('meta[name="theme-color"][data-dynamic]');if(m)m.setAttribute('content',t==='dark'?'#0f1224':'#f4f6fb');
var L=['en','he','ar','es','fr','de','ru'];var l=localStorage.getItem('lang');if(L.indexOf(l)<0){l='en'}
d.lang=l;d.dir=(l==='he'||l==='ar')?'rtl':'ltr'}catch(e){}
addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__installPrompt=e;dispatchEvent(new Event('install-prompt-ready'))})})();`

const siteName = '3D QR Generator — Free 3D-Printable QR Code Maker'
const siteDescription =
  'Turn any link, text, Wi-Fi login or WhatsApp number into a 3D-printable QR code tag or keychain. Free two-color 3MF download, no account needed.'

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
        'data-dynamic': 'true',
      },
      {
        name: 'mobile-web-app-capable',
        content: 'yes',
      },
      {
        name: 'apple-mobile-web-app-capable',
        content: 'yes',
      },
      {
        name: 'apple-mobile-web-app-title',
        content: '3D QR',
      },
      {
        name: 'apple-mobile-web-app-status-bar-style',
        content: 'black-translucent',
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
      { rel: 'manifest', href: `${base}manifest.webmanifest` },
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
  scripts: () => [{ children: bootScript }],
  shellComponent: RootDocument,
  notFoundComponent: NotFoundPage,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <I18nProvider>
          <TooltipProvider>{children}</TooltipProvider>
          <ServiceWorkerRegistration />
        </I18nProvider>
        <Toaster />
        <Scripts />
      </body>
    </html>
  )
}
