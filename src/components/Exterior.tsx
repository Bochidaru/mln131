import { Cloud, Clouds, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Color, MeshBasicMaterial, type MeshStandardMaterial } from 'three'
import { usePbrMaps } from '../hooks/usePbrMaps'
import { getWaterBump } from '../utils/waterBump'
import { ClothBanner } from './ClothBanner'

const stone = '#d8d0c2'
const paleStone = '#e9e3d8'
const charcoal = '#252725'
const bronze = '#8c6a3e'
const red = '#8f2f24'

function Tree({ x, z, scale = 1 }: { x: number; z: number; scale?: number }) {
  const crownColors = useMemo(() => ['#31543a', '#3d6544', '#294b35'].map((color) => new Color(color)), [])
  return <group position={[x, 0, z]} scale={scale}>
    <mesh position={[0, 2.05, 0]} castShadow><cylinderGeometry args={[0.18, 0.28, 4.1, 10]} /><meshStandardMaterial color="#6d5137" roughness={1} /></mesh>
    {[
      [0, 4.25, 0, 1.4], [-0.72, 3.85, 0.15, 1], [0.68, 3.9, 0.05, 1.08],
      [-0.2, 4.75, -0.35, 1.02], [0.28, 4.55, 0.7, 0.9],
    ].map(([px, py, pz, size], index) => <mesh key={index} position={[px, py, pz]} castShadow>
      <icosahedronGeometry args={[size, 2]} /><meshStandardMaterial color={crownColors[index % crownColors.length]} roughness={0.96} />
    </mesh>)}
    <mesh position={[0, 0.28, 0]} receiveShadow><cylinderGeometry args={[1.15, 1.25, 0.52, 12]} /><meshStandardMaterial color="#b9b0a0" roughness={0.9} /></mesh>
    <mesh position={[0, 0.56, 0]}><cylinderGeometry args={[0.92, 0.92, 0.08, 12]} /><meshStandardMaterial color="#594737" roughness={1} /></mesh>
  </group>
}

function LampPost({ x, z }: { x: number; z: number }) {
  return <group position={[x, 0, z]}>
    <mesh position={[0, 1.75, 0]} castShadow><cylinderGeometry args={[0.055, 0.09, 3.5, 10]} /><meshStandardMaterial color={charcoal} metalness={0.78} roughness={0.34} /></mesh>
    <mesh position={[0, 3.58, 0]} castShadow><cylinderGeometry args={[0.24, 0.19, 0.22, 12]} /><meshStandardMaterial color={charcoal} metalness={0.7} roughness={0.3} /></mesh>
    <mesh position={[0, 3.46, 0]}><cylinderGeometry args={[0.16, 0.16, 0.08, 12]} /><meshStandardMaterial color="#ffe9b0" emissive="#ffd47d" emissiveIntensity={2.5} /></mesh>
    <mesh position={[0, 0.09, 0]}><cylinderGeometry args={[0.22, 0.28, 0.18, 12]} /><meshStandardMaterial color={charcoal} /></mesh>
  </group>
}

function Bench({ x, z, rotation = 0 }: { x: number; z: number; rotation?: number }) {
  return <group position={[x, 0.48, z]} rotation={[0, rotation, 0]}>
    {[ -0.42, -0.14, 0.14, 0.42 ].map((depth) => <mesh key={depth} position={[0, 0, depth]} castShadow>
      <boxGeometry args={[2.6, 0.1, 0.19]} /><meshStandardMaterial color="#795235" roughness={0.72} />
    </mesh>)}
    {[-1.05, 1.05].map((side) => <group key={side} position={[side, -0.28, 0]}>
      <mesh><boxGeometry args={[0.1, 0.56, 0.75]} /><meshStandardMaterial color={charcoal} metalness={0.72} roughness={0.38} /></mesh>
      <mesh position={[0, 0.28, 0]}><boxGeometry args={[0.26, 0.08, 0.78]} /><meshStandardMaterial color={charcoal} /></mesh>
    </group>)}
  </group>
}

