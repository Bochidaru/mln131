import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Suspense, useEffect, useRef } from 'react'
import { Color, Group, InstancedMesh, Matrix4, Object3D, Vector3 } from 'three'
import { useStore, type RemotePlayer } from '../store/useStore'
import { getAvatar } from '../data/avatars'
import { MecchaAvatar } from './MecchaAvatar'

const rainbow = new Color()

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
    group.current.position.lerp(targetPosition.current, 1 - Math.exp(-12 * delta))
    const angleDifference = Math.atan2(
      Math.sin(targetYaw.current - group.current.rotation.y),
      Math.cos(targetYaw.current - group.current.rotation.y),
    )
    group.current.rotation.y += angleDifference * (1 - Math.exp(-12 * delta))
  })

  return <group ref={group}>
    <Suspense fallback={null}><MecchaAvatar avatarId={player.avatarId} guide={player.isGuide} pose={player.pose} /></Suspense>
    <Text position={[0, 2.05, 0]} fontSize={0.16} color="#f2eadc" anchorX="center" anchorY="middle">
      {player.name}
    </Text>
  </group>
}

// Far players use a tiny instanced silhouette; the selected Meccha variant appears on approach.
function RemoteCrowd({ players }: { players: RemotePlayer[] }) {
  const bodies = useRef<InstancedMesh>(null)
  const heads = useRef<InstancedMesh>(null)

  useEffect(() => {
    if (!bodies.current || !heads.current) return
    const bodyMatrix = new Matrix4()
    const headMatrix = new Matrix4()
    const dummy = new Object3D()
    const color = new Color()

    players.forEach((player, index) => {
      const avatar = getAvatar(player.avatarId)
      const yaw = Math.atan2(player.dirX, player.dirZ)
      dummy.position.set(player.x, 0.74, player.z)
      dummy.rotation.set(0, yaw, 0)
      dummy.scale.set(0.82, 0.9, 0.82)
      dummy.updateMatrix()
      bodyMatrix.copy(dummy.matrix)
      bodies.current!.setMatrixAt(index, bodyMatrix)
      bodies.current!.setColorAt(index, color.set(avatar.suit))
      dummy.position.set(player.x, 1.5, player.z)
      dummy.scale.setScalar(0.82)
      dummy.updateMatrix()
      headMatrix.copy(dummy.matrix)
      heads.current!.setMatrixAt(index, headMatrix)
      heads.current!.setColorAt(index, color.set(avatar.accent))
    })

    bodies.current.count = players.length
    heads.current.count = players.length
    bodies.current.instanceMatrix.needsUpdate = true
    heads.current.instanceMatrix.needsUpdate = true
    if (bodies.current.instanceColor) bodies.current.instanceColor.needsUpdate = true
    if (heads.current.instanceColor) heads.current.instanceColor.needsUpdate = true
  }, [players])

  useFrame(({ clock }) => {
    if (!bodies.current || !heads.current || !players.some((player) => player.isGuide)) return
    const pulse = 0.5 + Math.sin(clock.elapsedTime * 5.5) * 0.5
    players.forEach((player, index) => {
      if (!player.isGuide) return
      rainbow.setHSL((clock.elapsedTime * 0.28 + index * 0.08) % 1, 1, 0.48 + pulse * 0.18)
      bodies.current!.setColorAt(index, rainbow)
      heads.current!.setColorAt(index, rainbow)
    })
    if (bodies.current.instanceColor) bodies.current.instanceColor.needsUpdate = true
    if (heads.current.instanceColor) heads.current.instanceColor.needsUpdate = true
  })

  if (!players.length) return null
  return <group>
    <instancedMesh ref={bodies} args={[undefined, undefined, players.length]} frustumCulled={false}>
      <capsuleGeometry args={[0.27, 0.72, 3, 6]} />
      <meshStandardMaterial vertexColors roughness={0.8} />
    </instancedMesh>
    <instancedMesh ref={heads} args={[undefined, undefined, players.length]} frustumCulled={false}>
      <sphereGeometry args={[0.23, 8, 6]} />
      <meshStandardMaterial vertexColors roughness={0.88} />
    </instancedMesh>
  </group>
}

export function RemotePlayers() {
  const remotePlayers = useStore((state) => state.remotePlayers)
  const playerPose = useStore((state) => state.playerPose)
  const players = Object.values(remotePlayers)
  const closestFirst = [...players].sort((first, second) => {
    const firstDistance = (first.x - playerPose.x) ** 2 + (first.z - playerPose.z) ** 2
    const secondDistance = (second.x - playerPose.x) ** 2 + (second.z - playerPose.z) ** 2
    return firstDistance - secondDistance
  })
  const detailedPlayers = closestFirst.slice(0, 6)
  const crowdPlayers = closestFirst.slice(6)
  if (!players.length) return null
  return <group>
    {detailedPlayers.map((player) => <RemotePlayerAvatar key={player.id} player={player} />)}
    <RemoteCrowd players={crowdPlayers} />
  </group>
}
