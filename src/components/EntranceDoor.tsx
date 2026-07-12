import { Text } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import { Group, MathUtils, type MeshStandardMaterial } from 'three'
import { entranceDoorState } from '../utils/doorState'

// Mặt phẳng của cửa, trùng vị trí bộ 4 tấm kính cũ trên mặt tiền.
const DOOR_Z = 9.3
// Kích thước một cánh trượt (đã phóng to cho bề thế hơn).
const LEAF_W = 2.6
const LEAF_H = 5.2
const LEAF_Y = 2.76 // tâm cánh theo trục Y (đáy 0.16, đỉnh 5.36)
// Khoảng trượt mỗi cánh khi mở hết — vừa đủ nép sau tấm kính cố định bên cạnh.
const TRAVEL = 2.45
// Vùng cảm biến quanh cửa (hai phía, như cảm biến vi sóng thật).
const SENSOR_HALF_X = 3.8
const SENSOR_HALF_Z = 4.0
// Tốc độ mở/đóng (đơn vị tiến trình 0..1 trên giây). Đóng chậm hơn để an toàn.
const OPEN_SPEED = 1.15
const CLOSE_SPEED = 0.9
// Giữ mở thêm sau khi rời vùng cảm biến (giây).
const HOLD_OPEN = 1.4

const aluminium = { color: '#c5cacf', metalness: 0.86, roughness: 0.33 }
const darkMetal = { color: '#2a2d31', metalness: 0.68, roughness: 0.42 }
const rubberSeal = { color: '#191b1d', metalness: 0.15, roughness: 0.88 }

type LeadEdge = 'left' | 'right' | null

// Một cánh/tấm kính có khung nhôm: đố đứng, thanh trên/dưới, kính, gioăng ở mép gặp.
function GlassLeaf({ width, height, lead = null }: { width: number; height: number; lead?: LeadEdge }) {
  const halfW = width / 2
  const halfH = height / 2
  return <group>
    <mesh>
      <boxGeometry args={[width - 0.13, height - 0.16, 0.03]} />
      <meshPhysicalMaterial color="#a6c0c5" roughness={0.05} metalness={0.08} transparent opacity={0.32} clearcoat={1} clearcoatRoughness={0.06} />
    </mesh>
    <mesh position={[0, halfH - 0.06, 0]}><boxGeometry args={[width, 0.12, 0.085]} /><meshStandardMaterial {...aluminium} /></mesh>
    <mesh position={[0, -halfH + 0.09, 0]}><boxGeometry args={[width, 0.18, 0.085]} /><meshStandardMaterial {...aluminium} /></mesh>
    {[-halfW + 0.045, halfW - 0.045].map((x) => <mesh key={x} position={[x, 0, 0]}>
      <boxGeometry args={[0.09, height, 0.09]} /><meshStandardMaterial {...aluminium} />
    </mesh>)}
    {lead && <mesh position={[lead === 'right' ? halfW - 0.02 : -halfW + 0.02, 0, 0.045]}>
      <boxGeometry args={[0.028, height - 0.24, 0.05]} /><meshStandardMaterial {...rubberSeal} />
    </mesh>}
  </group>
}

