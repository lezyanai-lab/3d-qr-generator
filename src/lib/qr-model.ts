import QRCode from 'qrcode'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { strToU8, zipSync } from 'three/examples/jsm/libs/fflate.module.js'

export type ErrorLevel = 'L' | 'M' | 'Q' | 'H'
export type LoopSide = 'top' | 'right' | 'bottom' | 'left'

/** Smallest module size (mm) that still scans reliably on most printers. */
export const MIN_MODULE_MM = 1

export const LOOP_OUTER_R = 6
export const LOOP_HOLE_R = 2.5

export interface ModelParams {
  content: string
  /** Width of the printed QR area, mm */
  qrSize: number
  /** Quiet zone around the code, mm */
  margin: number
  baseThickness: number
  qrHeight: number
  cornerRadius: number
  keychain: boolean
  /** Which edge the ring sits on */
  loopSide: LoopSide
  /** Solid material between the ring hole and the plate edge, mm (smaller = closer) */
  loopGap: number
  /** Slide the ring along its edge, mm from the centre */
  loopOffset: number
  errorLevel: ErrorLevel
}

export const defaultParams: ModelParams = {
  content: 'https://example.com',
  qrSize: 40,
  margin: 4,
  baseThickness: 2,
  qrHeight: 1,
  cornerRadius: 3,
  keychain: true,
  loopSide: 'top',
  loopGap: 1.5,
  loopOffset: 0,
  errorLevel: 'M',
}

export interface QRMatrix {
  size: number
  isDark: (row: number, col: number) => boolean
}

export function buildMatrix(content: string, errorLevel: ErrorLevel): QRMatrix {
  const qr = QRCode.create(content || ' ', { errorCorrectionLevel: errorLevel })
  const { size, data } = qr.modules
  return { size, isDark: (r, c) => Boolean(data[r * size + c]) }
}

function roundedRect(w: number, h: number, r: number) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2))
  const x = -w / 2
  const y = -h / 2
  const s = new THREE.Shape()
  s.moveTo(x + radius, y)
  s.lineTo(x + w - radius, y)
  s.quadraticCurveTo(x + w, y, x + w, y + radius)
  s.lineTo(x + w, y + h - radius)
  s.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
  s.lineTo(x + radius, y + h)
  s.quadraticCurveTo(x, y + h, x, y + h - radius)
  s.lineTo(x, y + radius)
  s.quadraticCurveTo(x, y, x + radius, y)
  return s
}

/**
 * Builds geometry in print orientation: the plate lies on the XY plane and
 * thickness grows along +Z, which is what slicers expect.
 */
export function buildGeometry(params: ModelParams, matrix: QRMatrix) {
  const side = params.qrSize + params.margin * 2
  const extrude = { depth: params.baseThickness, bevelEnabled: false }

  const baseParts: THREE.BufferGeometry[] = [
    new THREE.ExtrudeGeometry(
      roundedRect(side, side, params.cornerRadius),
      extrude,
    ),
  ]

  if (params.keychain) {
    const tabR = LOOP_OUTER_R
    const holeR = LOOP_HOLE_R
    // The hole must stay fully outside the plate, otherwise the plate would fill it in.
    const gap = Math.max(1, params.loopGap)
    const cy = side / 2 + holeR + gap
    const maxOffset = Math.max(0, side / 2 - 4)
    const cx = Math.max(-maxOffset, Math.min(maxOffset, params.loopOffset))
    const tab = new THREE.Shape()
    tab.absarc(cx, cy, tabR, 0, Math.PI * 2, false)
    const hole = new THREE.Path()
    hole.absarc(cx, cy, holeR, 0, Math.PI * 2, true)
    tab.holes.push(hole)
    const tabGeo = new THREE.ExtrudeGeometry(tab, extrude)
    // Built on the top edge, then turned around the plate centre for the other sides.
    const turns = { top: 0, left: 1, bottom: 2, right: 3 }[params.loopSide]
    tabGeo.rotateZ((turns * Math.PI) / 2)
    baseParts.push(tabGeo)
  }

  const base = mergeGeometries(baseParts.map((g) => g.toNonIndexed()))!

  // Merge horizontal runs of dark modules into single boxes to keep the mesh small.
  const m = params.qrSize / matrix.size
  const boxes: THREE.BufferGeometry[] = []
  for (let r = 0; r < matrix.size; r++) {
    let c = 0
    while (c < matrix.size) {
      if (!matrix.isDark(r, c)) {
        c++
        continue
      }
      const start = c
      while (c < matrix.size && matrix.isDark(r, c)) c++
      const len = c - start
      const box = new THREE.BoxGeometry(len * m, m, params.qrHeight)
      box.translate(
        -params.qrSize / 2 + (start + len / 2) * m,
        params.qrSize / 2 - (r + 0.5) * m,
        params.baseThickness + params.qrHeight / 2,
      )
      boxes.push(box.toNonIndexed())
    }
  }
  const code = boxes.length
    ? mergeGeometries(boxes)!
    : new THREE.BufferGeometry()

  return { base, code }
}

