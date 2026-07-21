import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { Group, Vector3 } from 'three'
import { useStore, type RemotePlayer } from '../store/useStore'

function RemotePlayerAvatar({ player }: { player: RemotePlayer }) {
  const group = useRef<Group>(null)
  const targetPosition = useRef(new Vector3(player.x, 0, player.z))
  const targetYaw = useRef(Math.atan2(player.dirX, player.dirZ))
  const initialized = useRef(false)

  useEffect(() => {
    targetPosition.current.set(player.x, 0, player.z)
    targetYaw.current = Math.atan2(player.dirX, player.dirZ)
    if (!initialized.current && group.current) {
      group.current.position.copy(targetPosition.current)
      group.current.rotation.y = targetYaw.current
      initialized.current = true
    }
  }, [player.x, player.z, player.dirX, player.dirZ])

  useFrame((_, delta) => {
    if (!group.current) return
    // Do not let React reset the transform on every network snapshot.
    group.current.position.lerp(targetPosition.current, 1 - Math.exp(-12 * delta))
    const angleDifference = Math.atan2(
      Math.sin(targetYaw.current - group.current.rotation.y),
      Math.cos(targetYaw.current - group.current.rotation.y),
    )
    group.current.rotation.y += angleDifference * (1 - Math.exp(-12 * delta))
  })

  return <group ref={group}>
    <mesh position={[0, 0.82, 0]} castShadow>
      <capsuleGeometry args={[0.28, 0.78, 6, 12]} />
      <meshStandardMaterial color={player.seated ? '#496b64' : '#8f342a'} roughness={0.62} metalness={0.08} />
    </mesh>
    <mesh position={[0, 1.5, 0]} castShadow>
      <sphereGeometry args={[0.22, 16, 12]} />
      <meshStandardMaterial color="#d3a078" roughness={0.7} />
    </mesh>
    <mesh position={[0, 1.24, -0.25]} castShadow>
      <boxGeometry args={[0.12, 0.12, 0.38]} />
      <meshStandardMaterial color="#2d302d" roughness={0.58} />
    </mesh>
    <Text position={[0, 2.05, 0]} fontSize={0.16} color="#f2eadc" anchorX="center" anchorY="middle">
      {player.name}
    </Text>
  </group>
}

export function RemotePlayers() {
  const remotePlayers = useStore((state) => state.remotePlayers)
  const players = Object.values(remotePlayers)
  if (!players.length) return null
  return <group>
    {players.map((player) => <RemotePlayerAvatar key={player.id} player={player} />)}
  </group>
}
