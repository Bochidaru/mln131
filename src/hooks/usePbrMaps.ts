import { useTexture } from '@react-three/drei'
import { useMemo } from 'react'
import { RepeatWrapping, SRGBColorSpace, type Texture } from 'three'

export interface PbrMaps {
  map: Texture
  normalMap: Texture
  roughnessMap: Texture
}

// Configured clones are cached per folder+repeat so the same GPU textures are
// shared by every mesh that uses the same tiling (walls, the 8 gallery floors…).
const cache = new Map<string, PbrMaps>()

export function usePbrMaps(folder: string, repeatX: number, repeatY: number): PbrMaps {
  const raw = useTexture({
    map: `/textures/${folder}/color.jpg`,
    normalMap: `/textures/${folder}/normal.jpg`,
    roughnessMap: `/textures/${folder}/rough.jpg`,
  })
  return useMemo(() => {
    const key = `${folder}:${repeatX}:${repeatY}`
    const cached = cache.get(key)
    if (cached) return cached
    const configure = (texture: Texture, srgb: boolean) => {
      const clone = texture.clone()
      clone.wrapS = clone.wrapT = RepeatWrapping
      clone.repeat.set(repeatX, repeatY)
      clone.anisotropy = 8
      if (srgb) clone.colorSpace = SRGBColorSpace
      clone.needsUpdate = true
      return clone
    }
    const maps: PbrMaps = {
      map: configure(raw.map, true),
      normalMap: configure(raw.normalMap, false),
      roughnessMap: configure(raw.roughnessMap, false),
    }
    cache.set(key, maps)
    return maps
  }, [folder, repeatX, repeatY, raw])
}
