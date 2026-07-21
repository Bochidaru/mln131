import { rooms, uiText } from '../data/content'
import { useIsMobile } from '../hooks/useIsMobile'
import { useStore } from '../store/useStore'

function areaCopy(area: string) {
  if (area === 'grounds') return { index: 'EXT', overline: 'Khuôn viên', title: 'Cổng chính MLN131' }
  if (area === 'lobby') return { index: '00', overline: rooms[0].subtitle, title: rooms[0].name }
  if (area === 'corridor') return { index: '—', overline: 'Trục tham quan', title: 'Hành lang trung tâm' }
  const roomId = Number(area.replace('room-', ''))
  const room = rooms[roomId]
  return { index: String(roomId).padStart(2, '0'), overline: room?.subtitle ?? 'Phòng trưng bày', title: room?.name ?? 'Không gian chuyên đề' }
}

export function HUD() {
  const entered = useStore((state) => state.entered)
  const focused = useStore((state) => state.focusedPoster)
  const focusedSeat = useStore((state) => state.focusedSeat)
  const seated = useStore((state) => state.seated)
  const active = useStore((state) => state.activePoster)
  const area = useStore((state) => state.currentArea)
  const visited = useStore((state) => state.visitedRooms)
  const locked = useStore((state) => state.controlsLocked)
  const audioOn = useStore((state) => state.audioOn)
  const playerName = useStore((state) => state.playerName)
  const remotePlayers = useStore((state) => state.remotePlayers)
  const multiplayerConnected = useStore((state) => state.multiplayerConnected)
  const graphicsQuality = useStore((state) => state.graphicsQuality)
  const setGraphicsQuality = useStore((state) => state.setGraphicsQuality)
  const settingsOpen = useStore((state) => state.settingsOpen)
  const setSettingsOpen = useStore((state) => state.setSettingsOpen)
  const toggleAudio = useStore((state) => state.toggleAudio)
  const mobile = useIsMobile()
  const copy = areaCopy(area)

  if (!entered || active) return null

  return <div className="hud">
    <header className="hud-brand" aria-label="Bảo tàng Tri thức MLN131">
      <span>M</span><div><strong>MLN131</strong><small>Bảo tàng tri thức</small></div>
    </header>

    <section className="location-card" aria-live="polite">
      <span className="location-index">{copy.index}</span>
      <div><small>{copy.overline}</small><strong>{copy.title}</strong></div>
    </section>

    <aside className="lobby-players" aria-label="Người đang tham quan">
      <header><span>Trong bảo tàng</span><b>{Object.keys(remotePlayers).length + 1}</b></header>
      <ul>
        <li><i className={multiplayerConnected ? 'is-online' : ''} />{playerName || 'Bạn'} <small>Bạn</small></li>
        {Object.values(remotePlayers).map((player) => <li key={player.id}><i className="is-online" />{player.name}</li>)}
      </ul>
    </aside>

    <div className={`crosshair ${focused || focusedSeat || seated ? 'is-focused' : ''}`} aria-hidden="true"><i /></div>
    {focused && <p className="interaction-hint"><kbd>E</kbd>{uiText.view.replace('Nhấn E hoặc ', '')}</p>}
    {seated && <p className="interaction-hint"><kbd>E</kbd> Đứng dậy</p>}
    {!seated && !focused && focusedSeat && <p className="interaction-hint"><kbd>E</kbd> Ngồi xuống</p>}

    {!mobile && !locked && <div className="lock-hint">
      <span className="mouse-icon" aria-hidden="true" />
      <strong>Nhấp vào không gian để điều khiển</strong>
      <small>WASD di chuyển · Chuột quan sát · Q bật/tắt điều khiển · Space nhảy</small>
    </div>}

    <div className="tour-progress" aria-label={`Đã khám phá ${visited.filter((id) => id > 0).length} trên 8 phòng`}>
      <span>Hành trình</span><i><b style={{ width: `${visited.filter((id) => id > 0).length / 8 * 100}%` }} /></i><strong>{visited.filter((id) => id > 0).length}/8</strong>
    </div>

    <button className="audio-toggle" onClick={toggleAudio} aria-label={audioOn ? uiText.audioOn : uiText.audioOff}>
      <span className="audio-bars" data-on={audioOn}>{audioOn ? '▮▮▮' : '—'}</span>
      <span>{audioOn ? 'Âm thanh' : 'Đã tắt'}</span>
    </button>

    <div className="settings-wrap">
      <button className="settings-toggle" onClick={() => setSettingsOpen(!settingsOpen)} aria-expanded={settingsOpen}>⚙ <span>Cài đặt</span></button>
      {settingsOpen && <section className="settings-panel" aria-label="Cài đặt đồ họa">
        <strong>Đồ họa</strong>
        <p>Tùy chọn này áp dụng ngay lập tức.</p>
        <div>{(['auto', 'low', 'medium', 'high'] as const).map((quality) => <button key={quality} className={graphicsQuality === quality ? 'is-selected' : ''} onClick={() => setGraphicsQuality(quality)}>{({ auto: 'Tự động', low: 'Thấp', medium: 'Trung bình', high: 'Cao' } as const)[quality]}</button>)}</div>
      </section>}
    </div>
  </div>
}
