import { useEffect, useState, type CSSProperties } from 'react'
import { ultimateSkillById } from '../data/skills'
import { useStore } from '../store/useStore'

function cooldownLabel(readyAt: number, now: number) {
  if (now === 0) return readyAt > 0 ? 'Đang hồi' : 'Sẵn sàng'
  const remaining = Math.max(0, readyAt - now)
  return remaining > 0 ? `${Math.ceil(remaining / 100) / 10}s` : 'Sẵn sàng'
}

export function DuelHud() {
  const duel = useStore((state) => state.duel)
  const playerId = useStore((state) => state.multiplayerPlayerId)
  const result = useStore((state) => state.duelFinished)
  const forfeitDuel = useStore((state) => state.forfeitDuel)
  const [now, setNow] = useState(0)

  useEffect(() => {
    if (!duel || result) return
    const timer = window.setInterval(() => setNow(Date.now()), 100)
    return () => window.clearInterval(timer)
  }, [duel, result])

  if (!duel || !playerId) return null
  const self = duel.players[playerId]
  const opponent = Object.entries(duel.players).find(([id]) => id !== playerId)?.[1]
  const ultimate = ultimateSkillById[self?.ultimateId ?? 'momentum']
  const ultimateActive = (self?.ultimateActiveUntil ?? 0) > now

  return <>
    {!result && <div className="duel-crosshair" aria-hidden="true"><i /><i /></div>}
    <section className="duel-hud" aria-label="Thông tin trận đấu">
      <header><span>Đấu trường riêng · 64 Hz</span><strong>{duel.opponent}</strong></header>
      <div className="duel-score"><b>{self?.wins ?? 0}</b><span>CHẠM 3</span><b>{opponent?.wins ?? 0}</b></div>
      <div className="duel-health"><span>HP {self?.hp ?? 100}</span><i><b style={{ width: `${self?.hp ?? 100}%` }} /></i></div>
      <small>WASD di chuyển · Shift chạy · Space nhảy · 1–5 đổi pose · Nhấp chuột để bắn</small>
      {!result && <button onClick={forfeitDuel}>Bỏ cuộc</button>}
    </section>
    {!result && <section className="ability-bar" aria-label="Kỹ năng duel">
      <article className={(self?.highJumpReadyAt ?? 0) > now ? 'is-cooling' : 'is-ready'}><kbd>Q</kbd><div><strong>Siêu Nhảy</strong><span>{cooldownLabel(self?.highJumpReadyAt ?? 0, now)}</span></div></article>
      <article className={(self?.dashReadyAt ?? 0) > now ? 'is-cooling' : 'is-ready'}><kbd>E</kbd><div><strong>Dash</strong><span>{cooldownLabel(self?.dashReadyAt ?? 0, now)}</span></div></article>
      <article className={(self?.ultimateReadyAt ?? 0) > now ? 'is-cooling' : 'is-ready'} style={{ '--ability-accent': ultimate.accent } as CSSProperties}><kbd>R</kbd><div><strong>{ultimate.shortName}</strong><span>{ultimateActive ? `Đang dùng · ${cooldownLabel(self?.ultimateActiveUntil ?? 0, now)}` : cooldownLabel(self?.ultimateReadyAt ?? 0, now)}</span></div></article>
    </section>}
    {result && <section className="duel-result" role="status" aria-live="assertive">
      <small>{result.aborted ? 'TRẬN ĐẤU KẾT THÚC' : 'KẾT QUẢ DUEL'}</small>
      <h2>{result.winnerName} chiến thắng</h2>
      <strong>{result.winnerWins} <i>:</i> {result.loserWins}</strong>
      <p><b>{result.winnerName}</b> nhận <em>+{result.transfer}</em> điểm, tổng {result.winnerScore} điểm.</p>
      <p><b>{result.loserName}</b> mất <em>-{result.transfer}</em> điểm, còn {result.loserScore} điểm.</p>
      <span>Trở về bảo tàng sau 3 giây</span>
      <div aria-hidden="true" />
    </section>}
  </>
}
