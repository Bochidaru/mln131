import { rooms } from '../data/content'
import { useStore } from '../store/useStore'
export function Minimap() {
  const current = useStore((s) => s.currentRoom); const active = useStore((s) => s.activePoster)
  if (active) return null
  return <aside className="minimap" aria-label="Tiến trình tham quan">
    {rooms.map((room) => <div key={room.id} className={room.id === current ? 'active' : room.id < current ? 'visited' : ''}><i /><span>{room.id}</span></div>)}
  </aside>
}
