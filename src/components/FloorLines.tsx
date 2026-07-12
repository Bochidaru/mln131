import { Instance, Instances } from '@react-three/drei'

export interface FloorLine {
  position: [number, number, number]
  scale: [number, number, number]
  color: string
}

export function FloorLines({ lines }: { lines: FloorLine[] }) {
  return <Instances limit={lines.length} frustumCulled={false}>
    <boxGeometry />
    <meshStandardMaterial roughness={0.9} />
    {lines.map((line, index) => <Instance key={index} position={line.position} scale={line.scale} color={line.color} />)}
  </Instances>
}
