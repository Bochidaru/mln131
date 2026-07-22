import { BakeShadows, Environment, Loader, Sky } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Bloom, EffectComposer, SMAA } from '@react-three/postprocessing'
import { Suspense } from 'react'
import { ACESFilmicToneMapping, PCFShadowMap, SRGBColorSpace } from 'three'
import { AudioController } from './AudioController'
import { ContentPanel } from './ContentPanel'
import { ChatPanel } from './ChatPanel'
import { QuizPanel } from './QuizPanel'
import { PvpPanel } from './PvpPanel'
import { DuelArena } from './DuelArena'
import { DuelHud } from './DuelHud'
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

function PostEffects() {
  return <EffectComposer multisampling={0}>
    <SMAA />
    <Bloom intensity={0.14} luminanceThreshold={1.2} luminanceSmoothing={0.45} />
  </EffectComposer>
}

export function MuseumScene() {
  const graphicsQuality = useStore((state) => state.graphicsQuality)
  const autoGraphicsQuality = useStore((state) => state.autoGraphicsQuality)
  const lowEndDevice = (graphicsQuality === 'auto' ? autoGraphicsQuality : graphicsQuality) === 'low'
  const duelActive = useStore((state) => Boolean(state.duel))
  const shadowsEnabled = !lowEndDevice && !duelActive

  return <main className="museum">
    <Canvas
      id="museum-canvas"
      camera={{ fov: 58, near: 0.08, far: duelActive ? 90 : lowEndDevice ? 115 : 160 }}
      dpr={lowEndDevice ? 0.65 : [0.9, 1.15]}
      gl={{ antialias: false, powerPreference: 'high-performance', alpha: false }}
      shadows={shadowsEnabled ? { type: PCFShadowMap } : false}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping
        gl.toneMappingExposure = 1.12
        gl.outputColorSpace = SRGBColorSpace
      }}>
      <color attach="background" args={['#b7c2b6']} />
      <fog attach="fog" args={['#c2c6b6', 92, 175]} />
      {!lowEndDevice && !duelActive && <Sky distance={450000} sunPosition={[64, 22, 48]} turbidity={5.4} rayleigh={2.1} mieCoefficient={0.008} mieDirectionalG={0.86} />}
      <hemisphereLight args={['#dcecff', '#5f574a', 1.05]} />
      <ambientLight color="#fff1dc" intensity={0.22} />
      <directionalLight
        position={[30, 22, 26]}
        color="#ffdcab"
        intensity={2.85}
        castShadow={shadowsEnabled}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={1}
        shadow-camera-far={115}
        shadow-camera-left={-48}
        shadow-camera-right={48}
        shadow-camera-top={48}
        shadow-camera-bottom={-95}
        shadow-bias={-0.00012}
      />
      {!duelActive && <pointLight position={[0, 5.2, 10.5]} color="#ffdca6" intensity={8} distance={18} decay={2} />}

      <Suspense fallback={null}>
        {!duelActive && <>
          <Surroundings lowEnd={lowEndDevice} />
          <Exterior />
          <MuseumInterior lowEnd={lowEndDevice} />
          {lowEndDevice ? <></> : <><Environment files="/textures/env.hdr" environmentIntensity={0.42} /><BakeShadows /></>}
        </>}
      </Suspense>
      <Player />
      {!duelActive && <RemotePlayers />}
      <DuelArena />
      {!lowEndDevice && !duelActive && <PostEffects />}
    </Canvas>
    <Loader dataInterpolation={(progress) => `ĐANG CHUẨN BỊ KHÔNG GIAN · ${progress.toFixed(0)}%`} />
    <AudioController />
    <HUD />
    <ChatPanel />
    <QuizPanel />
    <PvpPanel />
    <DuelHud />
    <Minimap />
    <MobileControls />
    <ContentPanel />
    <MultiplayerConnector />
  </main>
}
