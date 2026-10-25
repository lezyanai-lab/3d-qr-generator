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
    mode === 'url' ? url : mode === 'text' ? text : wifiString(ssid, wifiPass, security)

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
      return { error: 'That content is too long to fit in a QR code. Try shortening it.' }
    }
  }, [deferred])

  const dims = modelDimensions(params)
  const moduleMm = model.matrix ? params.qrSize / model.matrix.size : 0
  const ready = !!model.base && content.trim().length > 0

  const colorName = (hex: string) => filaments.find((f) => f.hex === hex)?.name ?? hex

  const download = () => {
    if (!model.base || !model.code) return
    downloadBlob(
      export3MF([
        { name: `Base (${colorName(baseColor)})`, geometry: model.base, color: baseColor },
        { name: `Code (${colorName(codeColor)})`, geometry: model.code, color: codeColor },
      ]),
      'qr-code.3mf',
    )
    toast.success('3MF downloaded', {
      description: 'Base is on filament 1 and the code on filament 2 — open it in your slicer and print.',
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
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/70">
        <div className="mx-auto flex max-w-(--content-width) items-center justify-between px-5 py-4">
          <a href="/" className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight">
            <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
              <Layers className="size-4" />
            </span>
            QR Forge
          </a>
          <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
            100% free · no account · no credits
          </span>
        </div>
      </header>

      <section className="mx-auto max-w-(--content-width) px-5 pt-12 pb-8 md:pt-16">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-accent-strong">
          QR code → printable 3D model
        </p>
        <h1 className="max-w-3xl font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
          Turn any link into a QR tag you can hold.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          Type a link, text or Wi‑Fi login, tune the plate, and download a two-color 3MF for your printer.
          Everything runs in your browser — free, instant, unlimited.
        </p>
      </section>

      <main className="mx-auto grid max-w-(--content-width) gap-6 px-5 pb-16 lg:grid-cols-[380px_1fr]">
        {/* Controls */}
        <div className="space-y-5 rounded-2xl border border-border bg-card p-5">
          <div>
            <StepLabel n={1}>Content</StepLabel>
            <div className="mb-3 grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
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
                    'flex items-center justify-center gap-1.5 rounded-md py-1.5 text-sm font-medium transition',
                    mode === id ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon className="size-3.5" /> {label}
                </button>
              ))}
            </div>
            {mode === 'url' && (
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
            )}
            {mode === 'text' && (
              <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} />
            )}
            {mode === 'wifi' && (
              <div className="space-y-2">
                <Input value={ssid} onChange={(e) => setSsid(e.target.value)} placeholder="Network name (SSID)" />
                <Input
                  value={wifiPass}
                  onChange={(e) => setWifiPass(e.target.value)}
                  placeholder="Password"
                  type="text"
                />
                <select
                  value={security}
                  onChange={(e) => setSecurity(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
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
            <div className="space-y-4">
              <Slider label="QR size" unit="mm" min={20} max={120} step={1} value={params.qrSize} onChange={(v) => set('qrSize', v)} />
              <Slider label="Border" unit="mm" min={1} max={12} step={0.5} value={params.margin} onChange={(v) => set('margin', v)} />
              <Slider label="Base thickness" unit="mm" min={0.8} max={6} step={0.2} value={params.baseThickness} onChange={(v) => set('baseThickness', v)} />
              <Slider label="Code height" unit="mm" min={0.4} max={3} step={0.2} value={params.qrHeight} onChange={(v) => set('qrHeight', v)} />
              <Slider label="Corner radius" unit="mm" min={0} max={12} step={0.5} value={params.cornerRadius} onChange={(v) => set('cornerRadius', v)} />
              <div className="flex items-center justify-between">
                <Label htmlFor="keychain" className="flex items-center gap-2">
                  <KeyRound className="size-4 text-muted-foreground" /> Keychain loop
                </Label>
                <Switch id="keychain" checked={params.keychain} onCheckedChange={(v) => set('keychain', v)} />
              </div>
              <div>
                <div className="mb-1.5 text-sm font-medium">Error correction</div>
                <div className="grid grid-cols-4 gap-1 rounded-lg bg-muted p-1">
                  {(['L', 'M', 'Q', 'H'] as ErrorLevel[]).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => set('errorLevel', lvl)}
                      className={cn(
                        'rounded-md py-1 text-sm font-medium transition',
                        params.errorLevel === lvl ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground',
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

        {/* Preview */}
        <div className="flex flex-col gap-4">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-[radial-gradient(ellipse_at_top,var(--preview-glow),var(--preview-bg)_70%)] lg:aspect-auto lg:min-h-[520px] lg:flex-1">
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
            <div className="pointer-events-none absolute top-4 left-4 flex flex-wrap gap-2 font-mono text-xs">
              <Chip>
                {dims.width.toFixed(1)} × {dims.height.toFixed(1)} × {dims.depth.toFixed(1)} mm
              </Chip>
              {model.matrix && (
                <Chip>
                  {model.matrix.size}×{model.matrix.size} modules · {moduleMm.toFixed(2)} mm each
                </Chip>
              )}
            </div>
            {moduleMm > 0 && moduleMm < 0.8 && (
              <div className="absolute right-4 bottom-4 left-4 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-900">
                Modules are under 0.8 mm — increase the QR size or shorten the content for a reliable scan.
              </div>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <Button size="lg" disabled={!ready} onClick={download}>
              <Download /> Download 3MF (2 colors)
            </Button>
            <Button size="lg" variant="ghost" disabled={!ready} onClick={downloadPng} aria-label="Download PNG">
              <ImageIcon /> PNG
            </Button>
          </div>
        </div>
      </main>

      <section className="border-t border-border bg-muted/40">
        <div className="mx-auto grid max-w-(--content-width) gap-8 px-5 py-14 md:grid-cols-3">
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
              <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto max-w-(--content-width) px-5 py-8 text-xs text-muted-foreground">
        QR Forge — a free, open tool for makers. Models are generated locally in your browser; nothing is uploaded.
      </footer>
    </div>
  )
}

function StepLabel({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
      <span className="grid size-5 place-items-center rounded-full bg-primary font-mono text-[11px] text-primary-foreground">
        {n}
      </span>
      {children}
    </div>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-md bg-card/85 px-2 py-1 shadow-sm backdrop-blur">{children}</span>
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
      <div className="mb-1 flex justify-between text-sm">
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

function Swatches({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className="w-10 text-sm text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {filaments.map((f) => (
          <button
            key={f.hex}
            type="button"
            title={f.name}
            aria-label={`${label}: ${f.name}`}
            onClick={() => onChange(f.hex)}
            className={cn(
              'size-7 rounded-full border border-black/10 transition',
              value === f.hex && 'ring-2 ring-(--accent-strong) ring-offset-2 ring-offset-card',
            )}
            style={{ backgroundColor: f.hex }}
          />
        ))}
      </div>
    </div>
  )
}
