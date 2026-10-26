import { useEffect, useSyncExternalStore } from 'react'
import { Download, Globe, Moon, Sun } from 'lucide-react'
import { toast } from 'sonner'

import { languages, useI18n, type Lang } from '@/lib/i18n'

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface Window {
    __installPrompt?: InstallPromptEvent
  }
}

const iconButton =
  'inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-foreground transition hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring'

const noopSubscribe = () => () => {}

/* ---------- theme ---------- */

function subscribeTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })
  return () => observer.disconnect()
}

const isDark = () => document.documentElement.classList.contains('dark')

/** Light / dark switch. The saved choice is applied before first paint by an inline script. */
export function ThemeToggle() {
  const { t } = useI18n()
  const dark = useSyncExternalStore(subscribeTheme, isDark, () => false)

  const toggle = () => {
    const next = !dark
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light')
    } catch {
      /* storage unavailable */
    }
    document
      .querySelector('meta[name="theme-color"][data-dynamic]')
      ?.setAttribute('content', next ? '#0f1224' : '#f4f6fb')
  }

  const label = dark ? t('themeToLight') : t('themeToDark')
  return (
    <button
      type="button"
      onClick={toggle}
      className={iconButton}
      aria-label={label}
      title={label}
    >
      {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  )
}

/* ---------- language ---------- */

export function LanguageSelect() {
  const { lang, setLang, t } = useI18n()
  return (
    <label className="relative inline-flex h-10 items-center rounded-xl border border-border bg-card text-foreground transition hover:bg-muted">
      <span className="sr-only">{t('language')}</span>
      <Globe
        aria-hidden
        className="pointer-events-none absolute start-2.5 size-4 text-muted-foreground"
      />
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as Lang)}
        className="h-full cursor-pointer appearance-none rounded-xl bg-transparent ps-8 pe-3 text-sm font-medium outline-none focus-visible:outline-2 focus-visible:outline-ring"
        aria-label={t('language')}
      >
        {languages.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </label>
  )
}

/* ---------- install as an app ---------- */

function subscribeInstall(onChange: () => void) {
  const onInstalled = () => {
    window.__installPrompt = undefined
    onChange()
  }
  window.addEventListener('install-prompt-ready', onChange)
  window.addEventListener('appinstalled', onInstalled)
  return () => {
    window.removeEventListener('install-prompt-ready', onChange)
    window.removeEventListener('appinstalled', onInstalled)
  }
}

const getPrompt = () => window.__installPrompt ?? null

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

const isIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

/** Shows an install button when the browser can install the site as an app. */
export function InstallButton() {
  const { t } = useI18n()
  const prompt = useSyncExternalStore(subscribeInstall, getPrompt, () => null)
  const standalone = useSyncExternalStore(
    noopSubscribe,
    isStandalone,
    () => true,
  )
  const ios = useSyncExternalStore(noopSubscribe, isIos, () => false)

  if (standalone || (!prompt && !ios)) return null

  const install = async () => {
    if (prompt) {
      await prompt.prompt()
      await prompt.userChoice
      window.__installPrompt = undefined
      window.dispatchEvent(new Event('install-prompt-ready'))
    } else {
      toast(t('install'), { description: t('installIos'), duration: 8000 })
    }
  }

  return (
    <button
      type="button"
      onClick={install}
      className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-ring"
    >
      <Download className="size-4" />
      <span className="hidden sm:inline">{t('install')}</span>
      <span className="sr-only sm:hidden">{t('install')}</span>
    </button>
  )
}

/** Registers the offline service worker (production builds only). */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
    const base = import.meta.env.BASE_URL
    navigator.serviceWorker
      .register(`${base}sw.js`, { scope: base })
      .catch(() => {
        /* offline support is optional */
      })
  }, [])
  return null
}
