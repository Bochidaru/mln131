import { useStore } from '../store/useStore'

export function DuelHud() {
  const duel = useStore((state) => state.duel)
  const playerId = useStore((state) => state.multiplayerPlayerId)
  const result = useStore((state) => state.duelFinished)
  const forfeitDuel = useStore((state) => state.forfeitDuel)

  if (!duel || !playerId) return null
  const self = duel.players[playerId]
  const opponent = Object.entries(duel.players).find(([id]) => id !== playerId)?.[1]

  return <>
    {!result && <div className="duel-crosshair" aria-hidden="true"><i /><i /></div>}
    <section className="duel-hud" aria-label="Thông tin trận đấu">
      <header><span>Đấu trường riêng · 64 Hz</span><strong>{duel.opponent}</strong></header>
      <div className="duel-score"><b>{self?.wins ?? 0}</b><span>CHẠM 3</span><b>{opponent?.wins ?? 0}</b></div>
      <div className="duel-health"><span>HP {self?.hp ?? 100}</span><i><b style={{ width: `${self?.hp ?? 100}%` }} /></i></div>
      <small>WASD di chuyển · Shift chạy · Space nhảy · Nhấp chuột để bắn</small>
      {!result && <button onClick={forfeitDuel}>Bỏ cuộc</button>}
    </section>
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
