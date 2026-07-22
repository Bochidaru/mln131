import { createPortal, useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import { Group } from 'three'
import { useStore } from '../store/useStore'

const ARENA = 200

function Gun() {
  const { camera } = useThree()
  const gun = useRef<Group>(null)
  useFrame((state) => { if (gun.current) gun.current.rotation.z = Math.sin(state.clock.elapsedTime * 2) * 0.015 })
  return createPortal(<group ref={gun} position={[0.34, -0.28, -0.62]} rotation={[-0.08, 0, 0]}>
    <mesh><boxGeometry args={[0.13, 0.14, 0.48]} /><meshStandardMaterial color="#202832" metalness={0.65} roughness={0.3} /></mesh>
    <mesh position={[0, -0.13, 0.03]} rotation={[0.25, 0, 0]}><boxGeometry args={[0.1, 0.2, 0.14]} /><meshStandardMaterial color="#313a45" /></mesh>
    <mesh position={[0, 0.03, -0.3]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.035, 0.035, 0.26, 8]} /><meshStandardMaterial color="#d8b16c" metalness={0.8} /></mesh>
  </group>, camera)
}

export function DuelArena() {
  const duel = useStore((state) => state.duel)
  const playerId = useStore((state) => state.multiplayerPlayerId)
  if (!duel || !playerId) return null
  const opponent = Object.entries(duel.players).find(([id]) => id !== playerId)?.[1]
  return <group>
    <Gun />
    <group position={[ARENA, 0, ARENA]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[30, 30]} /><meshStandardMaterial color="#262d33" roughness={0.85} /></mesh>
      {[-14, 14].flatMap((value) => [[value, 0], [0, value]]).map(([x, z]) => <mesh key={`${x}-${z}`} position={[x, 1.5, z]}><boxGeometry args={[x ? 0.4 : 30, 3, z ? 0.4 : 30]} /><meshStandardMaterial color="#4d3840" /></mesh>)}
      {[[0, 0], [-6, -5], [6, 5], [-5, 6], [5, -6]].map(([x, z]) => <mesh key={`${x}-${z}`} position={[x, 1.2, z]} castShadow><boxGeometry args={[2.5, 2.4, 1.2]} /><meshStandardMaterial color="#59656b" metalness={0.25} roughness={0.72} /></mesh>)}
      {opponent && <group position={[opponent.x - ARENA, opponent.y - 1.68, opponent.z - ARENA]} rotation={[0, Math.atan2(opponent.dirX, opponent.dirZ), 0]}><mesh position={[0, .85, 0]}><capsuleGeometry args={[.3, .9, 5, 10]} /><meshStandardMaterial color="#a83f37" /></mesh><mesh position={[0, 1.55, 0]}><sphereGeometry args={[.23, 12, 9]} /><meshStandardMaterial color="#d8a078" /></mesh></group>}
    </group>
  </group>
}
