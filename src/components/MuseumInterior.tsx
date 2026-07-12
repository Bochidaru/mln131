import { Text } from '@react-three/drei'
import { useMemo } from 'react'
import { Object3D } from 'three'
import { rooms, type RoomData } from '../data/content'
import { galleryLayouts, type GalleryLayout } from '../data/layout'
<<<<<<< Updated upstream
=======
import { usePbrMaps } from '../hooks/usePbrMaps'
import { ClothBanner } from './ClothBanner'
import { DustMotes } from './DustMotes'
import { FloorLines, type FloorLine } from './FloorLines'
import { InteractiveBench } from './InteractiveBench'
>>>>>>> Stashed changes
import { Poster } from './Poster'

const wall = '#e6e0d5'
const floorStone = '#b7afa2'
const charcoal = '#292a28'
const bronze = '#8f7045'

function Wall({ position, size, color = wall }: { position: [number, number, number]; size: [number, number, number]; color?: string }) {
  return <mesh position={position} castShadow receiveShadow><boxGeometry args={size} /><meshStandardMaterial color={color} roughness={0.86} /></mesh>
}

function SpotFixture({ position, target }: { position: [number, number, number]; target: [number, number, number] }) {
  const targetObject = useMemo(() => {
    const object = new Object3D()
    object.position.set(...target)
    return object
  }, [target])
  return <>
    <mesh position={position} castShadow><cylinderGeometry args={[0.09, 0.13, 0.24, 10]} /><meshStandardMaterial color={charcoal} metalness={0.72} roughness={0.3} /></mesh>
    <spotLight position={position} target={targetObject} color="#fff0d0" intensity={18} angle={0.34} penumbra={0.82} distance={9} decay={2} />
    <primitive object={targetObject} />
  </>
}

function GallerySign({ layout, room }: { layout: GalleryLayout; room: RoomData }) {
  const x = layout.side === 'left' ? -4.04 : 4.04
  const rotationY = layout.side === 'left' ? Math.PI / 2 : -Math.PI / 2
  return <group position={[x, 4.62, layout.center.z]} rotation={[0, rotationY, 0]}>
    <mesh castShadow><boxGeometry args={[4.5, 1.12, 0.12]} /><meshStandardMaterial color={charcoal} metalness={0.16} roughness={0.58} /></mesh>
    <mesh position={[0, 0.43, 0.07]}><boxGeometry args={[4.5, 0.07, 0.05]} /><meshStandardMaterial color={layout.accent} emissive={layout.accent} emissiveIntensity={0.18} /></mesh>
    <Text position={[-1.75, 0.04, 0.075]} fontSize={0.42} color="#f1e9db" anchorX="center" anchorY="middle">{String(room.id).padStart(2, '0')}</Text>
    <Text position={[0.35, 0.14, 0.075]} fontSize={0.13} maxWidth={3.15} textAlign="left" color="#c0a679" anchorX="center" anchorY="middle">{room.subtitle.toUpperCase()}</Text>
    <Text position={[0.35, -0.17, 0.075]} fontSize={0.16} maxWidth={3.15} textAlign="center" color="#f1e9db" anchorX="center" anchorY="middle">{room.name.toUpperCase()}</Text>
  </group>
}

function GalleryFloor({ layout }: { layout: GalleryLayout }) {
  const { center, size } = layout
  return <group>
    <mesh position={[center.x, 0, center.z]} receiveShadow><boxGeometry args={[size.width, 0.16, size.depth]} /><meshStandardMaterial color="#8c735c" roughness={0.74} /></mesh>
    {Array.from({ length: 11 }, (_, index) => center.x - size.width / 2 + 0.8 + index * 1.5).map((x) => <mesh key={x} position={[x, 0.09, center.z]}>
      <boxGeometry args={[0.018, 0.01, size.depth - 0.15]} /><meshStandardMaterial color="#5f4d3e" roughness={0.95} /></mesh>)}
    {Array.from({ length: 9 }, (_, index) => center.z - size.depth / 2 + 1 + index * 2).map((z) => <mesh key={z} position={[center.x, 0.095, z]}>
      <boxGeometry args={[size.width - 0.12, 0.01, 0.018]} /><meshStandardMaterial color="#9d846d" roughness={0.9} /></mesh>)}
  </group>
}

