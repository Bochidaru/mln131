import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'

export function PvpPanel() {
  const pose = useStore((state) => state.playerPose)
  const remote = useStore((state) => state.remotePlayers)
  const invite = useStore((state) => state.pvpInvite)
  const outgoingInvite = useStore((state) => state.pvpOutgoingInvite)
  const cooldownUntil = useStore((state) => state.pvpCooldownUntil)
  const duel = useStore((state) => state.duel)
  const request = useStore((state) => state.requestPvp)
  const respond = useStore((state) => state.respondPvp)
  const setInvite = useStore((state) => state.setPvpInvite)
  const setOutgoingInvite = useStore((state) => state.setPvpOutgoingInvite)
  const [now, setNow] = useState(0)
  const target = Object.values(remote).find((player) => (player.x - pose.x) ** 2 + (player.z - pose.z) ** 2 <= 3.5 ** 2)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setNow(Date.now()))
    if (!invite && !outgoingInvite && cooldownUntil <= Date.now()) return () => cancelAnimationFrame(frame)
    const timer = window.setInterval(() => {
      const currentTime = Date.now()
      setNow(currentTime)
      if (!invite && !outgoingInvite && cooldownUntil <= currentTime) window.clearInterval(timer)
    }, 250)
    return () => {
      cancelAnimationFrame(frame)
      window.clearInterval(timer)
    }
  }, [invite, outgoingInvite, cooldownUntil])

  useEffect(() => {
    if (invite && invite.expiresAt <= now) setInvite(null)
    if (outgoingInvite && outgoingInvite.expiresAt <= now) setOutgoingInvite(null)
  }, [invite, now, outgoingInvite, setInvite, setOutgoingInvite])

  const inviteSeconds = invite ? Math.max(0, Math.ceil((invite.expiresAt - now) / 1000)) : 0
  const outgoingSeconds = outgoingInvite ? Math.max(0, Math.ceil((outgoingInvite.expiresAt - now) / 1000)) : 0
  const cooldownSeconds = Math.max(0, Math.ceil((cooldownUntil - now) / 1000))

  if (duel) return null
  if (invite && inviteSeconds > 0) return <div className="pvp-invite"><strong>{invite.name} thách đấu bạn</strong><span>Chạm 3 · phần thưởng tối đa 5 điểm · còn {inviteSeconds}s</span><button onClick={() => respond(invite.fromPlayerId, true)}>Đồng ý</button><button onClick={() => respond(invite.fromPlayerId, false)}>Từ chối</button></div>
  if (outgoingInvite && outgoingSeconds > 0) return <div className="pvp-invite pvp-invite-sent"><strong>Đã gửi lời mời thách đấu</strong><span>Đang chờ {outgoingInvite.name} phản hồi · còn {outgoingSeconds}s</span></div>
  if (!target) return null
  return <div className="pvp-near"><span><kbd>E</kbd> Thách đấu {target.name}</span><button disabled={cooldownSeconds > 0} onClick={() => request(target.id, target.name)}>{cooldownSeconds > 0 ? `Chờ ${cooldownSeconds}s` : 'PvP'}</button></div>
}
