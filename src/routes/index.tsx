import { createFileRoute } from '@tanstack/react-router'
import { useDeferredValue, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import {
  Box,
  Download,
  Image as ImageIcon,
  KeyRound,
  Layers,
  Link2,
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
  buildGeometry,
  buildMatrix,
  defaultParams,
  downloadBlob,
  export3MF,
  modelDimensions,
  type ErrorLevel,
  type ModelParams,
  type QRMatrix,
} from '@/lib/qr-model'
import type { BufferGeometry } from 'three'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/')({
  component: Home,
})

type Mode = 'url' | 'text' | 'wifi'

const filaments = [
  { name: 'Jade White', hex: '#f4f1ea' },
  { name: 'Charcoal', hex: '#1f1f22' },
  { name: 'Signal Orange', hex: '#ff6a1a' },
  { name: 'Lime', hex: '#9bd13b' },
  { name: 'Cobalt', hex: '#1f4fd1' },
  { name: 'Cherry', hex: '#c8203a' },
  { name: 'Sunflower', hex: '#f5c400' },
  { name: 'Lilac', hex: '#a98be0' },
]

function wifiString(ssid: string, password: string, security: string) {
  const esc = (v: string) => v.replace(/([\\;,:"])/g, '\\$1')
  return `WIFI:T:${security};S:${esc(ssid)};P:${esc(password)};;`
}

function Home() {
  const [mode, setMode] = useState<Mode>('url')
  const [url, setUrl] = useState(defaultParams.content)
  const [text, setText] = useState('Printed with love on my 3D printer')
  const [ssid, setSsid] = useState('')
  const [wifiPass, setWifiPass] = useState('')
  const [security, setSecurity] = useState('WPA')
  const [params, setParams] = useState<ModelParams>(defaultParams)
  const [baseColor, setBaseColor] = useState(filaments[0].hex)
  const [codeColor, setCodeColor] = useState(filaments[1].hex)

  const content =
    mode === 'url'
      ? url
      : mode === 'text'
        ? text
        : wifiString(ssid, wifiPass, security)

  const set = <K extends keyof ModelParams>(key: K, value: ModelParams[K]) =>
    setParams((p) => ({ ...p, [key]: value }))

  const input = useMemo(() => ({ ...params, content }), [params, content])
  const deferred = useDeferredValue(input)

  const model = useMemo<{
    matrix?: QRMatrix
    base?: BufferGeometry
    code?: BufferGeometry
    error?: string
  }>(() => {
    try {
      const matrix = buildMatrix(deferred.content, deferred.errorLevel)
      return { matrix, ...buildGeometry(deferred, matrix) }
    } catch {
      return {
        error:
          'That content is too long to fit in a QR code. Try shortening it.',
      }
    }
  }, [deferred])

  const dims = modelDimensions(params)
  const moduleMm = model.matrix ? params.qrSize / model.matrix.size : 0
  const ready = !!model.base && content.trim().length > 0

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
    toast.success('3MF downloaded', {
      description:
        'Base is on filament 1 and the code on filament 2 — open it in your slicer and print.',
    })
  }

  const downloadPng = async () => {
    const data = await QRCode.toDataURL(content || ' ', {
      errorCorrectionLevel: params.errorLevel,
      width: 1024,
      margin: 2,
      color: { dark: codeColor, light: baseColor },
    })
    const a = document.createElement('a')
    a.href = data
    a.download = 'qr-code.png'
    a.click()
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border/70">
        <div className="mx-auto flex max-w-(--content-width) items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4">
          <a
            href="."
            className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Box className="size-5" />
            </span>
            3D QR Generator
          </a>
          <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="hidden sm:inline">
              100% free · no account · no credits
            </span>
            <span className="sm:hidden">Free</span>
          </span>
        </div>
      </header>

      <section className="mx-auto max-w-(--content-width) px-4 pt-8 pb-6 sm:px-5 md:pt-14 md:pb-8">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-accent-strong sm:text-xs">
          QR code → printable 3D model
        </p>
        <h1 className="max-w-3xl font-display text-[2rem] font-bold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
          Turn any link into a QR tag you can{' '}
          <span className="text-accent-strong">print</span>.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:mt-5 sm:text-lg">
          Type a link, text or Wi‑Fi login, tune the plate, and download a
          two-color 3MF for your printer. Everything runs in your browser —
          free, instant, unlimited.
        </p>
      </section>

      <main className="mx-auto grid max-w-(--content-width) gap-4 px-4 pb-32 sm:px-5 lg:grid-cols-[400px_1fr] lg:gap-6 lg:pb-16">
        {/* Preview (first on phones, right column on desktop) */}
        <div className="flex flex-col gap-4 lg:col-start-2 lg:row-start-1 lg:sticky lg:top-6 lg:self-start">
          <div className="relative aspect-[5/4] overflow-hidden rounded-3xl border border-border bg-[radial-gradient(ellipse_at_top,var(--preview-glow),var(--preview-bg)_70%)] sm:aspect-[4/3] lg:aspect-auto lg:h-[560px]">
            {model.base && model.code ? (
              <ModelPreview
                base={model.base}
                code={model.code}
                baseColor={baseColor}
                codeColor={codeColor}
                extent={dims.height}
              />
            ) : (
              <div className="grid h-full place-items-center p-8 text-center text-sm text-muted-foreground">
                {model.error}
              </div>
            )}
            <div className="pointer-events-none absolute top-3 left-3 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-1.5 font-mono text-[11px] sm:top-4 sm:left-4 sm:gap-2 sm:text-xs">
              <Chip>
                {dims.width.toFixed(1)} × {dims.height.toFixed(1)} ×{' '}
                {dims.depth.toFixed(1)} mm
              </Chip>
              {model.matrix && (
                <Chip>
                  {model.matrix.size}×{model.matrix.size} modules ·{' '}
                  {moduleMm.toFixed(2)} mm each
                </Chip>
              )}
            </div>
            {moduleMm > 0 && moduleMm < 0.8 && (
              <div className="absolute right-3 bottom-3 left-3 rounded-xl bg-amber-100 px-3 py-2 text-sm text-amber-900 sm:right-4 sm:bottom-4 sm:left-4">
                Modules are under 0.8 mm — increase the QR size or shorten the
                content for a reliable scan.
              </div>
            )}
          </div>

          {/* Download bar: pinned to the bottom on phones */}
          <div className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-[1fr_auto] gap-2 border-t border-border bg-card/90 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:static lg:z-auto lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
            <Button
              size="lg"
              className="h-12 text-base lg:h-10 lg:text-sm"
              disabled={!ready}
              onClick={download}
            >
              <Download /> Download 3MF (2 colors)
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="h-12 px-5 text-base lg:h-10 lg:text-sm"
              disabled={!ready}
              onClick={downloadPng}
              aria-label="Download PNG"
            >
              <ImageIcon /> PNG
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-6 rounded-3xl border border-border bg-card p-4 sm:p-5 lg:col-start-1 lg:row-start-1">
          <div>
            <StepLabel n={1}>Content</StepLabel>
            <div className="mb-3 grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
              {(
                [
                  ['url', 'Link', Link2],
                  ['text', 'Text', Type],
                  ['wifi', 'Wi‑Fi', Wifi],
                ] as const
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMode(id)}
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
                className="h-11"
              />
            )}
            {mode === 'text' && (
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
              />
            )}
            {mode === 'wifi' && (
              <div className="space-y-2">
                <Input
                  value={ssid}
                  onChange={(e) => setSsid(e.target.value)}
                  placeholder="Network name (SSID)"
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="h-11"
                />
                <Input
                  value={wifiPass}
                  onChange={(e) => setWifiPass(e.target.value)}
                  placeholder="Password"
                  type="text"
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="h-11"
                />
                <select
                  value={security}
                  onChange={(e) => setSecurity(e.target.value)}
                  className="h-11 w-full rounded-md border border-input bg-card px-3 text-sm"
                >
                  <option value="WPA">WPA / WPA2 / WPA3</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">Open network</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <StepLabel n={2}>Plate</StepLabel>
            <div className="space-y-3">
              <Slider
                label="QR size"
                unit="mm"
                min={20}
                max={120}
                step={1}
                value={params.qrSize}
                onChange={(v) => set('qrSize', v)}
              />
              <Slider
                label="Border"
                unit="mm"
                min={1}
                max={12}
                step={0.5}
                value={params.margin}
                onChange={(v) => set('margin', v)}
              />
              <Slider
                label="Base thickness"
                unit="mm"
                min={0.8}
                max={6}
                step={0.2}
                value={params.baseThickness}
                onChange={(v) => set('baseThickness', v)}
              />
              <Slider
                label="Code height"
                unit="mm"
                min={0.4}
                max={3}
                step={0.2}
                value={params.qrHeight}
                onChange={(v) => set('qrHeight', v)}
              />
              <Slider
                label="Corner radius"
                unit="mm"
                min={0}
                max={12}
                step={0.5}
                value={params.cornerRadius}
                onChange={(v) => set('cornerRadius', v)}
              />
              <div className="flex min-h-11 items-center justify-between">
                <Label
                  htmlFor="keychain"
                  className="flex items-center gap-2 text-sm"
                >
                  <KeyRound className="size-4 text-muted-foreground" /> Keychain
                  loop
                </Label>
                <Switch
                  id="keychain"
                  checked={params.keychain}
                  onCheckedChange={(v) => set('keychain', v)}
                />
              </div>
              <div>
                <div className="mb-1.5 text-sm font-medium">
                  Error correction
                </div>
                <div className="grid grid-cols-4 gap-1 rounded-xl bg-muted p-1">
                  {(['L', 'M', 'Q', 'H'] as ErrorLevel[]).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => set('errorLevel', lvl)}
                      className={cn(
                        'min-h-10 rounded-lg text-sm font-medium transition',
                        params.errorLevel === lvl
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <StepLabel n={3}>Filament colors</StepLabel>
            <Swatches label="Base" value={baseColor} onChange={setBaseColor} />
            <Swatches label="Code" value={codeColor} onChange={setCodeColor} />
          </div>
        </div>
      </main>

      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto grid max-w-(--content-width) gap-8 px-4 py-10 sm:px-5 md:grid-cols-3 md:py-14">
          {[
            {
              icon: Printer,
              title: 'One file, two colors',
              body: 'The 3MF holds the base and the code as two parts of one object, already assigned to filament 1 and filament 2. Open it in Bambu Studio, Orca or PrusaSlicer and print.',
            },
            {
              icon: Layers,
              title: 'Single-color printer?',
              body: 'Print the same 3MF with one filament, then add a pause at the first code layer to swap filament for instant contrast.',
            },
            {
              icon: Box,
              title: 'Built to scan',
              body: 'Keep modules above ~1 mm, use a light base with a dark code, and pick H error correction if your tag will get scuffed.',
            },
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
        3D QR Generator — a free, open tool for makers. Models are generated
        locally in your browser; nothing is uploaded.
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
    <span className="rounded-lg bg-card/80 px-2 py-1 shadow-sm backdrop-blur">
      {children}
    </span>
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
      <div className="mb-0.5 flex justify-between text-sm">
        <span className="font-medium">{props.label}</span>
        <span className="font-mono text-muted-foreground">
          {props.value} {props.unit}
        </span>
      </div>
      <input
        type="range"
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
  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <span className="w-10 text-sm text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-2">
        {filaments.map((f) => (
          <button
            key={f.hex}
            type="button"
            title={f.name}
            aria-label={`${label}: ${f.name}`}
            onClick={() => onChange(f.hex)}
            className={cn(
              'size-9 rounded-full border border-white/20 transition lg:size-7',
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
