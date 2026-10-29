import jsQR from 'jsqr'
import { describe, expect, it } from 'vitest'

import {
  QUIET_MODULES,
  buildMatrix,
  codeRects,
  defaultParams,
  minMargin,
  resolveParams,
  type ErrorLevel,
  type Rect,
} from '@/lib/qr-model'
import { whatsappLink, wifiString } from '@/lib/qr-content'

const PX_PER_MM = 12

/** Draws the printed dark areas black on a white plate, like a flat photo of the tag. */
function rasterize(rects: Rect[], qrSize: number, margin: number) {
  const side = qrSize + margin * 2
  const width = Math.round(side * PX_PER_MM)
  const data = new Uint8ClampedArray(width * width * 4).fill(255)
  const px = (mm: number) => Math.round(mm * PX_PER_MM)
  for (const q of rects) {
    for (let y = px(side / 2 - q.y1); y < px(side / 2 - q.y0); y++) {
      for (let x = px(q.x0 + side / 2); x < px(q.x1 + side / 2); x++) {
        const i = (y * width + x) * 4
        data[i] = data[i + 1] = data[i + 2] = 0
      }
    }
  }
  return { data, width }
}

const samples = [
  ['WhatsApp link', whatsappLink('972', '050-123-4567', '')],
  [
    'WhatsApp link with Hebrew message',
    whatsappLink('972', '050-123-4567', 'שלום, אשמח לפרטים'),
  ],
  [
    'long URL',
    'https://example.com/products/3d-printed-keychain?ref=tag&utm=qr',
  ],
  ['Wi-Fi login', wifiString('Home Net', 'correct horse battery', 'WPA')],
] as const

describe('printed code is still a valid QR code', () => {
  const qrSize = defaultParams.qrSize

  describe.each(samples)('%s', (_name, content) => {
    it.each([0, 0.05, 0.1, 0.2])('decodes with %s mm compensation', (inset) => {
      const matrix = buildMatrix(content, 'M')
      const params = resolveParams(
        { ...defaultParams, content, inset },
        matrix.size,
      )
      const { data, width } = rasterize(
        codeRects(params, matrix),
        qrSize,
        params.margin,
      )
      expect(jsQR(data, width, width)?.data).toBe(content)
    })

    it.each<ErrorLevel>(['L', 'M', 'Q', 'H'])(
      'decodes at level %s',
      (level) => {
        const matrix = buildMatrix(content, level)
        const params = resolveParams(
          { ...defaultParams, content, errorLevel: level },
          matrix.size,
        )
        const { data, width } = rasterize(
          codeRects(params, matrix),
          qrSize,
          params.margin,
        )
        expect(jsQR(data, width, width)?.data).toBe(content)
      },
    )
  })
})

describe('codeRects', () => {
  const matrix = buildMatrix('https://wa.me/972501234567', 'M')
  const area = (rects: Rect[]) =>
    rects.reduce((sum, q) => sum + (q.x1 - q.x0) * (q.y1 - q.y0), 0)

  it('covers exactly the dark modules when there is no compensation', () => {
    let dark = 0
    for (let r = 0; r < matrix.size; r++)
      for (let c = 0; c < matrix.size; c++) if (matrix.isDark(r, c)) dark++
    const m = defaultParams.qrSize / matrix.size
    const rects = codeRects({ qrSize: defaultParams.qrSize, inset: 0 }, matrix)
    expect(area(rects)).toBeCloseTo(dark * m * m, 6)
  })

  it('shrinks the dark area when compensation is on, never to nothing', () => {
    const plain = area(codeRects({ qrSize: 40, inset: 0 }, matrix))
    const shrunk = area(codeRects({ qrSize: 40, inset: 0.1 }, matrix))
    expect(shrunk).toBeLessThan(plain)
    expect(shrunk).toBeGreaterThan(plain * 0.7)
  })

  it('caps the compensation at a tenth of a module per side', () => {
    const m = 40 / matrix.size
    const rects = codeRects({ qrSize: 40, inset: 5 }, matrix)
    for (const q of rects) {
      expect(q.x1 - q.x0).toBeGreaterThanOrEqual(m * 0.8 - 1e-9)
      expect(q.y1 - q.y0).toBeGreaterThanOrEqual(m * 0.8 - 1e-9)
    }
  })

  it('keeps every rectangle inside the code area', () => {
    for (const q of codeRects({ qrSize: 40, inset: 0.1 }, matrix)) {
      expect(q.x0).toBeGreaterThanOrEqual(-20)
      expect(q.x1).toBeLessThanOrEqual(20)
      expect(q.y0).toBeGreaterThanOrEqual(-20)
      expect(q.y1).toBeLessThanOrEqual(20)
    }
  })
})

describe('quiet zone', () => {
  it('is four modules wide', () => {
    expect(QUIET_MODULES).toBe(4)
    // 40 mm over 25 modules is 1.6 mm per module, so 6.4 mm rounded up to 6.5.
    expect(minMargin(40, 25)).toBe(6.5)
  })

  it('raises a border that is too thin and leaves a wide one alone', () => {
    expect(resolveParams({ ...defaultParams, margin: 1 }, 25).margin).toBe(6.5)
    expect(resolveParams({ ...defaultParams, margin: 10 }, 25).margin).toBe(10)
  })
})