function ReflectingPool({ x }: { x: number }) {
  const water = useRef<MeshStandardMaterial>(null)
  // Both pools share the bump texture, so each advances it at half speed.
  useFrame((_, delta) => {
    const bump = water.current?.bumpMap
    if (bump) {
      bump.offset.x += delta * 0.004
      bump.offset.y += delta * 0.007
    }
  })
  return <group position={[x, 0, 20]}>
    <mesh position={[0, 0.08, 0]} receiveShadow><boxGeometry args={[7.1, 0.16, 10.8]} /><meshStandardMaterial color="#aca79b" roughness={0.9} /></mesh>
    <mesh position={[0, 0.17, 0]}><boxGeometry args={[6.72, 0.06, 10.42]} /><meshStandardMaterial ref={water} color="#41707c" roughness={0.06} metalness={0.12} bumpMap={getWaterBump()} bumpScale={2.2} transparent opacity={0.93} /></mesh>
    {[-3.45, 3.45].map((edge) => <mesh key={edge} position={[edge, 0.28, 0]} castShadow><boxGeometry args={[0.18, 0.38, 11]} /><meshStandardMaterial color={paleStone} roughness={0.78} /></mesh>)}
    {[-5.35, 5.35].map((edge) => <mesh key={edge} position={[0, 0.28, edge]} castShadow><boxGeometry args={[7.1, 0.38, 0.18]} /><meshStandardMaterial color={paleStone} roughness={0.78} /></mesh>)}
    {[-2.1, 0, 2.1].map((offset) => <mesh key={offset} position={[0, 0.34, offset]}>
      <cylinderGeometry args={[0.04, 0.06, 0.28, 8]} /><meshStandardMaterial color={bronze} metalness={0.8} roughness={0.25} />
    </mesh>)}
  </group>
}

function OpenGatePanel({ side }: { side: -1 | 1 }) {
  return <group position={[side * 6.75, 0, 30.45]} rotation={[0, side * -0.92, 0]}>
    <mesh position={[side * -2.1, 1.45, 0]} castShadow><boxGeometry args={[4.2, 0.09, 0.09]} /><meshStandardMaterial color={charcoal} metalness={0.82} roughness={0.26} /></mesh>
    <mesh position={[side * -2.1, 3.05, 0]} castShadow><boxGeometry args={[4.2, 0.09, 0.09]} /><meshStandardMaterial color={charcoal} metalness={0.82} roughness={0.26} /></mesh>
    {[0.25, 0.85, 1.45, 2.05, 2.65, 3.25, 3.85].map((distance) => <mesh key={distance} position={[side * -distance, 2.25, 0]} castShadow>
      <boxGeometry args={[0.055, 2.65, 0.055]} /><meshStandardMaterial color={charcoal} metalness={0.82} roughness={0.25} />
    </mesh>)}
  </group>
}

function EntranceGate() {
  return <group>
    {[-1, 1].map((sideValue) => {
      const side = sideValue as -1 | 1
      return <group key={side}>
        <mesh position={[side * 7.4, 2.05, 31]} castShadow receiveShadow><boxGeometry args={[1.45, 4.1, 1.15]} /><meshStandardMaterial color={stone} roughness={0.84} /></mesh>
        <mesh position={[side * 7.4, 4.18, 31]} castShadow><boxGeometry args={[1.72, 0.18, 1.38]} /><meshStandardMaterial color={paleStone} roughness={0.78} /></mesh>
        <mesh position={[side * 15.15, 1.15, 31]} castShadow receiveShadow><boxGeometry args={[14, 2.3, 0.75]} /><meshStandardMaterial color={stone} roughness={0.88} /></mesh>
        <mesh position={[side * 15.15, 2.35, 31]} castShadow><boxGeometry args={[14.2, 0.14, 0.9]} /><meshStandardMaterial color={paleStone} roughness={0.82} /></mesh>
        <Text position={[side * 15, 1.2, 31.4]} fontSize={0.34} letterSpacing={0.13} color={charcoal} anchorX="center" anchorY="middle">
          {side < 0 ? 'TRI THỨC  ·  LÝ LUẬN' : 'THỰC TIỄN  ·  TƯƠNG LAI'}
        </Text>
      </group>
    })}
    <mesh position={[0, 4.62, 31]} castShadow><boxGeometry args={[15.5, 0.72, 0.82]} /><meshStandardMaterial color={charcoal} metalness={0.2} roughness={0.58} /></mesh>
    <Text position={[0, 4.65, 31.44]} fontSize={0.38} letterSpacing={0.11} color="#f0e8d9" anchorX="center" anchorY="middle">BẢO TÀNG TRI THỨC  ·  MLN131</Text>
    <OpenGatePanel side={-1} /><OpenGatePanel side={1} />
    {[-1, 1].map((side) => <group key={side} position={[side * 7.4, 0, 31]}>
      <mesh position={[0, 5.55, 0]} castShadow><cylinderGeometry args={[0.045, 0.065, 2.9, 8]} /><meshStandardMaterial color={charcoal} metalness={0.75} roughness={0.3} /></mesh>
      <mesh position={[0, 7.02, 0]}><sphereGeometry args={[0.09, 10, 8]} /><meshStandardMaterial color={bronze} metalness={0.85} roughness={0.25} /></mesh>
      <ClothBanner pinned="left" width={2.1} height={1.25} color="#a3271c" amplitude={0.16} speed={1.6} position={[1.1, 6.3, 0]} />
    </group>)}
  </group>
}

