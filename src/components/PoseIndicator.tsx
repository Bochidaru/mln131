import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { useStore } from '../store/useStore'
import { MecchaAvatar } from './MecchaAvatar'

const poseNames = ['Mặc định', 'Pose 1', 'Pose 2']

export function PoseIndicator() {
  const entered = useStore((state) => state.entered)
  const avatarId = useStore((state) => state.avatarId)
  const pose = useStore((state) => state.playerEmotePose)
  const activePose = Math.min(2, Math.max(0, pose))

  if (!entered) return null
  return <aside className="pose-indicator" aria-label={`Pose hiện tại: ${poseNames[activePose]}`}>
    <div className="pose-preview" aria-hidden="true">
      <Canvas dpr={[1, 1.2]} gl={{ antialias: false, alpha: true }} camera={{ position: [2.4, 1.2, 3.4], fov: 34 }}>
        <ambientLight intensity={1.6} />
        <directionalLight position={[3, 5, 4]} intensity={2.2} color="#ffe4b6" />
        <group rotation={[0, -0.52, 0]}>
          <Suspense fallback={null}><MecchaAvatar avatarId={avatarId} pose={activePose} /></Suspense>
        </group>
      </Canvas>
    </div>
    <strong>{poseNames[activePose]}</strong>
    <small>Press <kbd>1</kbd> | <kbd>2</kbd> | <kbd>3</kbd> to change pose</small>
  </aside>
}
