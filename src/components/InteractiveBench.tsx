import { useEffect, useMemo } from 'react'
import { Euler, Vector3 } from 'three'
import type { SeatPose } from '../store/useStore'
import { registerSeat } from '../utils/seatRegistry'

const metal = { color: '#2c2f34', metalness: 0.72, roughness: 0.42 }
const SEAT_Y = 0.46 // cao độ mặt ghế
const EYE_ABOVE_SEAT = 0.74 // mắt cao hơn mặt ghế khi ngồi

// Khung sắt hai đầu ghế: chân trước/sau, thanh đỡ mặt, trụ tựa lưng nghiêng, tay vịn.
function BenchFrame({ x }: { x: number }) {
  return <group position={[x, 0, 0]}>
    <mesh position={[0, SEAT_Y / 2, 0.21]} castShadow><boxGeometry args={[0.07, SEAT_Y, 0.08]} /><meshStandardMaterial {...metal} /></mesh>
    <mesh position={[0, SEAT_Y / 2, -0.19]} castShadow><boxGeometry args={[0.07, SEAT_Y, 0.08]} /><meshStandardMaterial {...metal} /></mesh>
    <mesh position={[0, SEAT_Y - 0.02, 0.01]} castShadow><boxGeometry args={[0.07, 0.07, 0.52]} /><meshStandardMaterial {...metal} /></mesh>
    <mesh position={[0, 0.74, -0.24]} rotation={[0.17, 0, 0]} castShadow><boxGeometry args={[0.07, 0.58, 0.07]} /><meshStandardMaterial {...metal} /></mesh>
    <mesh position={[0, 0.64, 0.03]} castShadow><boxGeometry args={[0.06, 0.06, 0.5]} /><meshStandardMaterial {...metal} /></mesh>
    <mesh position={[0, 0.6, 0.24]} castShadow><boxGeometry args={[0.06, 0.14, 0.06]} /><meshStandardMaterial {...metal} /></mesh>
  </group>
}

export function InteractiveBench({ position, rotation = 0, length = 1.9, wood = '#7a5a34' }: {
  position: [number, number, number]
  rotation?: number
  length?: number
  wood?: string
}) {
  const woodColor = wood
  const halfLen = length / 2

  const pose = useMemo<SeatPose>(() => {
    const [px, , pz] = position
    const euler = new Euler(0, rotation, 0)
    const forward = new Vector3(0, 0, 1).applyEuler(euler)
    const eye: [number, number, number] = [px + forward.x * 0.03, SEAT_Y + EYE_ABOVE_SEAT, pz + forward.z * 0.03]
    return {
      id: `seat-${px.toFixed(2)}-${pz.toFixed(2)}`,
      center: [px, pz],
      eye,
      look: [eye[0] + forward.x * 3, eye[1] - 0.28, eye[2] + forward.z * 3],
    }
  }, [position, rotation])

  useEffect(() => registerSeat(pose), [pose])

  return <group position={position} rotation={[0, rotation, 0]}>
    <BenchFrame x={-(halfLen - 0.14)} />
    <BenchFrame x={halfLen - 0.14} />
    {[-0.18, -0.06, 0.06, 0.18].map((z) => <mesh key={z} position={[0, SEAT_Y, z]} castShadow receiveShadow>
      <boxGeometry args={[length, 0.05, 0.09]} /><meshStandardMaterial color={woodColor} roughness={0.68} />
    </mesh>)}
    {[0.58, 0.72, 0.86].map((y, i) => <mesh key={y} position={[0, y, -0.24 - i * 0.028]} rotation={[0.17, 0, 0]} castShadow>
      <boxGeometry args={[length, 0.07, 0.045]} /><meshStandardMaterial color={woodColor} roughness={0.68} />
    </mesh>)}
  </group>
}