function MuseumFacade() {
  const columns = [-20.2, -16.2, -12.2, -8.2, 8.2, 12.2, 16.2, 20.2]
  return <group>
    <mesh position={[0, 0.38, 8.5]} receiveShadow><boxGeometry args={[44, 0.76, 1.6]} /><meshStandardMaterial color="#363532" roughness={0.72} /></mesh>
    {[-14.7, 14.7].map((x) => <mesh key={x} position={[x, 5.15, 8.55]} castShadow receiveShadow>
      <boxGeometry args={[14.6, 9.55, 1.2]} /><meshStandardMaterial color={stone} roughness={0.86} />
    </mesh>)}
    <mesh position={[0, 8.15, 8.5]} castShadow><boxGeometry args={[14.8, 3.55, 1.2]} /><meshStandardMaterial color={paleStone} roughness={0.82} /></mesh>
    {[-4.35, 4.35].map((x) => <mesh key={x} position={[x, 4.35, 8.66]} receiveShadow><boxGeometry args={[5.5, 6.65, 0.4]} /><meshPhysicalMaterial color="#9fb6bb" metalness={0.08} roughness={0.1} transparent opacity={0.4} clearcoat={0.85} /></mesh>)}
    <mesh position={[0, 5.94, 8.66]} receiveShadow><boxGeometry args={[3.2, 3.47, 0.4]} /><meshPhysicalMaterial color="#9fb6bb" metalness={0.08} roughness={0.1} transparent opacity={0.4} clearcoat={0.85} /></mesh>
    {[-5.35, -3.5, -1.6, 1.6, 3.5, 5.35].map((x) => <mesh key={x} position={[x, 4.35, 8.93]} castShadow>
      <boxGeometry args={[0.09, 6.6, 0.12]} /><meshStandardMaterial color="#353b3b" metalness={0.82} roughness={0.25} />
    </mesh>)}
    <mesh position={[0, 6.2, 11]} castShadow><boxGeometry args={[11.5, 0.28, 5.2]} /><meshStandardMaterial color={bronze} metalness={0.62} roughness={0.32} /></mesh>
    {[-5.1, 5.1].map((x) => <mesh key={x} position={[x, 5.15, 11.2]} castShadow><boxGeometry args={[0.13, 2.1, 0.13]} /><meshStandardMaterial color={bronze} metalness={0.8} roughness={0.25} /></mesh>)}
    {columns.map((x) => <group key={x} position={[x, 0, 9.28]}>
      <mesh position={[0, 5.1, 0]} castShadow receiveShadow><boxGeometry args={[1.02, 9.6, 1.12]} /><meshStandardMaterial color={paleStone} roughness={0.78} /></mesh>
      <mesh position={[0, 0.44, 0.08]} castShadow><boxGeometry args={[1.42, 0.34, 1.42]} /><meshStandardMaterial color="#c7bfb2" roughness={0.82} /></mesh>
      <mesh position={[0, 9.83, 0]} castShadow><boxGeometry args={[1.42, 0.34, 1.42]} /><meshStandardMaterial color="#c7bfb2" roughness={0.82} /></mesh>
    </group>)}
    <mesh position={[0, 10.08, 8.48]} castShadow><boxGeometry args={[44.8, 0.55, 1.75]} /><meshStandardMaterial color="#302f2d" roughness={0.66} /></mesh>
    <mesh position={[0, 9.7, 9.42]} castShadow><boxGeometry args={[24, 0.08, 0.14]} /><meshStandardMaterial color={bronze} metalness={0.8} roughness={0.25} /></mesh>
    {[-14.7, 14.7].map((x, index) => <group key={x}>
      <mesh position={[x, 5.25, 9.18]} castShadow><boxGeometry args={[2.45, 5.8, 0.1]} /><meshStandardMaterial color={index === 0 ? '#8f2f24' : '#323735'} roughness={0.66} /></mesh>
      <Text position={[x, 5.25, 9.25]} fontSize={0.32} maxWidth={1.9} textAlign="center" lineHeight={1.2} letterSpacing={0.08} color="#eee5d6" anchorX="center" anchorY="middle">{index === 0 ? 'TRI\nTHỨC' : 'TƯƠNG\nLAI'}</Text>
    </group>)}
    {[-18.2, -11.3, 11.3, 18.2].flatMap((x) => [2.1, 4.45, 6.8].map((y) => <mesh key={`${x}-${y}`} position={[x, y, 9.18]}><boxGeometry args={[5.7, 0.025, 0.03]} /><meshStandardMaterial color="#aca496" roughness={0.9} /></mesh>))}
    <Text position={[0, 8.52, 9.16]} fontSize={0.78} maxWidth={20} letterSpacing={0.09} color={charcoal} anchorX="center" anchorY="middle">
      BẢO TÀNG TRI THỨC
    </Text>
    <Text position={[0, 7.5, 9.16]} fontSize={0.52} letterSpacing={0.3} color={red} anchorX="center" anchorY="middle">MLN131</Text>
    <Text position={[0, 5.83, 13.6]} fontSize={0.18} letterSpacing={0.2} color="#f6ecda" anchorX="center" anchorY="middle">LỐI VÀO  ·  ENTRANCE</Text>
    {[-3.8, -1.95, 1.95, 3.8].map((x) => <mesh key={x} position={[x, 2.55, 9.28]}>
      <boxGeometry args={[1.72, 4.8, 0.12]} /><meshPhysicalMaterial color="#8ba4a8" roughness={0.08} metalness={0.12} transparent opacity={0.45} clearcoat={1} />
    </mesh>)}
  </group>
}

