import { createFileRoute } from '@tanstack/react-router'
import { useDeferredValue, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import {
  AlertTriangle,
  Box,
  Download,
  Image as ImageIcon,
  KeyRound,
  Layers,
  Link2,
  MessageCircle,
  Printer,
  Type,
  Wifi,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ModelPreview } from '@/components/model-preview'
import {
  InstallButton,
  LanguageSelect,
  ThemeToggle,
} from '@/components/app-controls'
import {
  MIN_MODULE_MM,
  QUIET_MODULES,
  buildGeometry,
  buildMatrix,
  defaultParams,
  downloadBlob,
  export3MF,
  minMargin,
  modelDimensions,
  resolveParams,
  type ErrorLevel,
  type LoopSide,
  type ModelParams,
  type QRMatrix,
} from '@/lib/qr-model'
import {
  DEFAULT_COUNTRY_CODE,
  normalizeUrl,
  whatsappDigits,
  whatsappLink,
  wifiString,
} from '@/lib/qr-content'
import { useI18n, type Key } from '@/lib/i18n'
import type { BufferGeometry } from 'three'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/')({
  component: Home,
})

type Mode = 'url' | 'text' | 'wifi' | 'whatsapp'

// `name` is only used inside the exported 3MF (slicers show it), so it stays English.
const filaments = [
  { name: 'White', hex: '#f4f1ea', key: 'c0' },
  { name: 'Charcoal', hex: '#1f1f22', key: 'c1' },
  { name: 'Orange', hex: '#ff6a1a', key: 'c2' },
  { name: 'Lime', hex: '#9bd13b', key: 'c3' },
  { name: 'Blue', hex: '#1f4fd1', key: 'c4' },
  { name: 'Red', hex: '#c8203a', key: 'c5' },
  { name: 'Yellow', hex: '#f5c400', key: 'c6' },
  { name: 'Purple', hex: '#a98be0', key: 'c7' },
] as const satisfies readonly { name: string; hex: string; key: Key }[]

const loopSides: { id: LoopSide; key: Key }[] = [
  { id: 'top', key: 'sideTop' },
  { id: 'right', key: 'sideRight' },
  { id: 'bottom', key: 'sideBottom' },
  { id: 'left', key: 'sideLeft' },
]

