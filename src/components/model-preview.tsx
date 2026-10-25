import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

interface Props {
  base: THREE.BufferGeometry
  code: THREE.BufferGeometry
  baseColor: string
  codeColor: string
  extent: number
}

/** Interactive three.js preview. Drag to orbit, scroll to zoom (desktop). */
export function ModelPreview({
  base,
  code,
  baseColor,
  codeColor,
  extent,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    group: THREE.Group
    baseMat: THREE.MeshStandardMaterial
    codeMat: THREE.MeshStandardMaterial
  } | null>(null)

  useEffect(() => {
    const host = hostRef.current!
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    // The canvas is absolutely positioned and sized by CSS, so it can never
    // push its container (or the page) wider than the screen.
    Object.assign(renderer.domElement.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      display: 'block',
    })
    host.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 2000)
    camera.position.set(0, 70, 85)

    scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8070, 1.6))
    const key = new THREE.DirectionalLight(0xffffff, 2.2)
    key.position.set(40, 90, 60)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0xffe2b8, 0.8)
    rim.position.set(-60, 30, -50)
    scene.add(rim)

    const group = new THREE.Group()
    group.rotation.x = -Math.PI / 2 // model is built Z-up for printing
    scene.add(group)

    const baseMat = new THREE.MeshStandardMaterial({
      roughness: 0.55,
      metalness: 0.02,
    })
    const codeMat = new THREE.MeshStandardMaterial({
      roughness: 0.45,
      metalness: 0.02,
    })

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.autoRotate = true
    controls.autoRotateSpeed = 1.2
    controls.addEventListener('start', () => (controls.autoRotate = false))
    // On touch screens keep vertical swipes for page scrolling; one-finger
    // horizontal drags still rotate the model, pinch-zoom/pan are disabled.
    if (window.matchMedia('(pointer: coarse)').matches) {
      controls.enableZoom = false
      controls.enablePan = false
      renderer.domElement.style.touchAction = 'pan-y'
    }

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = host
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(host)

    let frame = 0
    const tick = () => {
      controls.update()
      renderer.render(scene, camera)
      frame = requestAnimationFrame(tick)
    }
    tick()

    sceneRef.current = { scene, camera, group, baseMat, codeMat }
    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
      controls.dispose()
      renderer.dispose()
      baseMat.dispose()
      codeMat.dispose()
      host.removeChild(renderer.domElement)
      sceneRef.current = null
    }
  }, [])

  useEffect(() => {
    const s = sceneRef.current
    if (!s) return
    s.group.clear()
    s.group.add(
      new THREE.Mesh(base, s.baseMat),
      new THREE.Mesh(code, s.codeMat),
    )
    // Center the model around the origin
    s.group.position.set(0, 0, 0)
    s.group.updateMatrixWorld(true)
    const center = new THREE.Box3()
      .setFromObject(s.group)
      .getCenter(new THREE.Vector3())
    s.group.position.copy(center.negate())
    return () => {
      base.dispose()
      code.dispose()
    }
  }, [base, code])

  useEffect(() => {
    const s = sceneRef.current
    if (!s) return
    s.baseMat.color.set(baseColor)
    s.codeMat.color.set(codeColor)
  }, [baseColor, codeColor])

  useEffect(() => {
    const s = sceneRef.current
    if (!s) return
    const d = extent * 1.9
    s.camera.position.setLength(d)
  }, [extent])

  return (
    <div
      ref={hostRef}
      className="relative h-full w-full min-w-0 overflow-hidden cursor-grab active:cursor-grabbing"
    />
  )
}
