import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { Group, Vector3 } from 'three'
import { useStore, type RemotePlayer } from '../store/useStore'

const targetPosition = new Vector3()

function RemotePlayerAvatar({ player }: { player: RemotePlayer }) {
  const group = useRef<Group>(null)
  const yaw = Math.atan2(player.dirX, player.dirZ)

  useFrame((_, delta) => {
    if (!group.current) return
    targetPosition.set(player.x, 0, player.z)
    group.current.position.lerp(targetPosition, Math.min(1, delta * 10))
    group.current.rotation.y += (yaw - group.current.rotation.y) * Math.min(1, delta * 12)
  })

  return <group ref={group} position={[player.x, 0, player.z]} rotation={[0, yaw, 0]}>
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
      {player.id.slice(0, 6)}
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
