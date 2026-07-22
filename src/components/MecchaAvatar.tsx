import { useGLTF } from '@react-three/drei'
import { useEffect, useMemo } from 'react'
import { Color, Mesh, type Material, type Object3D } from 'three'
import { getAvatar } from '../data/avatars'

const modelUrls = [
  '/models/meccha-chameleon-default.glb',
  '/models/meccha-chameleon-pose-1.glb',
  '/models/meccha-chameleon-pose-2.glb',
] as const

function cloneMaterial(material: Material, color: string) {
  const cloned = material.clone() as Material & { color?: Color }
  if (cloned.color) cloned.color.set(color)
  return cloned
}

function disposeClone(object: Object3D) {
  object.traverse((node) => {
    if (!(node instanceof Mesh)) return
    const materials = Array.isArray(node.material) ? node.material : [node.material]
    materials.forEach((material) => material.dispose())
  })
}

function AvatarAccessory({ avatarId, color }: { avatarId: string; color: string }) {
  if (avatarId === 'forest-scout') return <mesh position={[0, 1.78, 0]} rotation={[0, 0.2, 0]} castShadow><coneGeometry args={[0.25, 0.28, 5]} /><meshStandardMaterial color={color} roughness={0.55} /></mesh>
  if (avatarId === 'mushroom-captain') return <mesh position={[0, 1.7, 0]} scale={[1.25, 0.48, 1.25]} castShadow><sphereGeometry args={[0.35, 12, 8]} /><meshStandardMaterial color={color} roughness={0.58} /></mesh>
  if (avatarId === 'neon-ninja') return <mesh position={[0, 1.52, -0.21]} castShadow><boxGeometry args={[0.43, 0.11, 0.08]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.28} /></mesh>
  if (avatarId === 'space-marshal') return <mesh position={[0, 1.76, 0]} castShadow><sphereGeometry args={[0.27, 14, 10]} /><meshStandardMaterial color={color} metalness={0.55} roughness={0.25} /></mesh>
  if (avatarId === 'rubber-duck') return <mesh position={[0, 1.37, -0.3]} rotation={[Math.PI / 2, 0, 0]} castShadow><coneGeometry args={[0.12, 0.25, 4]} /><meshStandardMaterial color={color} /></mesh>
  if (avatarId === 'banana-agent') return <mesh position={[0, 1.73, 0]} castShadow><coneGeometry args={[0.1, 0.24, 5]} /><meshStandardMaterial color={color} /></mesh>
  if (avatarId === 'capybara-king') return <mesh position={[0, 1.76, 0]} castShadow><cylinderGeometry args={[0.13, 0.2, 0.17, 6]} /><meshStandardMaterial color={color} metalness={0.3} /></mesh>
  if (avatarId === 'pixel-knight') return <mesh position={[0, 1.68, 0]} castShadow><boxGeometry args={[0.45, 0.2, 0.42]} /><meshStandardMaterial color={color} metalness={0.5} roughness={0.35} /></mesh>
  if (avatarId === 'robo-gecko') return <mesh position={[0, 0.52, 0.46]} rotation={[0.55, 0, 0]} castShadow><coneGeometry args={[0.14, 0.65, 7]} /><meshStandardMaterial color={color} metalness={0.35} /></mesh>
  return <mesh position={[0, 1.76, 0]} castShadow><boxGeometry args={[0.32, 0.08, 0.32]} /><meshStandardMaterial color={color} roughness={0.45} /></mesh>
}

export function MecchaAvatar({ avatarId, pose = 0 }: { avatarId: string; pose?: number }) {
  const avatar = getAvatar(avatarId)
  const normalizedPose = Math.min(2, Math.max(0, Math.trunc(pose)))
  const { scene } = useGLTF(modelUrls[normalizedPose])
  const model = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((node) => {
      if (!(node instanceof Mesh)) return
      // The source meshes are dense; avoiding per-avatar shadow maps keeps multiplayer responsive.
      node.castShadow = false
      node.receiveShadow = false
      node.material = Array.isArray(node.material)
        ? node.material.map((material) => cloneMaterial(material, avatar.suit))
        : cloneMaterial(node.material, avatar.suit)
    })
    return clone
  }, [avatar.suit, scene])

  useEffect(() => () => disposeClone(model), [model])

  return <group>
    <group rotation={[-Math.PI / 2, 0, 0]} scale={0.021}>
      <primitive object={model} />
    </group>
    <AvatarAccessory avatarId={avatar.id} color={avatar.accent} />
  </group>
}

modelUrls.forEach((url) => useGLTF.preload(url))
