import { BakeShadows, Environment, Loader, Sky } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Bloom, EffectComposer, Noise, SMAA, Vignette } from '@react-three/postprocessing'
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
import { Surroundings } from './Surroundings'

export function MuseumScene() {
  return <main className="museum">
    <Canvas
      id="museum-canvas"
      camera={{ fov: 58, near: 0.08, far: 190 }}
      dpr={[1, 1.65]}
      gl={{ antialias: false, powerPreference: 'high-performance', alpha: false }}
      shadows={{ type: PCFSoftShadowMap }}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping
        gl.toneMappingExposure = 1.12
        gl.outputColorSpace = SRGBColorSpace
      }}>
      <color attach="background" args={['#b7c2b6']} />
      <fog attach="fog" args={['#c2c6b6', 92, 175]} />
      <Sky distance={450000} sunPosition={[64, 22, 48]} turbidity={5.4} rayleigh={2.1} mieCoefficient={0.008} mieDirectionalG={0.86} />
      <hemisphereLight args={['#dcecff', '#5f574a', 1.05]} />
      <ambientLight color="#fff1dc" intensity={0.22} />
      <directionalLight
        position={[30, 22, 26]}
        color="#ffdcab"
        intensity={2.85}
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
        <Surroundings />
        <Exterior />
        <MuseumInterior />
        <Environment files="/textures/env.hdr" environmentIntensity={0.42} />
        <BakeShadows />
      </Suspense>
      <Player />
      <EffectComposer multisampling={0}>
        <SMAA />
        <Bloom intensity={0.18} luminanceThreshold={1.15} luminanceSmoothing={0.5} mipmapBlur />
        <Vignette eskil={false} offset={0.28} darkness={0.24} />
        <Noise opacity={0.028} />
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
