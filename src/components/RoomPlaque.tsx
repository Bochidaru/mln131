import { Text } from '@react-three/drei'
export function RoomPlaque({ name, subtitle, z }: { name: string; subtitle: string; z: number }) {
  return <group position={[0, 3.2, z + 4.86]}>
    <mesh position={[0, 0, 0.02]}><boxGeometry args={[4.8, 0.82, 0.05]} /><meshStandardMaterial color="#1A1210" metalness={0.25} roughness={0.65} /></mesh>
    <Text position={[0, 0.12, 0.06]} fontSize={0.24} maxWidth={4.3} textAlign="center" color="#F0E6D2" anchorX="center" anchorY="middle">{name.toUpperCase()}</Text>
    <Text position={[0, -0.22, 0.06]} fontSize={0.12} letterSpacing={0.16} color="#B8863B" anchorX="center" anchorY="middle">{subtitle.toUpperCase()}</Text>
  </group>
}
