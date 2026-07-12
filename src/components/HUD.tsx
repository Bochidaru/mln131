import { rooms, uiText } from '../data/content'
import { useStore } from '../store/useStore'
export function HUD() {
  const focused = useStore((s) => s.focusedPoster); const active = useStore((s) => s.activePoster); const room = useStore((s) => s.currentRoom)
  const audioOn = useStore((s) => s.audioOn); const toggleAudio = useStore((s) => s.toggleAudio)
  if (active) return null
  return <div className="hud">
    <div className="room-indicator"><span>{String(room).padStart(2, '0')}</span><div><small>{rooms[room].subtitle}</small><strong>{rooms[room].name}</strong></div></div>
    <div className={`crosshair ${focused ? 'is-focused' : ''}`} aria-hidden="true" />
    {focused && <p className="interaction-hint">{uiText.view}</p>}
    <button className="audio-toggle" onClick={toggleAudio}>{audioOn ? '◖' : '×'}<span>{audioOn ? uiText.audioOn : uiText.audioOff}</span></button>
  </div>
}
