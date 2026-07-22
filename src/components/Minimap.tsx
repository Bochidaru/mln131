import { useEffect } from 'react'
import { galleryLayouts } from '../data/layout'
import { rooms, uiText } from '../data/content'
import { useIsMobile } from '../hooks/useIsMobile'
import { useStore } from '../store/useStore'

const view = { left: 18, top: 18, width: 184, height: 300 }
const bounds = { minX: -23, maxX: 23, minZ: -93, maxZ: 46 }
const mapX = (x: number) => view.left + (x - bounds.minX) / (bounds.maxX - bounds.minX) * view.width
const mapY = (z: number) => view.top + (bounds.maxZ - z) / (bounds.maxZ - bounds.minZ) * view.height
const rectFor = (minX: number, maxX: number, minZ: number, maxZ: number) => ({
  x: mapX(minX), y: mapY(maxZ), width: mapX(maxX) - mapX(minX), height: mapY(minZ) - mapY(maxZ),
})

export function Minimap() {
  const entered = useStore((state) => state.entered)
  const active = useStore((state) => state.activePoster)
  const currentArea = useStore((state) => state.currentArea)
  const visited = useStore((state) => state.visitedRooms)
  const pose = useStore((state) => state.playerPose)
  const expanded = useStore((state) => state.mapExpanded)
  const toggleMap = useStore((state) => state.toggleMap)
  const setMapExpanded = useStore((state) => state.setMapExpanded)
  const duel = useStore((state) => state.duel)
  const mobile = useIsMobile()

  useEffect(() => {
    if (mobile) setMapExpanded(false)
  }, [mobile, setMapExpanded])

  if (!entered || active || duel) return null

  const playerX = mapX(Math.max(bounds.minX, Math.min(bounds.maxX, pose.x)))
  const playerY = mapY(Math.max(bounds.minZ, Math.min(bounds.maxZ, pose.z)))
  const screenAngle = Math.atan2(-pose.dirZ, pose.dirX) * 180 / Math.PI + 90
  const currentRoom = currentArea.startsWith('room-') ? Number(currentArea.slice(5)) : currentArea === 'lobby' ? 0 : null
  const currentLabel = currentArea === 'grounds' ? 'Cổng chính' : currentArea === 'corridor' ? 'Hành lang trung tâm' : currentRoom !== null ? rooms[currentRoom].name : 'Khuôn viên'

  return <aside className={`minimap ${expanded ? 'is-expanded' : 'is-collapsed'}`} aria-label={uiText.map} data-current-area={currentArea} data-player-x={pose.x.toFixed(2)} data-player-z={pose.z.toFixed(2)}>
    <button className="map-header" onClick={toggleMap} aria-expanded={expanded}>
      <span><i /> {uiText.map}</span><b>{expanded ? 'Thu gọn' : 'Mở bản đồ'}</b>
    </button>
    {expanded && <>
      <svg viewBox="0 0 220 336" role="img" aria-label="Mặt bằng bảo tàng và vị trí hiện tại">
        <defs>
          <pattern id="map-grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" /></pattern>
        </defs>
        <rect className="map-grid" x="0" y="0" width="220" height="336" />
        <path className="map-route" d={`M ${mapX(0)} ${mapY(45)} L ${mapX(0)} ${mapY(-91)}`} />
        <rect className={`map-space ${currentArea === 'grounds' ? 'active' : ''}`} {...rectFor(-5.5, 5.5, 9, 46)} rx="2" />
        <rect className={`map-space lobby ${currentRoom === 0 ? 'active' : visited.includes(0) ? 'visited' : ''}`} {...rectFor(-13, 13, -11, 9)} rx="2" />
        <text x={mapX(0)} y={mapY(-2)} className="map-label">SẢNH</text>
        <rect className={`map-space corridor ${currentArea === 'corridor' ? 'active' : ''}`} {...rectFor(-4, 4, -91, -10)} />
        {galleryLayouts.map((gallery) => {
          const { roomId, center, size } = gallery
          const activeRoom = currentRoom === roomId
          const roomRect = rectFor(center.x - size.width / 2, center.x + size.width / 2, center.z - size.depth / 2, center.z + size.depth / 2)
          return <g key={roomId}>
            <rect className={`map-space gallery ${activeRoom ? 'active' : visited.includes(roomId) ? 'visited' : ''}`} {...roomRect} rx="2" />
            <text x={mapX(center.x)} y={mapY(center.z) + 3} className="map-label">{String(roomId).padStart(2, '0')}</text>
          </g>
        })}
        <g className="player-marker" transform={`translate(${playerX} ${playerY}) rotate(${screenAngle})`}>
          <circle r="8" /><path d="M0 -7 L5 6 L0 3 L-5 6 Z" />
        </g>
        <text className="map-north" x="202" y="18">B</text>
      </svg>
      <div className="map-current"><span>Bạn đang ở</span><strong>{currentLabel}</strong></div>
      <div className="map-legend"><span><i className="here" /> Hiện tại</span><span><i className="seen" /> Đã ghé</span></div>
    </>}
  </aside>
}
