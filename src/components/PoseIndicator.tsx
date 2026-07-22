import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { useStore } from '../store/useStore'
import { MecchaAvatar } from './MecchaAvatar'

const poseNames = ['Pose 1', 'Pose 2', 'Pose 3', 'Pose 4', 'Pose 5']
const previewOffsets = [0, 0, 0.16, 0, 0.36]

export function PoseIndicator() {
  const entered = useStore((state) => state.entered)
  const avatarId = useStore((state) => state.avatarId)
  const isGuide = useStore((state) => state.isGuide)
  const pose = useStore((state) => state.playerEmotePose)
  const activePose = Math.min(4, Math.max(0, pose))

  if (!entered) return null
  return <aside className="pose-indicator" aria-label={`Pose hiện tại: ${poseNames[activePose]}`}>
    <div className="pose-preview" aria-hidden="true">
      <Canvas dpr={[1, 1.2]} gl={{ antialias: false, alpha: true }} camera={{ position: [2.4, 1.35, 3.4], fov: 34 }} onCreated={({ camera }) => camera.lookAt(0, 0.86, 0)}>
        <ambientLight intensity={1.6} />
        <directionalLight position={[3, 5, 4]} intensity={2.2} color="#ffe4b6" />
        <group position={[0, previewOffsets[activePose], 0]} rotation={[0, -0.52, 0]}>
          <Suspense fallback={null}><MecchaAvatar avatarId={avatarId} guide={isGuide} pose={activePose} /></Suspense>
        </group>
      </Canvas>
    </div>
    <strong>{poseNames[activePose]}</strong>
    <small>Press <kbd>1</kbd>–<kbd>5</kbd> to change pose</small>
  </aside>
}
