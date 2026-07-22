import { useGLTF } from '@react-three/drei'
import { useEffect, useMemo } from 'react'
import { Box3, Color, Mesh, Vector3, type Material, type Object3D } from 'three'
import { getAvatar } from '../data/avatars'

const modelUrls = [
  '/models/meccha-chameleon-pose-1.glb',
  '/models/meccha-chameleon-pose-2.glb',
  '/models/meccha-chameleon-pose-3.glb',
  '/models/meccha-chameleon-pose-4.glb',
  '/models/meccha-chameleon-pose-5.glb',
] as const

// All source poses use the same character scale; crouched poses stay naturally shorter.
const poseHeights = [1.72, 1.72, 1.4, 1.72, 1] as const

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

export function MecchaAvatar({ avatarId, pose = 0 }: { avatarId: string; pose?: number }) {
  const avatar = getAvatar(avatarId)
  const normalizedPose = Math.min(4, Math.max(0, Math.trunc(pose)))
  const { scene } = useGLTF(modelUrls[normalizedPose])
  const prepared = useMemo(() => {
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
    clone.updateMatrixWorld(true)
    const bounds = new Box3().setFromObject(clone)
    const center = bounds.getCenter(new Vector3())
    const sourceHeight = Math.max(0.001, bounds.max.y - bounds.min.y)
    const scale = poseHeights[normalizedPose] / sourceHeight
    const position: [number, number, number] = [
      -center.x * scale,
      -bounds.min.y * scale,
      -center.z * scale,
    ]
    return { model: clone, position, scale }
  }, [avatar.suit, normalizedPose, scene])

  useEffect(() => () => disposeClone(prepared.model), [prepared])

  return <group position={prepared.position} scale={prepared.scale}>
    <primitive object={prepared.model} />
  </group>
}

modelUrls.forEach((url) => useGLTF.preload(url))