function ArrivalDetails() {
  return <>
    {[-1, 1].flatMap((side) => [17, 25, 37].map((z) => <LampPost key={`${side}-${z}`} x={side * 7.2} z={z} />))}
    <Bench x={-17} z={27} rotation={Math.PI / 2} /><Bench x={17} z={27} rotation={-Math.PI / 2} />
    {[[-18, 18], [18, 18], [-19, 36], [19, 36]].map(([x, z], index) => <Tree key={index} x={x} z={z} scale={index > 1 ? 0.9 : 1} />)}
    {[-4.7, 4.7].flatMap((x) => [11, 13.1, 28.2].map((z) => <mesh key={`${x}-${z}`} position={[x, 0.38, z]} castShadow>
      <cylinderGeometry args={[0.1, 0.14, 0.76, 10]} /><meshStandardMaterial color={charcoal} metalness={0.66} roughness={0.36} />
    </mesh>))}
    <group position={[-20.8, 0, 11.8]}>
      <mesh position={[0, 1.05, 0]} castShadow><boxGeometry args={[2.7, 2.1, 0.35]} /><meshStandardMaterial color={charcoal} roughness={0.62} /></mesh>
      <Text position={[0, 1.45, 0.2]} fontSize={0.19} letterSpacing={0.12} color="#e9dfcd">MLN131</Text>
      <Text position={[0, 1.05, 0.2]} fontSize={0.12} color="#e9dfcd" maxWidth={2.2} textAlign="center">MỞ CỬA 08:00 — 21:00</Text>
      <Text position={[0, 0.72, 0.2]} fontSize={0.1} color="#bda77e" maxWidth={2.2} textAlign="center">VÀO CỬA TỰ DO</Text>
    </group>
  </>
}

export function Exterior() {
  const grass = usePbrMaps('grass', 30, 30)
  const paving = usePbrMaps('paving', 9, 8.6)
  const pavingPath = usePbrMaps('paving', 2, 8.6)

  return <group>
    <mesh position={[0, -0.16, -14]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[140, 140]} /><meshStandardMaterial {...grass} color="#c9cfba" roughness={1} /></mesh>
    <mesh position={[0, -0.04, 25]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[44, 42]} /><meshStandardMaterial {...paving} color="#d8d2c5" roughness={1} /></mesh>
    <mesh position={[0, -0.01, 25]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[9.5, 42]} /><meshStandardMaterial {...pavingPath} color="#efe8d8" roughness={1} /></mesh>
    <ReflectingPool x={-11.6} /><ReflectingPool x={11.6} />
    <EntranceGate />
    <MuseumFacade />
    <ArrivalDetails />
    <Clouds material={MeshBasicMaterial} limit={140}>
      <Cloud seed={4} segments={14} bounds={[16, 3, 7]} volume={10} color="#f6efe2" opacity={0.5} speed={0.1} fade={25} position={[-38, 46, -18]} />
      <Cloud seed={9} segments={12} bounds={[13, 3, 6]} volume={9} color="#f3ede2" opacity={0.45} speed={0.08} fade={25} position={[26, 52, 26]} />
      <Cloud seed={14} segments={12} bounds={[18, 4, 7]} volume={11} color="#f6f0e4" opacity={0.4} speed={0.12} fade={25} position={[8, 56, -66]} />
    </Clouds>
  </group>
}
