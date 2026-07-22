export type GraphicsQuality = 'auto' | 'low' | 'high'
export type ResolvedGraphicsQuality = Exclude<GraphicsQuality, 'auto'>

let cachedAutoQuality: ResolvedGraphicsQuality | null = null

function getRendererName() {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2', { powerPreference: 'high-performance' })
      ?? canvas.getContext('webgl', { powerPreference: 'high-performance' })
    if (!gl) return ''

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    const renderer = String(debugInfo
      ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      : gl.getParameter(gl.RENDERER))
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return renderer
  } catch {
    return ''
  }
}

export function detectAutoGraphicsQuality(): ResolvedGraphicsQuality {
  if (cachedAutoQuality) return cachedAutoQuality

  const renderer = getRendererName().toLowerCase()
  const softwareRenderer = /swiftshader|llvmpipe|software|microsoft basic render/.test(renderer)
  const rtxOrWorkstation = /geforce\s+rtx|nvidia\s+(?:rtx|quadro\s+rtx)|tesla\s+[tav]/.test(renderer)
  const gtxModel = renderer.match(/(?:geforce\s+)?gtx\s*(\d{3,4})/)
  const modernGtx = gtxModel ? Number(gtxModel[1]) >= 1000 : false
  const modernAmd = /radeon\s+(?:rx\s*(?:4[6-9]\d|[5-9]\d{2}|\d{4})|pro\s+(?:5|w)|vii|vega)/.test(renderer)
  const modernIntel = /intel.*\barc\b/.test(renderer)
  const appleSilicon = /apple\s+m[1-9]/.test(renderer)

  cachedAutoQuality = !softwareRenderer && (modernGtx || rtxOrWorkstation || modernAmd || modernIntel || appleSilicon)
    ? 'high'
    : 'low'
  return cachedAutoQuality
}
