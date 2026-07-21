import { useStore } from '../store/useStore'

export function DuelHud() {
  const duel = useStore((state) => state.duel)
  const playerId = useStore((state) => state.multiplayerPlayerId)

  if (!duel || !playerId) return null
  const self = duel.players[playerId]
  const opponent = Object.entries(duel.players).find(([id]) => id !== playerId)?.[1]

  return <section className="duel-hud" aria-label="Thông tin trận đấu">
    <header><span>Đấu trường riêng · 64 Hz</span><strong>{duel.opponent}</strong></header>
    <div className="duel-score"><b>{self?.wins ?? 0}</b><span>CHẠM 3</span><b>{opponent?.wins ?? 0}</b></div>
    <div className="duel-health"><span>HP {self?.hp ?? 100}</span><i><b style={{ width: `${self?.hp ?? 100}%` }} /></i></div>
    <small>WASD di chuyển · Nhấp chuột để bắn</small>
  </section>
}
