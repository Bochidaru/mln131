import { useTexture } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useRef, useState } from 'react'
import { Mesh, Vector2, Vector3 } from 'three'
import type { PosterData } from '../data/content'
import { useStore } from '../store/useStore'
import { museumAudio } from '../audio'

const worldPosition = new Vector3()
const screenCenter = new Vector2(0, 0)
export function Poster({ data, position, rotationY = 0, lit = false }: { data: PosterData; position: [number, number, number]; rotationY?: number; lit?: boolean }) {
  const texture = useTexture(data.image)
  const mesh = useRef<Mesh>(null)
  const { camera, raycaster } = useThree()
  const [focused, setFocused] = useState(false)
  const setFocusedPoster = useStore((s) => s.setFocusedPoster)
  const openPoster = useStore((s) => s.openPoster)
  useFrame(() => {
    if (!mesh.current) return
    raycaster.setFromCamera(screenCenter, camera)
    mesh.current.getWorldPosition(worldPosition)
    const next = camera.position.distanceTo(worldPosition) <= 3.2 && raycaster.intersectObject(mesh.current).length > 0
    if (next !== focused) { setFocused(next); setFocusedPoster(next ? data.id : null) }
  })
  return <group position={position} rotation={[0, rotationY, 0]}>
    <mesh><boxGeometry args={[1.68, 2.43, 0.08]} /><meshStandardMaterial color="#B8863B" metalness={0.45} roughness={0.48} /></mesh>
    <mesh ref={mesh} position={[0, 0, 0.052]} onClick={(event) => { if (focused) { event.stopPropagation(); museumAudio.click(); openPoster(data) } }}>
      <planeGeometry args={[1.5, 2.25]} /><meshStandardMaterial map={texture} emissive="#C8341E" emissiveIntensity={focused ? 0.28 : 0.02} roughness={0.72} />
    </mesh>
    <mesh position={[0, -1.43, 0.06]}><boxGeometry args={[1.55, 0.22, 0.04]} /><meshStandardMaterial color="#1A1210" /></mesh>
    {lit && <spotLight position={[0, 2.1, 1.1]} color="#FFE8C0" intensity={7} angle={0.4} penumbra={0.72} distance={6} />}
  </group>
}
