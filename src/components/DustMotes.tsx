import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, type BufferAttribute, type Points } from 'three'

function mulberry32(seed: number) {
  let state = seed
  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function DustMotes({ position, bounds, count = 60, seed = 1 }: {
  position: [number, number, number]
  bounds: [number, number, number]
  count?: number
  seed?: number
}) {
  const points = useRef<Points>(null)
  const { positions, seeds } = useMemo(() => {
    const random = mulberry32(seed * 7919 + count)
    return {
      positions: new Float32Array(count * 3),
      seeds: Float32Array.from({ length: count * 4 }, () => random()),
    }
  }, [count, seed])

  useFrame(({ clock }) => {
    if (!points.current) return
    const t = clock.elapsedTime
    const attr = points.current.geometry.attributes.position as BufferAttribute
    const [w, h, d] = bounds
    for (let i = 0; i < count; i++) {
      const s0 = seeds[i * 4]
      const s1 = seeds[i * 4 + 1]
      const s2 = seeds[i * 4 + 2]
      const s3 = seeds[i * 4 + 3]
      attr.setXYZ(
        i,
        (s0 - 0.5) * w + Math.sin(t * (0.1 + s1 * 0.2) + s2 * 12.6) * 0.55,
        ((s1 + t * (0.006 + s3 * 0.011)) % 1 - 0.5) * h,
        (s2 - 0.5) * d + Math.cos(t * (0.09 + s0 * 0.16) + s3 * 9.4) * 0.45,
      )
    }
    attr.needsUpdate = true
  })

  return <points ref={points} position={position} frustumCulled={false}>
    <bufferGeometry>
      <bufferAttribute attach="attributes-position" args={[positions, 3]} />
    </bufferGeometry>
    <pointsMaterial size={0.028} color="#ffe9c4" transparent opacity={0.22} depthWrite={false} blending={AdditiveBlending} sizeAttenuation />
  </points>
}
