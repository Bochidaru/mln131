import { BakeShadows, Environment, Loader, Sky } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Bloom, EffectComposer, Noise, SMAA, Vignette } from '@react-three/postprocessing'
import { Suspense } from 'react'
import { ACESFilmicToneMapping, PCFSoftShadowMap, SRGBColorSpace } from 'three'
import { AudioController } from './AudioController'
import { ContentPanel } from './ContentPanel'
import { ChatPanel } from './ChatPanel'
import { QuizPanel } from './QuizPanel'
import { Exterior } from './Exterior'
import { HUD } from './HUD'
import { Minimap } from './Minimap'
import { MobileControls } from './MobileControls'
import { MuseumInterior } from './MuseumInterior'
import { Player } from './Player'
import { RemotePlayers } from './RemotePlayers'
import { Surroundings } from './Surroundings'
import { MultiplayerConnector } from '../network/MultiplayerConnector'
import { useStore } from '../store/useStore'

function PostEffects({ mediumQuality }: { mediumQuality: boolean }) {
  return <EffectComposer multisampling={0}>
    <SMAA />
    {mediumQuality ? <></> : <Bloom intensity={0.18} luminanceThreshold={1.15} luminanceSmoothing={0.5} mipmapBlur />}
    <Vignette eskil={false} offset={0.28} darkness={0.24} />
    {mediumQuality ? <></> : <Noise opacity={0.028} />}
  </EffectComposer>
}

export function MuseumScene() {
  // Keep the museum usable on integrated graphics and older laptops.
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  const graphicsQuality = useStore((state) => state.graphicsQuality)
  const autoLowEnd = navigator.hardwareConcurrency <= 4 || (deviceMemory !== undefined && deviceMemory <= 4)
  const resolvedQuality = graphicsQuality === 'auto' ? (autoLowEnd ? 'low' : 'high') : graphicsQuality
  const lowEndDevice = resolvedQuality === 'low'
  const mediumQuality = resolvedQuality === 'medium'

  return <main className="museum">
    <Canvas
      id="museum-canvas"
      camera={{ fov: 58, near: 0.08, far: 190 }}
      dpr={lowEndDevice ? [1, 1.15] : mediumQuality ? [1, 1.35] : [1, 1.65]}
      gl={{ antialias: false, powerPreference: 'high-performance', alpha: false }}
      shadows={lowEndDevice ? false : { type: PCFSoftShadowMap }}
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
        castShadow={!lowEndDevice}
        shadow-mapSize-width={lowEndDevice ? 1024 : 2048}
        shadow-mapSize-height={lowEndDevice ? 1024 : 2048}
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
      <RemotePlayers />
      {lowEndDevice ? <></> : <PostEffects mediumQuality={mediumQuality} />}
    </Canvas>
    <Loader dataInterpolation={(progress) => `ĐANG CHUẨN BỊ KHÔNG GIAN · ${progress.toFixed(0)}%`} />
    <AudioController />
    <HUD />
    <ChatPanel />
    <QuizPanel />
    <Minimap />
    <MobileControls />
    <ContentPanel />
    <MultiplayerConnector />
  </main>
}
