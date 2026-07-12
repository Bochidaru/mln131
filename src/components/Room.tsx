import type { RoomData } from '../data/content'
import { Poster } from './Poster'
import { RoomPlaque } from './RoomPlaque'

export function Room({ room }: { room: RoomData }) {
  const z = -room.id * 10
  return <group>
    <mesh position={[0, 0, z]}><boxGeometry args={[12, 0.16, 10]} /><meshStandardMaterial color="#4A3428" roughness={0.8} /></mesh>
    <mesh position={[-5.92, 2.5, z]}><boxGeometry args={[0.16, 5, 10]} /><meshStandardMaterial color="#1A1210" roughness={0.92} /></mesh>
    <mesh position={[5.92, 2.5, z]}><boxGeometry args={[0.16, 5, 10]} /><meshStandardMaterial color="#1A1210" roughness={0.92} /></mesh>
    <mesh position={[0, 5, z]}><boxGeometry args={[12, 0.12, 10]} /><meshStandardMaterial color="#1A1210" /></mesh>
    {room.id === 8 && <><mesh position={[-3.7, 2.5, z - 4.92]}><boxGeometry args={[4.6, 5, 0.16]} /><meshStandardMaterial color="#1A1210" /></mesh><mesh position={[3.7, 2.5, z - 4.92]}><boxGeometry args={[4.6, 5, 0.16]} /><meshStandardMaterial color="#1A1210" /></mesh></>}
    <RoomPlaque name={room.name} subtitle={room.subtitle} z={z} />
    {room.posters.map((item, index) => {
      const left = index % 2 === 0
      const offset = room.posters.length === 1 ? 0 : (Math.floor(index / 2) * 3.4 - 1.7)
      return <Poster key={item.id} data={item} position={[left ? -5.78 : 5.78, 2.5, z + offset]} rotationY={left ? Math.PI / 2 : -Math.PI / 2} lit={room.id < 2} />
    })}
    <pointLight position={[0, 4.5, z]} color="#F0E6D2" intensity={7} distance={9} decay={2} />
  </group>
}
