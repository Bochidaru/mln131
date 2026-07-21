import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { Group, Vector3 } from 'three'
import { useStore, type RemotePlayer } from '../store/useStore'
import { getAvatar, type Avatar } from '../data/avatars'

function Material({ color, metal = 0.08 }: { color: string; metal?: number }) {
  return <meshStandardMaterial color={color} roughness={0.62} metalness={metal} />
}

function ClassicHumanoid({ avatar, squared = false }: { avatar: Avatar; squared?: boolean }) {
  return <>
    <mesh position={[0, 0.82, 0]} castShadow>
      {squared ? <boxGeometry args={[0.55, 0.94, 0.34]} /> : <capsuleGeometry args={[0.28, 0.78, 5, 10]} />}
      <Material color={avatar.suit} />
    </mesh>
    <mesh position={[0, 1.5, 0]} castShadow>
      {squared ? <boxGeometry args={[0.42, 0.42, 0.42]} /> : <sphereGeometry args={[0.22, 12, 9]} />}
      <Material color={avatar.skin} />
    </mesh>
    <mesh position={[0, 1.24, -0.25]} castShadow><boxGeometry args={[0.12, 0.12, 0.38]} /><Material color={avatar.accent} /></mesh>
  </>
}

function AvatarModel({ avatar, seated }: { avatar: Avatar; seated: boolean }) {
  const suit = seated ? '#496b64' : avatar.suit

  if (avatar.id === 'forest-scout') return <>
    <ClassicHumanoid avatar={{ ...avatar, suit }} />
    {[-0.14, 0.14].map((x) => <mesh key={x} position={[x, 1.79, 0]} rotation={[0, 0, x * 2.5]} castShadow><coneGeometry args={[0.12, 0.34, 4]} /><Material color={avatar.suit} /></mesh>)}
    <mesh position={[0, 1.73, 0.02]} castShadow><cylinderGeometry args={[0.27, 0.24, 0.1, 10]} /><Material color={avatar.accent} /></mesh>
  </>

  if (avatar.id === 'mushroom-captain') return <>
    <mesh position={[0, 0.77, 0]} castShadow><capsuleGeometry args={[0.3, 0.68, 5, 10]} /><Material color={suit} /></mesh>
    <mesh position={[0, 1.45, 0]} castShadow><sphereGeometry args={[0.22, 12, 9]} /><Material color={avatar.skin} /></mesh>
    <mesh position={[0, 1.66, 0]} scale={[1.35, 0.55, 1.35]} castShadow><sphereGeometry args={[0.38, 14, 10]} /><Material color={avatar.suit} /></mesh>
    {[-0.2, 0.2, 0].map((x) => <mesh key={x} position={[x, 1.78, -0.24]}><sphereGeometry args={[0.055, 8, 6]} /><Material color={avatar.accent} /></mesh>)}
  </>

  if (avatar.id === 'neon-ninja') return <>
    <ClassicHumanoid avatar={{ ...avatar, suit }} />
    <mesh position={[0, 1.52, -0.19]} castShadow><boxGeometry args={[0.42, 0.15, 0.1]} /><Material color={avatar.accent} metal={0.35} /></mesh>
    <mesh position={[0, 1.76, 0]} castShadow><coneGeometry args={[0.27, 0.24, 4]} /><Material color="#25233a" /></mesh>
    <mesh position={[0.34, 0.98, 0.1]} rotation={[0.2, 0, -0.7]} castShadow><boxGeometry args={[0.07, 0.72, 0.11]} /><Material color={avatar.accent} metal={0.4} /></mesh>
  </>

  if (avatar.id === 'space-marshal') return <>
    <mesh position={[0, 0.82, 0]} castShadow><capsuleGeometry args={[0.31, 0.8, 6, 10]} /><Material color={suit} metal={0.45} /></mesh>
    <mesh position={[0, 1.52, 0]} castShadow><sphereGeometry args={[0.29, 14, 10]} /><Material color="#d6e9ed" metal={0.35} /></mesh>
    <mesh position={[0, 1.52, -0.23]} scale={[0.9, 0.68, 0.35]}><sphereGeometry args={[0.27, 12, 8]} /><meshStandardMaterial color="#293b50" transparent opacity={0.72} metalness={0.6} roughness={0.18} /></mesh>
    <mesh position={[0, 1.03, -0.3]} castShadow><boxGeometry args={[0.2, 0.24, 0.1]} /><Material color={avatar.accent} /></mesh>
  </>

  if (avatar.id === 'rubber-duck') return <>
    <mesh position={[0, 0.85, 0]} scale={[0.85, 1.05, 0.78]} castShadow><sphereGeometry args={[0.48, 12, 9]} /><Material color={avatar.suit} /></mesh>
    <mesh position={[0, 1.43, -0.05]} castShadow><sphereGeometry args={[0.3, 12, 9]} /><Material color={avatar.skin} /></mesh>
    <mesh position={[0, 1.4, -0.32]} castShadow><coneGeometry args={[0.16, 0.3, 4]} /><Material color={avatar.accent} /></mesh>
    {[-0.13, 0.13].map((x) => <mesh key={x} position={[x, 1.55, -0.26]}><sphereGeometry args={[0.035, 8, 6]} /><Material color="#202425" /></mesh>)}
  </>

  if (avatar.id === 'banana-agent') return <>
    <group rotation={[0, 0, 0.2]}>
      <mesh position={[0, 0.92, 0]} scale={[0.72, 1.35, 0.5]} castShadow><sphereGeometry args={[0.4, 12, 9]} /><Material color={avatar.suit} /></mesh>
      <mesh position={[0, 1.45, -0.3]} castShadow><boxGeometry args={[0.34, 0.12, 0.08]} /><Material color="#2b2926" /></mesh>
      <mesh position={[0, 1.76, 0]} castShadow><coneGeometry args={[0.1, 0.24, 5]} /><Material color={avatar.accent} /></mesh>
      <mesh position={[0, 0.23, 0]} rotation={[Math.PI, 0, 0]} castShadow><coneGeometry args={[0.08, 0.2, 5]} /><Material color={avatar.accent} /></mesh>
    </group>
  </>

  if (avatar.id === 'capybara-king') return <>
    <mesh position={[0, 0.62, 0]} scale={[1.15, 0.72, 0.8]} castShadow><sphereGeometry args={[0.45, 12, 9]} /><Material color={suit} /></mesh>
    <mesh position={[0, 1.06, -0.28]} scale={[0.82, 0.68, 0.75]} castShadow><sphereGeometry args={[0.34, 12, 9]} /><Material color={avatar.skin} /></mesh>
    {[-0.22, 0.22].map((x) => <mesh key={x} position={[x, 1.32, -0.1]} castShadow><sphereGeometry args={[0.09, 8, 6]} /><Material color={avatar.skin} /></mesh>)}
    <mesh position={[0, 1.5, 0]} castShadow><cylinderGeometry args={[0.16, 0.22, 0.17, 6]} /><Material color={avatar.accent} metal={0.25} /></mesh>
  </>

  if (avatar.id === 'pixel-knight') return <>
    <ClassicHumanoid avatar={{ ...avatar, suit }} squared />
    <mesh position={[0, 1.58, 0]} castShadow><boxGeometry args={[0.5, 0.26, 0.48]} /><Material color={avatar.suit} metal={0.55} /></mesh>
    <mesh position={[0, 1.7, -0.25]} castShadow><boxGeometry args={[0.14, 0.1, 0.08]} /><Material color={avatar.accent} metal={0.4} /></mesh>
    <mesh position={[-0.34, 0.95, 0]} rotation={[0, 0, -0.25]} castShadow><boxGeometry args={[0.08, 0.72, 0.4]} /><Material color={avatar.accent} metal={0.45} /></mesh>
  </>

  if (avatar.id === 'robo-gecko') return <>
    <mesh position={[0, 0.72, 0]} scale={[0.8, 0.75, 1.15]} castShadow><sphereGeometry args={[0.38, 10, 8]} /><Material color={suit} metal={0.35} /></mesh>
    <mesh position={[0, 1.2, -0.18]} scale={[1.1, 0.7, 0.95]} castShadow><sphereGeometry args={[0.3, 10, 8]} /><Material color={avatar.skin} metal={0.25} /></mesh>
    <mesh position={[0, 0.5, 0.5]} rotation={[0.55, 0, 0]} castShadow><coneGeometry args={[0.18, 0.8, 7]} /><Material color={avatar.accent} metal={0.35} /></mesh>
    {[-0.27, 0.27].map((x) => <mesh key={x} position={[x, 0.6, 0]} rotation={[0, 0, x * 2]} castShadow><boxGeometry args={[0.42, 0.08, 0.13]} /><Material color={avatar.skin} /></mesh>)}
  </>

  return <ClassicHumanoid avatar={{ ...avatar, suit }} squared />
}

function RemotePlayerAvatar({ player }: { player: RemotePlayer }) {
  const group = useRef<Group>(null)
  const targetPosition = useRef(new Vector3(player.x, 0, player.z))
  const targetYaw = useRef(Math.atan2(player.dirX, player.dirZ))
  const initialized = useRef(false)
  const avatar = getAvatar(player.avatarId)

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
    <AvatarModel avatar={avatar} seated={player.seated} />
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