function DisplayPlinth({ position, accent }: { position: [number, number, number]; accent: string }) {
  return <group position={position}>
    <mesh position={[0, 0.55, 0]} castShadow receiveShadow><boxGeometry args={[1.05, 1.1, 1.05]} /><meshStandardMaterial color="#d8d1c4" roughness={0.72} /></mesh>
    <mesh position={[0, 1.36, 0]} castShadow rotation={[0.35, 0.45, 0.2]}><octahedronGeometry args={[0.58, 0]} /><meshStandardMaterial color={accent} metalness={0.48} roughness={0.38} /></mesh>
    <mesh position={[0, 1.88, 0]}><cylinderGeometry args={[0.035, 0.035, 0.38, 8]} /><meshStandardMaterial color={bronze} metalness={0.7} /></mesh>
  </group>
}

function GalleryRoom({ layout }: { layout: GalleryLayout }) {
  const room = rooms[layout.roomId]
  const { center, size, side, accent } = layout
  const outerX = side === 'left' ? -20.86 : 20.86
  const posterRotation = side === 'left' ? Math.PI / 2 : -Math.PI / 2
  const offsets = room.posters.length === 1 ? [0] : room.posters.length === 2 ? [-2.7, 2.7] : [-4.6, 0, 4.6]
  const backZ = center.z - size.depth / 2
  const frontZ = center.z + size.depth / 2

  return <group>
    <GalleryFloor layout={layout} />
    <Wall position={[outerX, 2.78, center.z]} size={[0.3, 5.56, size.depth + 0.3]} />
    <Wall position={[center.x, 2.78, backZ]} size={[size.width + 0.3, 5.56, 0.3]} />
    <Wall position={[center.x, 2.78, frontZ]} size={[size.width + 0.3, 5.56, 0.3]} />
    <Wall position={[center.x, 5.62, center.z]} size={[size.width + 0.2, 0.18, size.depth + 0.2]} color="#d0cbc1" />
    <mesh position={[outerX + (side === 'left' ? 0.18 : -0.18), 0.24, center.z]}><boxGeometry args={[0.16, 0.32, size.depth]} /><meshStandardMaterial color={charcoal} roughness={0.64} /></mesh>
    <mesh position={[center.x, 4.62, backZ + 0.18]}><boxGeometry args={[size.width - 0.7, 0.08, 0.08]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.16} /></mesh>
    {[outerX + (side === 'left' ? .3 : -.3), side === 'left' ? -4.42 : 4.42].map((x) => <mesh key={x} position={[x, 5.37, center.z]}>
      <boxGeometry args={[.08, .08, size.depth - .45]} /><meshStandardMaterial color="#f6ddb1" emissive="#f6ddb1" emissiveIntensity={1.25} /></mesh>
    )}
    {[backZ + .22, frontZ - .22].map((z) => <mesh key={z} position={[center.x, 5.37, z]}>
      <boxGeometry args={[size.width - .5, .08, .08]} /><meshStandardMaterial color="#f6ddb1" emissive="#f6ddb1" emissiveIntensity={1.15} /></mesh>
    )}
    <Text position={[center.x, 3.15, backZ + 0.18]} fontSize={1.2} color={accent} anchorX="center" anchorY="middle">{String(room.id).padStart(2, '0')}</Text>
    <Text position={[center.x, 2.15, backZ + 0.185]} fontSize={0.22} maxWidth={12} textAlign="center" color={charcoal} anchorX="center" anchorY="middle">{room.name.toUpperCase()}</Text>
    <Text position={[center.x, 1.72, backZ + 0.185]} fontSize={0.12} letterSpacing={0.14} color={accent} anchorX="center" anchorY="middle">{room.subtitle.toUpperCase()}</Text>

    {room.posters.map((item, index) => <Poster
      key={item.id}
      data={item}
      position={[outerX + (side === 'left' ? 0.19 : -0.19), 2.48, center.z + offsets[index]]}
      rotationY={posterRotation}
    />)}

    {offsets.map((offset) => <SpotFixture
      key={offset}
      position={[side === 'left' ? -17.8 : 17.8, 5.12, center.z + offset]}
      target={[outerX, 2.35, center.z + offset]}
    />)}
    <mesh position={[side === 'left' ? -17.8 : 17.8, 5.2, center.z]}><boxGeometry args={[0.12, 0.12, size.depth - 1.2]} /><meshStandardMaterial color={charcoal} metalness={0.62} roughness={0.34} /></mesh>

    <InteractiveBench position={[center.x + (side === 'left' ? 1.2 : -1.2), 0, center.z]} rotation={side === 'left' ? -Math.PI / 2 : Math.PI / 2} length={2.0} />
    <DisplayPlinth position={[center.x + (side === 'left' ? -4.7 : 4.7), 0, center.z + 5.9]} accent={accent} />
    <group position={[center.x + (side === 'left' ? 4.9 : -4.9), 0, center.z - 5.8]}>
      <mesh position={[0, .58, 0]} castShadow><boxGeometry args={[1.45, 1.16, 1.45]} /><meshStandardMaterial color="#d8d1c4" roughness={.72} /></mesh>
      <mesh position={[0, 1.62, 0]} castShadow><boxGeometry args={[1.58, .95, 1.58]} /><meshPhysicalMaterial color="#a4c0c3" transparent opacity={.25} transmission={.32} roughness={.08} metalness={.05} /></mesh>
      <mesh position={[0, 1.43, 0]} castShadow rotation={[.3,.5,.1]}><dodecahedronGeometry args={[.36,0]} /><meshStandardMaterial color={accent} metalness={.4} roughness={.38} /></mesh>
    </group>
    <GallerySign layout={layout} room={room} />

    <group position={[side === 'left' ? -4.18 : 4.18, 0, center.z]}>
      {[-2.42, 2.42].map((zOffset) => <mesh key={zOffset} position={[0, 2.8, zOffset]} castShadow><boxGeometry args={[0.48, 5.6, 0.34]} /><meshStandardMaterial color={charcoal} roughness={0.56} /></mesh>)}
      <mesh position={[0, 5.28, 0]} castShadow><boxGeometry args={[0.48, 0.62, 5.15]} /><meshStandardMaterial color={charcoal} roughness={0.56} /></mesh>
    </group>

    <rectAreaLight position={[center.x, 5.25, center.z]} rotation={[-Math.PI / 2, 0, 0]} color="#fff4dc" intensity={2.6} width={7} height={2.2} />
  </group>
}