export function modelDimensions(params: ModelParams) {
  const side = params.qrSize + params.margin * 2
  const ring = params.keychain
    ? LOOP_HOLE_R + Math.max(1, params.loopGap) + LOOP_OUTER_R
    : 0
  const vertical = params.loopSide === 'top' || params.loopSide === 'bottom'
  return {
    width: vertical ? side : side + ring,
    height: vertical ? side + ring : side,
    depth: params.baseThickness + params.qrHeight,
  }
}

export interface ModelPart {
  name: string
  geometry: THREE.BufferGeometry
  /** Display color, #rrggbb */
  color: string
}

const esc = (v: string) =>
  v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/**
 * Exports a single 3MF containing one object made of several parts. Each part
 * gets its own color (3MF base material) and its own extruder, so Bambu Studio,
 * Orca Slicer and PrusaSlicer open it ready for a multi-color print.
 */
export function export3MF(parts: ModelPart[], objectName = 'QR code'): Blob {
  const vertices: string[] = []
  const triangles: string[] = []
  const ranges: { first: number; last: number }[] = []

  parts.forEach((part, partIndex) => {
    const pos = part.geometry.getAttribute('position')
    if (!pos) return
    const index = part.geometry.getIndex()
    // Weld identical vertices so each part is a closed, manifold mesh.
    const welded = new Map<string, number>()
    const vertexId = (i: number) => {
      const x = pos.getX(i).toFixed(4)
      const y = pos.getY(i).toFixed(4)
      const z = pos.getZ(i).toFixed(4)
      const key = `${x},${y},${z}`
      let id = welded.get(key)
      if (id === undefined) {
        id = vertices.length
        welded.set(key, id)
        vertices.push(`<vertex x="${x}" y="${y}" z="${z}"/>`)
      }
      return id
    }
    const count = index ? index.count : pos.count
    const first = triangles.length
    for (let t = 0; t + 2 < count; t += 3) {
      const a = vertexId(index ? index.getX(t) : t)
      const b = vertexId(index ? index.getX(t + 1) : t + 1)
      const c = vertexId(index ? index.getX(t + 2) : t + 2)
      if (a === b || b === c || a === c) continue
      triangles.push(
        `<triangle v1="${a}" v2="${b}" v3="${c}" pid="1" p1="${partIndex}"/>`,
      )
    }
    if (triangles.length > first)
      ranges.push({ first, last: triangles.length - 1 })
    else ranges.push({ first: -1, last: -1 })
  })

  const materials = parts
    .map(
      (p) =>
        `<base name="${esc(p.name)}" displaycolor="${p.color.toUpperCase()}FF"/>`,
    )
    .join('')

  const model = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
<metadata name="Title">${esc(objectName)}</metadata>
<metadata name="Application">3D QR Generator</metadata>
<resources>
<basematerials id="1">${materials}</basematerials>
<object id="2" type="model" name="${esc(objectName)}" pid="1" pindex="0">
<mesh>
<vertices>${vertices.join('')}</vertices>
<triangles>${triangles.join('')}</triangles>
</mesh>
</object>
</resources>
<build><item objectid="2"/></build>
</model>`

  const volumes = (typed: boolean) =>
    parts
      .map((p, i) => {
        const r = ranges[i]
        if (!r || r.first < 0) return ''
        const meta = (key: string, value: string) =>
          `<metadata${typed ? ' type="volume"' : ''} key="${key}" value="${esc(value)}"/>`
        return `<volume firstid="${r.first}" lastid="${r.last}">${meta('name', p.name)}${meta('extruder', String(i + 1))}${meta('volume_type', 'ModelPart')}</volume>`
      })
      .join('\n')

  // PrusaSlicer / Orca read this file for parts and extruders.
  const slic3rConfig = `<?xml version="1.0" encoding="UTF-8"?>
<config>
<object id="2" instances_count="1">
<metadata type="object" key="name" value="${esc(objectName)}"/>
${volumes(true)}
</object>
</config>`

  // Bambu Studio reads its own settings file.
  const bambuConfig = `<?xml version="1.0" encoding="UTF-8"?>
<config>
<object id="2">
<metadata key="name" value="${esc(objectName)}"/>
<metadata key="extruder" value="1"/>
${volumes(false)}
</object>
</config>`

  const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
<Default Extension="config" ContentType="text/xml"/>
</Types>`

  const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`

  const zip = zipSync(
    {
      '[Content_Types].xml': strToU8(contentTypes),
      '_rels/.rels': strToU8(rels),
      '3D/3dmodel.model': strToU8(model),
      'Metadata/Slic3r_PE_model.config': strToU8(slic3rConfig),
      'Metadata/model_settings.config': strToU8(bambuConfig),
    },
    { level: 6 },
  )
  return new Blob([zip.buffer as ArrayBuffer], { type: 'model/3mf' })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
