import { CanvasTexture, RepeatWrapping } from 'three'

let waterBump: CanvasTexture | null = null

// Tileable grayscale ripple bump map for the reflecting pools.
export function getWaterBump() {
  if (waterBump) return waterBump
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#808080'
  ctx.fillRect(0, 0, size, size)
  for (let i = 0; i < 150; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const r = 6 + Math.random() * 22
    const bright = Math.random() > 0.5
    for (const ox of [-size, 0, size]) {
      for (const oy of [-size, 0, size]) {
        const grad = ctx.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r)
        grad.addColorStop(0, bright ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)')
        grad.addColorStop(1, 'rgba(128,128,128,0)')
        ctx.fillStyle = grad
        ctx.fillRect(x + ox - r, y + oy - r, r * 2, r * 2)
      }
    }
  }
  waterBump = new CanvasTexture(canvas)
  waterBump.wrapS = waterBump.wrapT = RepeatWrapping
  waterBump.repeat.set(3, 4.5)
  return waterBump
}
