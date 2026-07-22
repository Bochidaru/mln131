import { Line } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useRef, useState } from 'react'
import { Group } from 'three'
import { useStore, type DuelShot } from '../store/useStore'
import { MecchaAvatar } from './MecchaAvatar'

const ARENA = 200

function Gun({ shot, playerId }: { shot: DuelShot | null; playerId: string }) {
  const { camera } = useThree()
  const gun = useRef<Group>(null)
  const recoil = useRef(0)

  useEffect(() => {
    if (shot?.shooterId === playerId) recoil.current = 0.11
  }, [playerId, shot])

  useFrame((state, delta) => {
    if (!gun.current) return
    recoil.current *= Math.exp(-18 * delta)
    gun.current.position.copy(camera.position)
    gun.current.quaternion.copy(camera.quaternion)
    gun.current.translateX(0.34)
    gun.current.translateY(-0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.004)
    gun.current.translateZ(-0.62 + recoil.current)
  })

  return <group ref={gun} frustumCulled={false}>
    <mesh renderOrder={1000}><boxGeometry args={[0.15, 0.15, 0.52]} /><meshStandardMaterial color="#202832" metalness={0.65} roughness={0.3} depthTest={false} depthWrite={false} /></mesh>
    <mesh position={[0, -0.14, 0.04]} rotation={[0.25, 0, 0]} renderOrder={1000}><boxGeometry args={[0.11, 0.22, 0.15]} /><meshStandardMaterial color="#313a45" depthTest={false} depthWrite={false} /></mesh>
    <mesh position={[0, 0.025, -0.34]} rotation={[Math.PI / 2, 0, 0]} renderOrder={1000}><cylinderGeometry args={[0.038, 0.038, 0.3, 8]} /><meshStandardMaterial color="#d8b16c" metalness={0.8} depthTest={false} depthWrite={false} /></mesh>
    <mesh position={[0, 0.1, -0.04]} renderOrder={1000}><boxGeometry args={[0.1, 0.035, 0.19]} /><meshStandardMaterial color="#bb4c3e" emissive="#6d1f19" emissiveIntensity={0.45} depthTest={false} depthWrite={false} /></mesh>
  </group>
}

function ShotTracer({ shot }: { shot: DuelShot }) {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 280)
    return () => window.clearTimeout(timer)
  }, [])
  if (!visible) return null
  return <Line
    points={[[shot.startX, shot.startY, shot.startZ], [shot.endX, shot.endY, shot.endZ]]}
    color={shot.hit ? '#ff5d47' : '#ffd166'}
    lineWidth={shot.hit ? 3 : 2}
    transparent
    opacity={0.92}
    depthTest={false}
    renderOrder={900}
  />
}

export function DuelArena() {
  const duel = useStore((state) => state.duel)
  const shot = useStore((state) => state.duelShot)
  const playerId = useStore((state) => state.multiplayerPlayerId)
  if (!duel || !playerId) return null
  const opponent = Object.entries(duel.players).find(([id]) => id !== playerId)?.[1]
  return <group>
    <Gun shot={shot} playerId={playerId} />
    {shot && <ShotTracer key={shot.shotId} shot={shot} />}
    <group position={[ARENA, 0, ARENA]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[60, 60]} /><meshStandardMaterial color="#262d33" roughness={0.85} /></mesh>
      {[-29, 29].flatMap((value) => [[value, 0], [0, value]]).map(([x, z]) => <mesh key={`${x}-${z}`} position={[x, 1.5, z]}><boxGeometry args={[x ? 0.6 : 60, 3, z ? 0.6 : 60]} /><meshStandardMaterial color="#4d3840" /></mesh>)}
      {[[0, 0], [-12, -10], [12, 10], [-12, 12], [12, -12], [0, -18], [0, 18], [-20, 0], [20, 0]].map(([x, z]) => <mesh key={`${x}-${z}`} position={[x, 1.2, z]} castShadow><boxGeometry args={[4.4, 2.4, 1.6]} /><meshStandardMaterial color="#59656b" metalness={0.25} roughness={0.72} /></mesh>)}
      {opponent && <group position={[opponent.x - ARENA, opponent.y - 1.68, opponent.z - ARENA]} rotation={[0, Math.atan2(opponent.dirX, opponent.dirZ), 0]}><Suspense fallback={null}><MecchaAvatar avatarId={opponent.avatarId} pose={opponent.pose} /></Suspense></group>}
    </group>
  </group>
}
