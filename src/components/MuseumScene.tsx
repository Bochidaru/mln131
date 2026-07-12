import { Loader, Sky } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { Suspense } from 'react'
import { ACESFilmicToneMapping, PCFSoftShadowMap, SRGBColorSpace } from 'three'
import { AudioController } from './AudioController'
import { ContentPanel } from './ContentPanel'
import { Exterior } from './Exterior'
import { HUD } from './HUD'
import { Minimap } from './Minimap'
import { MobileControls } from './MobileControls'
import { MuseumInterior } from './MuseumInterior'
import { Player } from './Player'

export function MuseumScene() {
  return <main className="museum">
    <Canvas
      id="museum-canvas"
      camera={{ fov: 58, near: 0.08, far: 190 }}
      dpr={[1, 1.65]}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
      shadows={{ type: PCFSoftShadowMap }}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping
        gl.toneMappingExposure = 1.08
        gl.outputColorSpace = SRGBColorSpace
      }}>
      <color attach="background" args={['#a9c1cb']} />
      <fog attach="fog" args={['#b8c8cc', 92, 175]} />
      <Sky distance={450000} sunPosition={[70, 32, 55]} turbidity={4.8} rayleigh={1.7} mieCoefficient={0.006} mieDirectionalG={0.84} />
      <hemisphereLight args={['#dcefff', '#62594b', 1.25]} />
      <ambientLight color="#fff1dc" intensity={0.28} />
      <directionalLight
        position={[24, 36, 30]}
        color="#fff4dc"
        intensity={2.65}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={115}
        shadow-camera-left={-48}
        shadow-camera-right={48}
        shadow-camera-top={48}
        shadow-camera-bottom={-95}
        shadow-bias={-0.00012}
      />
      <pointLight position={[0, 5.2, 10.5]} color="#ffdca6" intensity={8} distance={18} decay={2} />

      <Suspense fallback={null}>
        <Exterior />
        <MuseumInterior />
      </Suspense>
      <Player />
      <EffectComposer multisampling={0}>
        <Bloom intensity={0.18} luminanceThreshold={1.15} luminanceSmoothing={0.5} mipmapBlur />
        <Vignette eskil={false} offset={0.28} darkness={0.24} />
      </EffectComposer>
    </Canvas>
    <Loader dataInterpolation={(progress) => `ĐANG CHUẨN BỊ KHÔNG GIAN · ${progress.toFixed(0)}%`} />
    <AudioController />
    <HUD />
    <Minimap />
    <MobileControls />
    <ContentPanel />
  </main>
}
