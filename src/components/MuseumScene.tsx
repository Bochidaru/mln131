import { Loader } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { EffectComposer, Vignette } from '@react-three/postprocessing'
import { Suspense } from 'react'
import { rooms } from '../data/content'
import { ContentPanel } from './ContentPanel'
import { HUD } from './HUD'
import { Minimap } from './Minimap'
import { MobileControls } from './MobileControls'
import { Player } from './Player'
import { Room } from './Room'
import { AudioController } from './AudioController'
export function MuseumScene() {
  return <main className="museum">
    <Canvas camera={{ fov: 66, near: 0.1, far: 35 }} dpr={[1, 1.5]} gl={{ antialias: true, powerPreference: 'high-performance' }} shadows="variance">
      <color attach="background" args={['#1A1210']} /><fog attach="fog" args={['#1A1210', 8, 25]} /><ambientLight color="#F0E6D2" intensity={0.15} />
      <Suspense fallback={null}>{rooms.map((room) => <Room key={room.id} room={room} />)}</Suspense>
      <Player /><EffectComposer multisampling={0}><Vignette eskil={false} offset={0.18} darkness={0.72} /></EffectComposer>
    </Canvas>
    <Loader dataInterpolation={(p) => `ĐANG MỞ CỬA · ${p.toFixed(0)}%`} /><AudioController /><HUD /><Minimap /><MobileControls /><ContentPanel />
  </main>
}