const errorLevels: { id: ErrorLevel; key: Key }[] = [
  { id: 'L', key: 'ecL' },
  { id: 'M', key: 'ecM' },
  { id: 'Q', key: 'ecQ' },
  { id: 'H', key: 'ecH' },
]

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrastRatio(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

function Home() {
  const { t } = useI18n()
  const [mode, setMode] = useState<Mode>('url')
  const [url, setUrl] = useState(defaultParams.content)
  const [text, setText] = useState('Printed with love on my 3D printer')
  const [ssid, setSsid] = useState('')
  const [wifiPass, setWifiPass] = useState('')
  const [security, setSecurity] = useState('WPA')
  const [waCountry, setWaCountry] = useState(DEFAULT_COUNTRY_CODE)
  const [waNumber, setWaNumber] = useState('')
  const [waMessage, setWaMessage] = useState('')
  const [params, setParams] = useState<ModelParams>(defaultParams)
  const [baseColor, setBaseColor] = useState<string>(filaments[0].hex)
  const [codeColor, setCodeColor] = useState<string>(filaments[1].hex)

  const waDigits = whatsappDigits(waCountry, waNumber)
  const content =
    mode === 'url'
      ? normalizeUrl(url)
      : mode === 'text'
        ? text
        : mode === 'wifi'
          ? wifiString(ssid, wifiPass, security)
          : whatsappLink(waCountry, waNumber, waMessage)

  const set = <K extends keyof ModelParams>(key: K, value: ModelParams[K]) =>
    setParams((p) => ({ ...p, [key]: value }))

  const input = useMemo(() => ({ ...params, content }), [params, content])
  const deferred = useDeferredValue(input)

  const model = useMemo<{
    matrix?: QRMatrix
    base?: BufferGeometry
    code?: BufferGeometry
    error?: Key
  }>(() => {
    try {
      const matrix = buildMatrix(deferred.content, deferred.errorLevel)
      // The border is never thinner than the quiet zone scanners need.
      const printed = resolveParams(deferred, matrix.size)
      return { matrix, ...buildGeometry(printed, matrix) }
    } catch {
      return { error: 'tooLong' }
    }
  }, [deferred])

  const quietMin = model.matrix
    ? minMargin(params.qrSize, model.matrix.size)
    : 1
  const margin = Math.max(params.margin, quietMin)
  const dims = modelDimensions({ ...params, margin })
  const moduleMm = model.matrix ? params.qrSize / model.matrix.size : 0
  const ready =
    !!model.base &&
    content.trim().length > 0 &&
    (mode !== 'wifi' || ssid.trim().length > 0)
  const contrast = contrastRatio(baseColor, codeColor)
  const sameColors = contrast < 1.5
  const lowContrast = !sameColors && contrast < 3
  const inverted =
    !sameColors && !lowContrast && luminance(codeColor) > luminance(baseColor)

  const side = params.qrSize + margin * 2
  const maxOffset = Math.max(0, side / 2 - 4)
  const loopOffset = Math.max(
    -maxOffset,
    Math.min(maxOffset, params.loopOffset),
  )

  const colorName = (hex: string) =>
    filaments.find((f) => f.hex === hex)?.name ?? hex

  const download = () => {
    if (!model.base || !model.code) return
    downloadBlob(
      export3MF([
        {
          name: `Base (${colorName(baseColor)})`,
          geometry: model.base,
          color: baseColor,
        },
        {
          name: `Code (${colorName(codeColor)})`,
          geometry: model.code,
          color: codeColor,
        },
      ]),
      'qr-code.3mf',
    )
    toast.success(t('toastTitle'), { description: t('toastDesc') })
  }

  const downloadPng = async () => {
    const data = await QRCode.toDataURL(content || ' ', {
      errorCorrectionLevel: params.errorLevel,
      width: 1024,
      margin: QUIET_MODULES,
      color: { dark: codeColor, light: baseColor },
    })
    const a = document.createElement('a')
    a.href = data
    a.download = 'qr-code.png'
    a.click()
  }

  const [titleBefore, titleAfter] = t('heroTitle').split('{0}')

  return (
    <div className="min-h-dvh overflow-x-clip bg-background text-foreground">
      <header className="border-b border-border/70">
        <div className="mx-auto flex max-w-(--content-width) items-center justify-between gap-2 px-4 py-3 sm:px-5 sm:py-4">
          <a
            href="."
            className="flex min-w-0 items-center gap-2.5 font-display text-base font-bold tracking-tight sm:text-lg"
          >
            <img
              src={`${import.meta.env.BASE_URL}icon-192.png`}
              alt=""
              width={36}
              height={36}
              className="size-9 shrink-0 rounded-xl"
            />
            <span className="truncate">3D QR Generator</span>
          </a>
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground xl:inline">
              {t('freeLong')}
            </span>
            <InstallButton />
            <LanguageSelect />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-(--content-width) px-4 pt-6 pb-4 sm:px-5 sm:pt-10 md:pt-14 md:pb-8">
        <p className="mb-2 font-mono text-[11px] tracking-[0.14em] text-accent-strong uppercase sm:mb-3 sm:text-xs">
          {t('eyebrow')}
        </p>
        <h1 className="max-w-3xl font-display text-[1.65rem] leading-[1.15] font-bold tracking-tight sm:text-5xl md:text-6xl">
          {titleBefore}
          <span className="text-accent-strong">{t('heroHighlight')}</span>
          {titleAfter}
        </h1>
        <p className="mt-4 hidden max-w-2xl text-lg text-muted-foreground sm:mt-5 sm:block">
          {t('heroText')}
        </p>
      </section>

      <main className="mx-auto grid max-w-(--content-width) grid-cols-[minmax(0,1fr)] gap-4 px-4 pb-32 sm:px-5 lg:grid-cols-[400px_minmax(0,1fr)] lg:gap-6 lg:pb-16">
        {/* Preview (first on phones, side column on desktop) */}
        <div className="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-start-1 lg:sticky lg:top-6 lg:self-start">
          <div className="relative aspect-[5/4] overflow-hidden rounded-3xl border border-border bg-[radial-gradient(ellipse_at_top,var(--preview-glow),var(--preview-bg)_70%)] sm:aspect-[4/3] lg:aspect-auto lg:h-[560px]">
            {model.base && model.code ? (
              <ModelPreview
                base={model.base}
                code={model.code}
                baseColor={baseColor}
                codeColor={codeColor}
                extent={Math.max(dims.width, dims.height)}
              />
            ) : (
              <div className="grid h-full place-items-center p-8 text-center text-sm text-muted-foreground">
                {model.error && t(model.error)}
              </div>
            )}
            <div className="pointer-events-none absolute start-3 top-3 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-1.5 font-mono text-[11px] sm:start-4 sm:top-4 sm:gap-2 sm:text-xs">
              <Chip>
                {t('sizeTotal', {
                  w: dims.width.toFixed(1),
                  h: dims.height.toFixed(1),
                  d: dims.depth.toFixed(1),
                })}
              </Chip>
              {model.matrix && (
                <Chip>
                  {t('modulesInfo', {
                    n: model.matrix.size,
                    mm: moduleMm.toFixed(2),
                  })}
                </Chip>
              )}
            </div>
            <div className="absolute inset-x-3 bottom-3 flex flex-col gap-2 sm:inset-x-4 sm:bottom-4">
              {moduleMm > 0 && moduleMm < MIN_MODULE_MM && (
                <Warning>{t('smallModules')}</Warning>
              )}
              {sameColors && <Warning>{t('sameColors')}</Warning>}
              {lowContrast && <Warning>{t('lowContrast')}</Warning>}
              {inverted && <Warning>{t('invertedColors')}</Warning>}
            </div>
          </div>

          {/* Download bar: pinned to the bottom on phones */}
          <div className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-[1fr_auto] gap-2 border-t border-border bg-card/90 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:static lg:z-auto lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
            <Button
              size="lg"
              className="h-12 text-base lg:h-10 lg:text-sm"
              disabled={!ready}
              onClick={download}
            >
              <Download /> {t('download3mf')}
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="h-12 px-5 text-base lg:h-10 lg:text-sm"
              disabled={!ready}
              onClick={downloadPng}
              aria-label={t('downloadPngAria')}
            >
              <ImageIcon /> PNG
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="min-w-0 space-y-6 rounded-3xl border border-border bg-card p-4 sm:p-5 lg:col-start-1 lg:row-start-1">
          <div>
            <StepLabel n={1}>{t('step1')}</StepLabel>
            <div className="mb-3 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
              {(
                [
                  ['url', t('tabLink'), Link2],
                  ['text', t('tabText'), Type],
                  ['wifi', t('tabWifi'), Wifi],
                  ['whatsapp', t('tabWhatsapp'), MessageCircle],
                ] as const
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMode(id)}
                  aria-pressed={mode === id}
                  className={cn(
                    'flex min-h-11 items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition',
                    mode === id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon className="size-4" /> {label}
                </button>
              ))}
            </div>
            {mode === 'url' && (
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…"
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                dir="ltr"
                className="h-11"
              />
            )}
            {mode === 'text' && (
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                dir="auto"
              />
            )}
            {mode === 'wifi' && (
              <div className="space-y-2">
                <Input
                  value={ssid}
                  onChange={(e) => setSsid(e.target.value)}
                  placeholder={t('wifiSsid')}
                  autoCapitalize="none"
                  autoCorrect="off"
                  dir="auto"
                  className="h-11"
                />
                <Input
                  value={wifiPass}
                  onChange={(e) => setWifiPass(e.target.value)}
                  placeholder={t('wifiPass')}
                  type="text"
                  autoCapitalize="none"
                  autoCorrect="off"
                  dir="auto"
                  className="h-11"
                />
                <select
                  value={security}
                  onChange={(e) => setSecurity(e.target.value)}
                  className="h-11 w-full rounded-md border border-input bg-card px-3 text-sm"
                >
                  <option value="WPA">WPA / WPA2 / WPA3</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">{t('secOpen')}</option>
                </select>
              </div>
            )}
            {mode === 'whatsapp' && (
              <div className="space-y-2">
                {/* Phone numbers read left to right in every language. */}
                <div
                  className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-2"
                  dir="ltr"
                >
                  <div className="relative">
                    <span
                      aria-hidden
                      className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      +
                    </span>
                    <Input
                      value={waCountry}
                      onChange={(e) => setWaCountry(e.target.value)}
                      placeholder={DEFAULT_COUNTRY_CODE}
                      aria-label={t('waCountry')}
                      title={t('waCountry')}
                      inputMode="tel"
                      autoComplete="tel-country-code"
                      className="h-11 ps-6"
                    />
                  </div>
                  <Input
                    value={waNumber}
                    onChange={(e) => setWaNumber(e.target.value)}
                    placeholder="050-123-4567"
                    aria-label={t('waNumber')}
                    inputMode="tel"
                    autoComplete="tel-national"
                    className="h-11"
                  />
                </div>
                <Textarea
                  value={waMessage}
                  onChange={(e) => setWaMessage(e.target.value)}
                  placeholder={t('waMessage')}
                  aria-label={t('waMessage')}
                  rows={2}
                  dir="auto"
                />
                {!waNumber.trim() ? (
                  <p className="text-xs text-muted-foreground">{t('waHint')}</p>
                ) : waDigits ? (
                  <p
                    dir="ltr"
                    className="font-mono text-xs break-all text-muted-foreground"
                  >
                    {content}
                  </p>
                ) : (
                  <p role="alert" className="text-sm text-destructive">
                    {t('waInvalid')}
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <StepLabel n={2}>{t('step2')}</StepLabel>
            <div className="space-y-3">
              <Slider
                label={t('qrSize')}
                unit="mm"
                min={20}
                max={120}
                step={1}
                value={params.qrSize}
                onChange={(v) => set('qrSize', v)}
              />
              <div>
                <Slider
                  label={t('border')}
                  unit="mm"
                  min={Math.max(1, quietMin)}
                  max={Math.max(12, quietMin)}
                  step={0.5}
                  value={margin}
                  onChange={(v) => set('margin', v)}
                />
                {quietMin > params.margin && (
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {t('quietZoneNote')}
                  </p>
                )}
              </div>
              <Slider
                label={t('baseThickness')}
                unit="mm"
                min={0.8}
                max={6}
                step={0.2}
                value={params.baseThickness}
                onChange={(v) => set('baseThickness', v)}
              />
              <Slider
                label={t('codeHeight')}
                unit="mm"
                min={0.4}
                max={3}
                step={0.2}
                value={params.qrHeight}
                onChange={(v) => set('qrHeight', v)}
              />
              <Slider
                label={t('cornerRadius')}
                unit="mm"
                min={0}
                max={12}
                step={0.5}
                value={params.cornerRadius}
                onChange={(v) => set('cornerRadius', v)}
              />
              <div>
                <Slider
                  label={t('compensation')}
                  unit="mm"
                  min={0}
                  max={0.2}
                  step={0.01}
                  value={params.inset}
                  onChange={(v) => set('inset', v)}
                />
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {t('compensationHint')}
                </p>
              </div>

              <div className="rounded-2xl border border-border p-3">
                <div className="flex min-h-11 items-center justify-between gap-3">
                  <Label
                    htmlFor="keychain"
                    className="flex items-center gap-2 text-sm"
                  >
                    <KeyRound className="size-4 text-muted-foreground" />{' '}
                    {t('keychain')}
                  </Label>
                  <Switch
                    id="keychain"
                    checked={params.keychain}
                    onCheckedChange={(v) => set('keychain', v)}
                  />
                </div>
                {params.keychain && (
                  <div className="mt-2 space-y-3 border-t border-border pt-3">
                    <div>
                      <div className="mb-1.5 text-sm font-medium">
                        {t('loopSide')}
                      </div>
                      <div className="grid grid-cols-4 gap-1 rounded-xl bg-muted p-1">
                        {loopSides.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => set('loopSide', s.id)}
                            aria-pressed={params.loopSide === s.id}
                            className={cn(
                              'min-h-10 rounded-lg px-1 text-sm font-medium transition',
                              params.loopSide === s.id
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground',
                            )}
                          >
                            {t(s.key)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <Slider
                      label={t('loopOffset')}
                      unit="mm"
                      min={-maxOffset}
                      max={maxOffset}
                      step={0.5}
                      value={loopOffset}
                      onChange={(v) => set('loopOffset', v)}
                    />
                    <Slider
                      label={t('loopGap')}
                      unit="mm"
                      min={1}
                      max={8}
                      step={0.5}
                      value={params.loopGap}
                      onChange={(v) => set('loopGap', v)}
                    />
                  </div>
                )}
              </div>

              <div>
                <div className="mb-1.5 text-sm font-medium">
                  {t('errorCorrection')}
                </div>
                <div
                  className="grid grid-cols-4 gap-1 rounded-xl bg-muted p-1"
                  dir="ltr"
                >
                  {errorLevels.map(({ id }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => set('errorLevel', id)}
                      aria-pressed={params.errorLevel === id}
                      className={cn(
                        'min-h-10 rounded-lg text-sm font-semibold transition',
                        params.errorLevel === id
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {id}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {t(
                    errorLevels.find((l) => l.id === params.errorLevel)?.key ??
                      'ecM',
                  )}
                </p>
              </div>
            </div>
          </div>

          <div>
            <StepLabel n={3}>{t('step3')}</StepLabel>
            <Swatches
              label={t('base')}
              value={baseColor}
              onChange={setBaseColor}
            />
            <Swatches
              label={t('code')}
              value={codeColor}
              onChange={setCodeColor}
            />
          </div>
        </div>
      </main>

      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto grid max-w-(--content-width) gap-8 px-4 py-10 sm:px-5 md:grid-cols-3 md:py-14">
          {[
            { icon: Printer, title: t('tip1Title'), body: t('tip1Body') },
            { icon: Layers, title: t('tip2Title'), body: t('tip2Body') },
            { icon: Box, title: t('tip3Title'), body: t('tip3Body') },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title}>
              <Icon className="mb-3 size-5 text-accent-strong" />
              <h3 className="mb-1.5 font-display font-semibold">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto max-w-(--content-width) px-4 py-8 pb-28 text-xs text-muted-foreground sm:px-5 lg:pb-8">
        {t('footer')}
      </footer>
    </div>
  )
}

function StepLabel({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2 text-base font-semibold">
      <span className="grid size-6 place-items-center rounded-full bg-primary font-mono text-xs text-primary-foreground">
        {n}
      </span>
      {children}
    </div>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-lg bg-card/80 px-2 py-1 text-foreground shadow-sm backdrop-blur">
      {children}
    </span>
  )
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-xl bg-amber-100 px-3 py-2 text-sm text-amber-900"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </div>
  )
}

function Slider(props: {
  label: string
  unit: string
  min: number
  max: number
  step: number
  value: number
  onChange: (v: number) => void
}) {
  return (
    <label className="block">
      <div className="mb-0.5 flex justify-between gap-3 text-sm">
        <span className="font-medium">{props.label}</span>
        <span dir="ltr" className="font-mono text-muted-foreground">
          {props.value} {props.unit}
        </span>
      </div>
      <input
        type="range"
        dir="ltr"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
        className="w-full accent-(--accent-strong)"
      />
    </label>
  )
}

function Swatches({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  const { t } = useI18n()
  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <span className="w-12 shrink-0 text-sm text-muted-foreground">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">
        {filaments.map((f) => (
          <button
            key={f.hex}
            type="button"
            title={t(f.key)}
            aria-label={`${label}: ${t(f.key)}`}
            aria-pressed={value === f.hex}
            onClick={() => onChange(f.hex)}
            className={cn(
              'size-9 rounded-full border border-foreground/25 transition lg:size-7',
              value === f.hex &&
                'ring-2 ring-(--accent-strong) ring-offset-2 ring-offset-card',
            )}
            style={{ backgroundColor: f.hex }}
          />
        ))}
      </div>
    </div>
  )
}
