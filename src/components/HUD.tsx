import { rooms, uiText } from '../data/content'
import { useEffect, useState } from 'react'
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
  const mouseSensitivity = useStore((state) => state.mouseSensitivity)
  const setMouseSensitivity = useStore((state) => state.setMouseSensitivity)
  const settingsOpen = useStore((state) => state.settingsOpen)
  const setSettingsOpen = useStore((state) => state.setSettingsOpen)
  const toggleAudio = useStore((state) => state.toggleAudio)
  const score = useStore((state) => state.score)
  const quizRoomId = useStore((state) => state.quizRoomId)
  const quizCooldowns = useStore((state) => state.quizCooldowns)
  const duel = useStore((state) => state.duel)
  const mobile = useIsMobile()
  const copy = areaCopy(area)
  const [now, setNow] = useState(0)
  const cooldownEndsAt = quizRoomId === null ? 0 : quizCooldowns[quizRoomId] ?? 0
  const cooldownSeconds = Math.max(0, Math.ceil((cooldownEndsAt - now) / 1000))
  const cooldownLabel = `${String(Math.floor(cooldownSeconds / 60)).padStart(2, '0')}:${String(cooldownSeconds % 60).padStart(2, '0')}`

  useEffect(() => {
    if (quizRoomId === null) return
    const frame = requestAnimationFrame(() => setNow(Date.now()))
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => {
      cancelAnimationFrame(frame)
      window.clearInterval(timer)
    }
  }, [quizRoomId])

  if (!entered || active || duel) return null

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
        <li><i className={multiplayerConnected ? 'is-online' : ''} />{playerName || 'Bạn'} <small>{score} điểm</small></li>
        {Object.values(remotePlayers).map((player) => <li key={player.id}><i className="is-online" />{player.name}<small>{player.score} điểm</small></li>)}
      </ul>
    </aside>

    <div className={`crosshair ${focused || focusedSeat || seated ? 'is-focused' : ''}`} aria-hidden="true"><i /></div>
    {focused && <p className="interaction-hint"><kbd>E</kbd>{uiText.view.replace('Nhấn E hoặc ', '')}</p>}
    {seated && <p className="interaction-hint"><kbd>E</kbd> Đứng dậy</p>}
    {!seated && !focused && focusedSeat && quizRoomId === null && <p className="interaction-hint"><kbd>E</kbd> Ngồi xuống</p>}
    {!seated && !focused && focusedSeat && quizRoomId !== null && cooldownSeconds > 0 && <p className="interaction-hint">Quiz sẵn sàng sau <kbd>{cooldownLabel}</kbd></p>}
    {!seated && !focused && focusedSeat && quizRoomId !== null && cooldownSeconds === 0 && <p className="interaction-hint"><kbd>E</kbd> Ngồi xuống và làm quiz</p>}

    {!mobile && !locked && <div className="lock-hint">
      <span className="mouse-icon" aria-hidden="true" />
      <strong>Nhấp vào không gian để điều khiển</strong>
      <small>WASD di chuyển · Chuột quan sát · Q bật/tắt điều khiển · Space nhảy</small>
    </div>}

    <div className="tour-progress" aria-label={`Đã khám phá ${visited.filter((id) => id > 0).length} trên 8 phòng`}>
      <span>Hành trình</span><i><b style={{ width: `${visited.filter((id) => id > 0).length / 8 * 100}%` }} /></i><strong>{visited.filter((id) => id > 0).length}/8</strong>
    </div>

    <div className="settings-wrap">
      <button className="settings-toggle" onClick={() => setSettingsOpen(!settingsOpen)} aria-expanded={settingsOpen}>⚙ <span>Cài đặt</span></button>
      {settingsOpen && <section className="settings-panel" aria-label="Cài đặt">
        <strong>Cài đặt</strong>
        <div className="settings-section sensitivity-setting"><span>Độ nhạy chuột <b>{Math.round(mouseSensitivity * 100)}%</b></span><input type="range" min="0.25" max="2" step="0.05" value={mouseSensitivity} onChange={(event) => setMouseSensitivity(Number(event.target.value))} aria-label="Độ nhạy chuột" /></div>
        <div className="settings-section"><span>Âm thanh</span><button className="setting-audio" onClick={toggleAudio} aria-label={audioOn ? uiText.audioOn : uiText.audioOff}>{audioOn ? 'Âm thanh: Bật' : 'Âm thanh: Tắt'}</button></div>
      </section>}
    </div>
  </div>
}