function Receptionist({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const skin = '#c78e63'
  const shirt = '#eef1f4'
  const vest = '#2b2f37'
  const trousers = '#22252b'
  const hair = '#241d18'
  return <group position={position} rotation={[0, rotation, 0]}>
    {[-0.13, 0.13].map((x) => <mesh key={x} position={[x, 0.05, 0.05]} castShadow><boxGeometry args={[0.15, 0.1, 0.3]} /><meshStandardMaterial color="#17181c" roughness={0.5} /></mesh>)}
    {[-0.13, 0.13].map((x) => <mesh key={x} position={[x, 0.5, 0]} castShadow><cylinderGeometry args={[0.1, 0.12, 0.9, 12]} /><meshStandardMaterial color={trousers} roughness={0.82} /></mesh>)}
    <mesh position={[0, 0.98, 0]} castShadow><boxGeometry args={[0.38, 0.24, 0.24]} /><meshStandardMaterial color={trousers} roughness={0.82} /></mesh>
    <mesh position={[0, 1.34, 0]} castShadow><cylinderGeometry args={[0.2, 0.24, 0.56, 14]} /><meshStandardMaterial color={shirt} roughness={0.68} /></mesh>
    <mesh position={[0, 1.33, -0.01]} castShadow><cylinderGeometry args={[0.235, 0.255, 0.5, 14]} /><meshStandardMaterial color={vest} roughness={0.62} /></mesh>
    <mesh position={[0, 1.4, 0.2]}><boxGeometry args={[0.03, 0.34, 0.01]} /><meshStandardMaterial color="#8f2f24" roughness={0.7} /></mesh>
    <mesh position={[0, 1.2, 0.22]}><boxGeometry args={[0.12, 0.16, 0.01]} /><meshStandardMaterial color="#e9e2d2" roughness={0.6} /></mesh>
    {[-1, 1].map((s) => <group key={s}>
      <mesh position={[s * 0.28, 1.5, 0]} castShadow><sphereGeometry args={[0.1, 12, 10]} /><meshStandardMaterial color={vest} roughness={0.62} /></mesh>
      <mesh position={[s * 0.3, 1.2, 0.02]} rotation={[0, 0, s * 0.12]} castShadow><cylinderGeometry args={[0.075, 0.08, 0.62, 12]} /><meshStandardMaterial color={vest} roughness={0.66} /></mesh>
      <mesh position={[s * 0.34, 0.88, 0.05]} castShadow><sphereGeometry args={[0.07, 10, 8]} /><meshStandardMaterial color={skin} roughness={0.7} /></mesh>
    </group>)}
    <mesh position={[0, 1.66, 0]} castShadow><cylinderGeometry args={[0.06, 0.07, 0.1, 10]} /><meshStandardMaterial color={skin} roughness={0.7} /></mesh>
    <mesh position={[0, 1.78, 0]} castShadow><sphereGeometry args={[0.13, 18, 16]} /><meshStandardMaterial color={skin} roughness={0.68} /></mesh>
    <mesh position={[0, 1.83, -0.02]} castShadow><sphereGeometry args={[0.142, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.62]} /><meshStandardMaterial color={hair} roughness={0.85} /></mesh>
  </group>
}

function ReceptionDesk() {
  return <group position={[-6.3, 0, -9.4]}>
    <mesh position={[0, 0.62, 0]} castShadow receiveShadow><boxGeometry args={[4, 1.22, 1.3]} /><meshStandardMaterial color="#4d4238" roughness={0.58} /></mesh>
    <mesh position={[0, 1.27, 0]} castShadow><boxGeometry args={[4.18, 0.1, 1.5]} /><meshStandardMaterial color={bronze} metalness={0.48} roughness={0.34} /></mesh>
    <Text position={[0, 0.68, 0.67]} fontSize={0.18} letterSpacing={0.17} color="#eee4d2">THÔNG TIN  ·  INFORMATION</Text>
    <mesh position={[1.15, 1.63, -0.12]} rotation={[-0.12, 0, 0]} castShadow><boxGeometry args={[0.9, 0.62, 0.06]} /><meshStandardMaterial color={charcoal} metalness={0.35} roughness={0.42} /></mesh>
    <mesh position={[1.15, 1.32, -0.12]}><boxGeometry args={[0.08, 0.34, 0.08]} /><meshStandardMaterial color={charcoal} /></mesh>
    {[-1.5, -1.2, -0.9].map((x) => <mesh key={x} position={[x, 1.4, 0.2]} rotation={[-0.25, 0, 0]}><boxGeometry args={[0.2, 0.02, 0.34]} /><meshStandardMaterial color="#a84534" roughness={0.72} /></mesh>)}
  </group>
}

function LobbySculpture() {
  return <group position={[0, 0, -3.15]}>
    <mesh position={[0, 0.45, 0]} castShadow receiveShadow><cylinderGeometry args={[0.92, 1.05, 0.9, 24]} /><meshStandardMaterial color="#d7d0c2" roughness={0.68} /></mesh>
    <mesh position={[0, 1.72, 0]} castShadow rotation={[0.12, 0.15, -0.18]}><torusKnotGeometry args={[0.54, 0.15, 96, 12, 2, 3]} /><meshStandardMaterial color="#9b3429" metalness={0.48} roughness={0.3} /></mesh>
    <pointLight position={[0, 2.55, 0]} color="#ffe0b0" intensity={5} distance={6} decay={2} />
  </group>
}

function IndoorPlanter({ x, z }: { x: number; z: number }) {
  return <group position={[x, 0, z]}>
    <mesh position={[0, 0.42, 0]} castShadow><cylinderGeometry args={[0.48, 0.36, 0.84, 12]} /><meshStandardMaterial color="#776752" roughness={0.72} /></mesh>
    <mesh position={[0, 1.25, 0]} castShadow><cylinderGeometry args={[0.055, 0.09, 1.15, 8]} /><meshStandardMaterial color="#4d5339" roughness={.9} /></mesh>
    {[-0.42, 0, 0.42].map((offset, index) => <mesh key={offset} position={[offset, 1.72 + index * .08, 0]} rotation={[0, 0, offset]} castShadow>
      <sphereGeometry args={[0.52, 12, 8]} /><meshStandardMaterial color={index === 1 ? '#4f7048' : '#3d613f'} roughness={.96} /></mesh>)}
  </group>
}

function DirectoryKiosk() {
  return <group position={[9.5, 0, 1.2]} rotation={[0, -0.16, 0]}>
    <mesh position={[0, 1.65, 0]} castShadow><boxGeometry args={[2.35, 3.3, 0.26]} /><meshStandardMaterial color={charcoal} roughness={0.55} /></mesh>
    <mesh position={[0, 1.78, 0.15]}><planeGeometry args={[2.05, 2.6]} /><meshStandardMaterial color="#ddd4c4" roughness={0.8} /></mesh>
    <Text position={[0, 2.75, 0.17]} fontSize={0.16} letterSpacing={0.14} color="#8f342a">SƠ ĐỒ TẦNG</Text>
    {[2.2, 1.75, 1.3, .85].map((y, index) => <group key={y}>
      <mesh position={[-.48, y, .18]}><boxGeometry args={[.72, .28, .02]} /><meshStandardMaterial color={index % 2 ? '#8e7651' : '#9b3b2f'} /></mesh>
      <mesh position={[.48, y, .18]}><boxGeometry args={[.72, .28, .02]} /><meshStandardMaterial color={index % 2 ? '#9b3b2f' : '#8e7651'} /></mesh>
    </group>)}
    <mesh position={[0, .22, 0]} castShadow><boxGeometry args={[1.35, .44, .8]} /><meshStandardMaterial color={charcoal} /></mesh>
  </group>
}

function Lobby() {
  const room = rooms[0]
  return <group>
    <mesh position={[0, 0, -1]} receiveShadow><boxGeometry args={[26, 0.18, 20]} /><meshStandardMaterial color={floorStone} roughness={0.55} metalness={0.04} /></mesh>
    {Array.from({ length: 11 }, (_, index) => -12.5 + index * 2.5).map((x) => <mesh key={x} position={[x, 0.1, -1]}><boxGeometry args={[0.018, 0.012, 19.8]} /><meshStandardMaterial color="#8f897f" roughness={0.9} /></mesh>)}
    {Array.from({ length: 9 }, (_, index) => -10 + index * 2.5).map((z) => <mesh key={z} position={[0, 0.105, z]}><boxGeometry args={[25.8, 0.012, 0.018]} /><meshStandardMaterial color="#d6cec0" roughness={0.9} /></mesh>)}
    <Wall position={[-13.15, 4.4, -1]} size={[0.3, 8.8, 20.2]} />
    <Wall position={[13.15, 4.4, -1]} size={[0.3, 8.8, 20.2]} />
    <Wall position={[-8.6, 4.4, -11.05]} size={[9.2, 8.8, 0.3]} />
    <Wall position={[8.6, 4.4, -11.05]} size={[9.2, 8.8, 0.3]} />
    <Wall position={[0, 8.85, -1]} size={[26.2, 0.22, 20.2]} color="#cbc6bd" />
    <mesh position={[0, 8.72, -2]}><boxGeometry args={[8.5, 0.08, 9]} /><meshPhysicalMaterial color="#9bb9bd" transparent opacity={0.5} transmission={0.18} roughness={0.12} metalness={0.08} /></mesh>
    {[-4.25, 0, 4.25].map((x) => <mesh key={x} position={[x, 8.63, -2]}><boxGeometry args={[0.1, 0.12, 9.1]} /><meshStandardMaterial color={charcoal} metalness={0.72} roughness={0.3} /></mesh>)}
    {[-9.8, 9.8].map((x) => <mesh key={x} position={[x, 0.23, -1]}><boxGeometry args={[0.16, 0.3, 19.5]} /><meshStandardMaterial color={charcoal} roughness={0.64} /></mesh>)}

    <ReceptionDesk /><Receptionist position={[-6.3, 0, -10.45]} /><LobbySculpture />
    <InteractiveBench position={[6.2, 0, -5.9]} length={2.1} />
    <InteractiveBench position={[6.2, 0, -7.7]} length={2.1} />

    <mesh position={[0, 5.18, -10.84]}><boxGeometry args={[7.7, 2.65, .08]} /><meshStandardMaterial color="#30322f" roughness={.62} /></mesh>
    <Text position={[0, 6.05, -10.78]} fontSize={0.48} letterSpacing={0.08} color="#eee6d9">HÀNH TRÌNH TRI THỨC</Text>
    <Text position={[0, 5.32, -10.77]} fontSize={0.18} letterSpacing={0.18} color="#d7b16c">CÁC PHÒNG TRƯNG BÀY  01 — 08  ↓</Text>
    <Text position={[0, 4.48, -10.77]} fontSize={0.2} maxWidth={6.5} textAlign="center" color="#c8c0b3">Bảy chương được tổ chức thành một hành trình mở — bạn có thể bắt đầu từ bất kỳ phòng nào.</Text>
    <DirectoryKiosk />
    <IndoorPlanter x={-10.2} z={5.1} /><IndoorPlanter x={10.2} z={5.1} />

    <Poster data={room.posters[0]} position={[-12.9, 2.7, -2.1]} rotationY={Math.PI / 2} />
    <Poster data={room.posters[1]} position={[12.9, 2.7, -2.1]} rotationY={-Math.PI / 2} />
    <SpotFixture position={[-10.1, 6.9, -2.1]} target={[-12.8, 2.5, -2.1]} />
    <SpotFixture position={[10.1, 6.9, -2.1]} target={[12.8, 2.5, -2.1]} />
    <rectAreaLight position={[0, 8.3, 1.2]} rotation={[-Math.PI / 2, 0, 0]} color="#fff0d4" intensity={4} width={8} height={3} />
  </group>
}

function CentralCorridor() {
  const wallSpans: Array<[number, number]> = [[-10, -18.6], [-23.4, -39.6], [-44.4, -60.6], [-65.4, -79.6], [-84.4, -91.2]]
  return <group>
    <mesh position={[0, 0, -50.6]} receiveShadow><boxGeometry args={[8.2, 0.17, 81.2]} /><meshStandardMaterial color="#9e978d" roughness={0.55} metalness={0.05} /></mesh>
    <Wall position={[0, 5.92, -50.6]} size={[8.3, 0.18, 81.2]} color="#c8c4bc" />
    {wallSpans.flatMap(([start, end]) => [-1, 1].map((side) => {
      const length = Math.abs(end - start)
      const z = (start + end) / 2
      return <group key={`${start}-${side}`}>
        <Wall position={[side * 4.14, 2.8, z]} size={[0.28, 5.6, length]} />
        <mesh position={[side * 3.96, 0.24, z]}><boxGeometry args={[0.12, 0.32, length]} /><meshStandardMaterial color={charcoal} roughness={0.65} /></mesh>
      </group>
    }))}
    {galleryLayouts.map((layout) => <group key={layout.roomId}>
      <Text position={[layout.side === 'left' ? -3.8 : 3.8, 1.35, layout.center.z + 3.25]} rotation={[0, layout.side === 'left' ? Math.PI / 2 : -Math.PI / 2, 0]} fontSize={0.11} letterSpacing={0.12} color={layout.accent}>PHÒNG {String(layout.roomId).padStart(2, '0')}</Text>
    </group>)}
    {[-21, -42, -63, -82].map((z, index) => <group key={`wayfinding-${z}`} position={[0, 4.82, z + 5.4]}>
      <mesh castShadow><boxGeometry args={[5.2, .66, .16]} /><meshStandardMaterial color={charcoal} metalness={.18} roughness={.54} /></mesh>
      <Text position={[0, .05, .09]} fontSize={.16} letterSpacing={.12} color="#eadfcd">← {String(index * 2 + 1).padStart(2, '0')}  ·  {String(index * 2 + 2).padStart(2, '0')} →</Text>
      <mesh position={[0, -.29, .09]}><boxGeometry args={[5.2, .04, .04]} /><meshStandardMaterial color="#a98752" emissive="#a98752" emissiveIntensity={.2} /></mesh>
    </group>)}
    {[-31.5, -52.5, -72.5].map((z) => <group key={`safety-${z}`} position={[3.94, 1.25, z]} rotation={[0, -Math.PI / 2, 0]}>
      <mesh><boxGeometry args={[.78, 1.28, .08]} /><meshStandardMaterial color="#8c3028" roughness={.65} /></mesh>
      <Text position={[0, .35, .05]} fontSize={.11} color="#f1e8d8">PCCC</Text>
      <mesh position={[0, -.15, .06]}><circleGeometry args={[.2, 16]} /><meshBasicMaterial color="#e8d8bd" /></mesh>
    </group>)}
    {Array.from({ length: 19 }, (_, index) => -13 - index * 4.1).map((z, index) => <group key={z}>
      <mesh position={[0, 5.7, z]}><boxGeometry args={[4.9, 0.1, 0.1]} /><meshStandardMaterial color={charcoal} metalness={0.65} roughness={0.32} /></mesh>
      {[-1.7, 0, 1.7].map((x) => <mesh key={x} position={[x, 5.55, z]}><cylinderGeometry args={[0.11, 0.15, 0.23, 10]} /><meshStandardMaterial color={charcoal} metalness={0.72} roughness={0.3} /></mesh>)}
      <pointLight position={[0, 5.35, z]} color="#ffeaca" intensity={index % 2 === 0 ? 3.4 : 2.6} distance={9} decay={2} />
    </group>)}
    <mesh position={[0, 2.65, -91.08]} castShadow receiveShadow><boxGeometry args={[8.3, 5.3, 0.3]} /><meshStandardMaterial color={charcoal} roughness={0.56} /></mesh>
    <Text position={[0, 3.18, -90.9]} fontSize={0.42} letterSpacing={0.12} color="#eee3d1">PHÒNG KẾT</Text>
    <Text position={[0, 2.5, -90.89]} fontSize={0.2} color="#b79a69">TƯƠNG LAI ĐƯỢC DỰNG XÂY HÔM NAY</Text>
  </group>
}

function BuildingShell() {
  return <group>
    <Wall position={[-21.45, 3.1, -41.2]} size={[0.5, 6.2, 101]} color="#d7d0c4" />
    <Wall position={[21.45, 3.1, -41.2]} size={[0.5, 6.2, 101]} color="#d7d0c4" />
    <Wall position={[0, 3.1, -91.55]} size={[43.4, 6.2, 0.5]} color="#d7d0c4" />
    {[-20.8, 20.8].flatMap((x) => [-28, -49, -70].map((z) => <mesh key={`${x}-${z}`} position={[x, 3.6, z]}><boxGeometry args={[0.08, 1.3, 5.4]} /><meshStandardMaterial color={bronze} metalness={0.45} roughness={0.4} /></mesh>))}
  </group>
}

export function MuseumInterior() {
  return <group>
    <BuildingShell />
    <Lobby />
    <CentralCorridor />
    {galleryLayouts.map((layout) => <GalleryRoom key={layout.roomId} layout={layout} />)}
  </group>
}
