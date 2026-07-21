import { useStore } from '../store/useStore'

export function PvpPanel() {
  const pose = useStore((state) => state.playerPose)
  const remote = useStore((state) => state.remotePlayers)
  const invite = useStore((state) => state.pvpInvite)
  const duel = useStore((state) => state.duel)
  const request = useStore((state) => state.requestPvp)
  const respond = useStore((state) => state.respondPvp)
  const target = Object.values(remote).find((player) => (player.x - pose.x) ** 2 + (player.z - pose.z) ** 2 <= 3.5 ** 2)
  if (duel) return null
  if (invite) return <div className="pvp-invite"><strong>{invite.name} thách đấu bạn</strong><span>Chạm 3 · phần thưởng tối đa 5 điểm</span><button onClick={() => respond(invite.fromPlayerId, true)}>Đồng ý</button><button onClick={() => respond(invite.fromPlayerId, false)}>Từ chối</button></div>
  if (!target) return null
  return <div className="pvp-near"><span><kbd>E</kbd> Thách đấu {target.name}</span><button onClick={() => request(target.id)}>PvP</button></div>
}
