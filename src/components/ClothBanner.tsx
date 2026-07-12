import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { DoubleSide, type Mesh } from 'three'

export function ClothBanner({ position, rotationY = 0, width = 1.5, height = 3, color = '#8f2f24', pinned = 'top', amplitude = 0.1, speed = 1 }: {
  position: [number, number, number]
  rotationY?: number
  width?: number
  height?: number
  color?: string
  pinned?: 'top' | 'left'
  amplitude?: number
  speed?: number
}) {
  const mesh = useRef<Mesh>(null)

  useFrame(({ clock }) => {
    if (!mesh.current) return
    const geometry = mesh.current.geometry
    const t = clock.elapsedTime * speed
    const attr = geometry.attributes.position
    for (let i = 0; i < attr.count; i++) {
      const x = attr.getX(i)
      const y = attr.getY(i)
      const pin = pinned === 'top' ? (height / 2 - y) / height : (x + width / 2) / width
      const wave = Math.sin(x * 2.1 + y * 1.4 + t * 1.7) * 0.65 + Math.sin(y * 2.8 - t * 1.1) * 0.35
      attr.setZ(i, wave * amplitude * pin * pin * 2)
    }
    attr.needsUpdate = true
    geometry.computeVertexNormals()
  })

  return <mesh ref={mesh} position={position} rotation={[0, rotationY, 0]} castShadow>
    <planeGeometry args={[width, height, 12, 16]} />
    <meshStandardMaterial color={color} roughness={0.8} side={DoubleSide} />
  </mesh>
}
