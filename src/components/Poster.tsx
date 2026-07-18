import { Text, useTexture } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Mesh, SRGBColorSpace, Vector2, Vector3 } from 'three'
import { museumAudio } from '../audio'
import type { PosterData } from '../data/content'
import { useStore } from '../store/useStore'

const worldPosition = new Vector3()
const screenCenter = new Vector2(0, 0)

export function Poster({ data, position, rotationY = 0, lit = false }: {
  data: PosterData
  position: [number, number, number]
  rotationY?: number
  lit?: boolean
}) {
  const loadedTexture = useTexture(data.image)
  const texture = useMemo(() => {
    const prepared = loadedTexture.clone()
    prepared.colorSpace = SRGBColorSpace
    prepared.anisotropy = 4
    prepared.needsUpdate = true
    return prepared
  }, [loadedTexture])
  const artwork = useRef<Mesh>(null)
  const { camera, raycaster } = useThree()
  const [focused, setFocused] = useState(false)
  const setFocusedPoster = useStore((state) => state.setFocusedPoster)
  const setControlsLocked = useStore((state) => state.setControlsLocked)
  const openPoster = useStore((state) => state.openPoster)

  const activate = useCallback(() => {
    if (!focused) return
    document.exitPointerLock?.()
    setControlsLocked(false)
    museumAudio.click()
    openPoster(data)
  }, [data, focused, openPoster, setControlsLocked])

  useEffect(() => () => texture.dispose(), [texture])

  useEffect(() => {
    if (!focused) return
    const interact = (event: KeyboardEvent) => {
      if (event.code !== 'KeyE' && event.code !== 'Enter') return
      event.preventDefault()
      activate()
    }
    addEventListener('keydown', interact)
    return () => removeEventListener('keydown', interact)
  }, [activate, focused])

  useFrame(() => {
    const store = useStore.getState()
    if (!artwork.current || store.activePoster || store.seated) {
      if (focused) {
        setFocused(false)
        if (store.focusedPoster === data.id) setFocusedPoster(null)
      }
      return
    }
    artwork.current.getWorldPosition(worldPosition)
    const closeEnough = camera.position.distanceToSquared(worldPosition) <= 12.25
    let next = false
    if (closeEnough) {
      raycaster.setFromCamera(screenCenter, camera)
      next = raycaster.intersectObject(artwork.current, false).length > 0
    }
    if (next === focused) return
    setFocused(next)
    if (next) setFocusedPoster(data.id)
    else if (useStore.getState().focusedPoster === data.id) setFocusedPoster(null)
  })

  return <group position={position} rotation={[0, rotationY, 0]}>
    <mesh position={[0, 0, -0.055]} castShadow><boxGeometry args={[2.12, 3.02, 0.13]} /><meshStandardMaterial color="#6e5638" metalness={0.28} roughness={0.5} /></mesh>
    <mesh position={[0, 0, 0.02]} castShadow><boxGeometry args={[1.96, 2.86, 0.07]} /><meshStandardMaterial color="#ded4c2" roughness={0.8} /></mesh>
    <mesh ref={artwork} position={[0, 0.02, 0.065]} onClick={(event) => { event.stopPropagation(); event.nativeEvent.stopImmediatePropagation(); activate() }}>
      <planeGeometry args={[1.72, 2.58]} />
      <meshStandardMaterial map={texture} emissive="#8f2f24" emissiveIntensity={focused ? 0.18 : 0} roughness={0.68} />
    </mesh>
    <mesh position={[0, -1.68, 0.025]} castShadow><boxGeometry args={[2.05, 0.32, 0.06]} /><meshStandardMaterial color="#f0eadf" roughness={0.82} /></mesh>
    <Text position={[0, -1.64, 0.065]} fontSize={0.09} maxWidth={1.8} textAlign="center" color="#282824" anchorX="center" anchorY="middle">{data.title.toUpperCase()}</Text>
    <Text position={[-0.96, -1.82, 0.06]} fontSize={0.065} letterSpacing={0.12} color="#8f2f24" anchorX="left">MLN131 · {data.id.toUpperCase()}</Text>
    {lit && <pointLight position={[0, 2.1, 1]} color="#ffe6bd" intensity={4} distance={5} decay={2} />}
    {focused && <mesh position={[0, 0, 0.085]}><planeGeometry args={[1.82, 2.68]} /><meshBasicMaterial color="#d7a35d" transparent opacity={0.08} depthWrite={false} /></mesh>}
  </group>
}