export function EntranceDoor() {
  const leftLeaf = useRef<Group>(null)
  const rightLeaf = useRef<Group>(null)
  const led = useRef<MeshStandardMaterial>(null)
  const progress = useRef(0) // tiến trình thô 0..1
  const lastInZone = useRef(-Infinity)
  const { camera } = useThree()

  useFrame((state, delta) => {
    const p = camera.position
    const inZone = Math.abs(p.x) < SENSOR_HALF_X && Math.abs(p.z - DOOR_Z) < SENSOR_HALF_Z
    if (inZone) lastInZone.current = state.clock.elapsedTime
    const shouldOpen = state.clock.elapsedTime - lastInZone.current < HOLD_OPEN

    const dir = shouldOpen ? 1 : -1
    const speed = shouldOpen ? OPEN_SPEED : CLOSE_SPEED
    // Dùng delta thật (không giới hạn) để cửa mở/đóng theo đúng thời gian thực
    // dù fps thấp; giá trị tiến trình đã kẹp 0..1 nên delta lớn chỉ làm cửa mở nhanh hơn.
    progress.current = MathUtils.clamp(progress.current + dir * speed * delta, 0, 1)

    // smoothstep -> khởi động và dừng mềm như motor cửa thật
    const eased = progress.current * progress.current * (3 - 2 * progress.current)
    const offset = eased * TRAVEL
    if (leftLeaf.current) leftLeaf.current.position.x = -LEAF_W / 2 - offset
    if (rightLeaf.current) rightLeaf.current.position.x = LEAF_W / 2 + offset
    entranceDoorState.openAmount = eased

    if (led.current) {
      // Đèn báo cảm biến: đỏ khi đóng -> xanh khi mở.
      const r = 0.95 - eased * 0.8
      const g = 0.14 + eased * 0.72
      led.current.color.setRGB(r, g, 0.12)
      led.current.emissive.setRGB(r, g, 0.12)
    }
  })

  const headerY = LEAF_Y + LEAF_H / 2 + 0.33

  return <group>
    {/* Hai tấm kính cố định (sidelight) — nơi cánh trượt nép vào khi mở */}
    <group position={[-3.7, LEAF_Y, DOOR_Z - 0.1]}><GlassLeaf width={2.45} height={LEAF_H} /></group>
    <group position={[3.7, LEAF_Y, DOOR_Z - 0.1]}><GlassLeaf width={2.45} height={LEAF_H} /></group>

    {/* Hai cánh trượt bi-parting, gặp nhau ở giữa khi đóng */}
    <group ref={leftLeaf} position={[-LEAF_W / 2, LEAF_Y, DOOR_Z + 0.07]}><GlassLeaf width={LEAF_W} height={LEAF_H} lead="right" /></group>
    <group ref={rightLeaf} position={[LEAF_W / 2, LEAF_Y, DOOR_Z + 0.07]}><GlassLeaf width={LEAF_W} height={LEAF_H} lead="left" /></group>

    {/* Đố đứng hai bên khung cửa */}
    {[-5.05, 5.05].map((x) => <mesh key={x} position={[x, LEAF_Y + 0.1, DOOR_Z]} castShadow>
      <boxGeometry args={[0.16, LEAF_H + 0.26, 0.26]} /><meshStandardMaterial {...aluminium} />
    </mesh>)}

    {/* Hộp cơ cấu (header) phía trên chứa motor và ray trượt */}
    <mesh position={[0, headerY, DOOR_Z]} castShadow><boxGeometry args={[10.4, 0.5, 0.36]} /><meshStandardMaterial {...aluminium} /></mesh>
    <Text position={[0, headerY + 0.03, DOOR_Z + 0.185]} fontSize={0.17} letterSpacing={0.2} color="#8a9099" anchorX="center" anchorY="middle">CỬA TỰ ĐỘNG  ·  AUTOMATIC</Text>

    {/* Cảm biến chuyển động gắn dưới mép trước header + đèn báo */}
    <group position={[0, headerY - 0.34, DOOR_Z + 0.21]}>
      <mesh castShadow><boxGeometry args={[0.7, 0.14, 0.13]} /><meshStandardMaterial {...darkMetal} /></mesh>
      <mesh position={[0, -0.04, 0.055]} rotation={[0.5, 0, 0]}><boxGeometry args={[0.54, 0.05, 0.02]} /><meshStandardMaterial color="#0a0c0e" metalness={0.2} roughness={0.25} /></mesh>
      <mesh position={[0.26, 0, 0.08]}><sphereGeometry args={[0.024, 10, 8]} /><meshStandardMaterial ref={led} emissiveIntensity={2.6} toneMapped={false} /></mesh>
    </group>

    {/* Nhãn cảnh báo cửa tự động dán trên kính cố định */}
    {[-3.7, 3.7].map((x) => <Text key={x} position={[x, 1.55, DOOR_Z + 0.09]} fontSize={0.09} maxWidth={1.6} textAlign="center" lineHeight={1.15} letterSpacing={0.04} color="#b7451f" anchorX="center" anchorY="middle">CẨN THẬN{'\n'}CỬA TỰ ĐỘNG</Text>)}
  </group>
}
