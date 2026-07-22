import { useEffect, useRef } from 'react'
import { useStore, type RemotePlayer } from '../store/useStore'

type ServerPlayer = {
  playerId: string
  name?: string
  avatarId?: string
  isGuide?: boolean
  pose?: number
  score?: number
  x: number
  y?: number
  z: number
  dirX: number
  dirZ: number
  area?: string
  focusedPoster?: string | null
  seated?: boolean
  tickId?: number
}

type ServerMessage = {
  type: string
  playerId?: string
  tickId?: number
  doorOpen?: boolean
  players?: ServerPlayer[]
  payload?: {
    roomId?: string
    tickRate?: number
    online?: number
    isGuide?: boolean
    players?: ServerPlayer[]
    player?: ServerPlayer
    reason?: string
    text?: string
    name?: string
    fromPlayerId?: string
    targetPlayerId?: string
    targetName?: string
    expiresAt?: string
    cooldownUntil?: string
    duelId?: string
    opponent?: string
    winnerId?: string
    winnerName?: string
    winnerWins?: number
    winnerScore?: number
    loserId?: string
    loserName?: string
    loserWins?: number
    loserScore?: number
    transfer?: number
    aborted?: boolean
    returnsAt?: string
    returnPose?: { x: number; z: number; dirX: number; dirZ: number }
    duelPlayers?: { playerId: string; avatarId?: string; isGuide?: boolean; pose?: number; x: number; y: number; z: number; dirX: number; dirZ: number; hp: number; wins: number }[]
    shotId?: string
    shooterId?: string
    startX?: number
    startY?: number
    startZ?: number
    endX?: number
    endY?: number
    endZ?: number
    hit?: boolean
    score?: number
    quizRoomId?: number
    correct?: number
    earned?: number
    availableAt?: string
  }
}

const NETWORK_TICK_RATE = 32
const SEND_INTERVAL_MS = 1000 / NETWORK_TICK_RATE
const RECONNECT_DELAY_MS = 1200

function getWebSocketUrl() {
  const configured = import.meta.env.VITE_MULTIPLAYER_URL
  if (configured) return configured

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  if (import.meta.env.DEV) return `${protocol}//${window.location.hostname}:5266/ws`
  return `${protocol}//${window.location.host}/ws`
}

function toRemotePlayer(player: ServerPlayer): RemotePlayer {
  return {
    id: player.playerId,
    name: player.name?.trim() || 'Khách tham quan',
    avatarId: player.avatarId ?? 'block-explorer',
    isGuide: Boolean(player.isGuide),
    pose: player.pose ?? 0,
    score: player.score ?? 0,
    x: player.x,
    y: player.y ?? 1.68,
    z: player.z,
    dirX: player.dirX,
    dirZ: player.dirZ,
    area: player.area ?? 'grounds',
    focusedPoster: player.focusedPoster ?? null,
    seated: Boolean(player.seated),
    tickId: player.tickId ?? 0,
    lastSeen: performance.now(),
  }
}

export function MultiplayerConnector() {
  const entered = useStore((state) => state.entered)
  const joining = useStore((state) => state.joining)
  const shouldConnect = entered || joining
  const socketRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef<number | null>(null)
  const sendTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!shouldConnect) return

    let disposed = false
    let rejected = false
    let kicked = false

    const clearTimers = () => {
      if (reconnectRef.current !== null) window.clearTimeout(reconnectRef.current)
      if (sendTimerRef.current !== null) window.clearInterval(sendTimerRef.current)
      reconnectRef.current = null
      sendTimerRef.current = null
    }

    const scheduleReconnect = () => {
      if (disposed || reconnectRef.current !== null) return
      reconnectRef.current = window.setTimeout(() => {
        reconnectRef.current = null
        connect()
      }, RECONNECT_DELAY_MS)
    }

    const sendPose = () => {
      const socket = socketRef.current
      if (!socket || socket.readyState !== WebSocket.OPEN) return

      const state = useStore.getState()
      socket.send(JSON.stringify({
        type: 'pose',
        payload: {
          x: state.playerPose.x,
          y: 1.68,
          z: state.playerPose.z,
          dirX: state.playerPose.dirX,
          dirZ: state.playerPose.dirZ,
          area: state.currentArea,
          focusedPoster: state.focusedPoster,
          seated: Boolean(state.seated),
          pose: state.playerEmotePose,
          timestamp: Date.now(),
        },
      }))
    }

    let lastChatId = 0
    const unsubscribeFromChat = useStore.subscribe((state) => {
      const chat = state.outgoingChat
      const socket = socketRef.current
      if (!chat || chat.id === lastChatId || !socket || socket.readyState !== WebSocket.OPEN) return
      lastChatId = chat.id
      socket.send(JSON.stringify({ type: 'chat', payload: { text: chat.text } }))
    })

    let lastQuizId = 0
    const unsubscribeFromQuiz = useStore.subscribe((state) => {
      const quiz = state.outgoingQuiz
      const socket = socketRef.current
      if (!quiz || quiz.id === lastQuizId || !socket || socket.readyState !== WebSocket.OPEN) return
      lastQuizId = quiz.id
      socket.send(JSON.stringify({ type: 'quizReward', payload: { roomId: quiz.roomId, correct: quiz.correct } }))
    })

    let lastPvpId = 0
    const unsubscribeFromPvp = useStore.subscribe((state) => {
      const action = state.outgoingPvp
      const socket = socketRef.current
      if (!action || action.id === lastPvpId || !socket || socket.readyState !== WebSocket.OPEN) return
      lastPvpId = action.id
      socket.send(JSON.stringify({ type: action.type, payload: action.payload }))
    })
    let lastDuelId = 0
    const unsubscribeFromDuel = useStore.subscribe((state) => {
      const action = state.outgoingDuel
      const socket = socketRef.current
      if (!action || action.id === lastDuelId || !socket || socket.readyState !== WebSocket.OPEN) return
      lastDuelId = action.id
      socket.send(JSON.stringify({ type: action.type, payload: action.payload }))
    })

    const handleMessage = (event: MessageEvent<string>) => {
      let message: ServerMessage
      try {
        message = JSON.parse(event.data) as ServerMessage
      } catch {
        return
      }

      const store = useStore.getState()

      if (message.type === 'welcome') {
        store.setMultiplayerPlayerId(message.playerId ?? null)
        store.setMultiplayerConnected(true)
        store.setScore(message.payload?.score ?? 0)
        store.setIsGuide(Boolean(message.payload?.isGuide))
        if (message.payload?.players) store.upsertRemotePlayers(message.payload.players.map(toRemotePlayer))
        store.enter()
        if (sendTimerRef.current !== null) window.clearInterval(sendTimerRef.current)
        sendPose()
        sendTimerRef.current = window.setInterval(sendPose, SEND_INTERVAL_MS)
        return
      }

      if (message.type === 'snapshot' && message.players) {
        const self = message.players.find((player) => player.playerId === store.multiplayerPlayerId)
        if (self) store.setIsGuide(Boolean(self.isGuide))
        store.replaceRemotePlayers(message.players.map(toRemotePlayer))
        store.setEntranceDoorOpen(Boolean(message.doorOpen))
        return
      }

      if (message.type === 'joinRejected') {
        rejected = true
        store.rejectJoining(message.payload?.reason ?? 'Tên này hiện đã có người sử dụng.')
        socketRef.current?.close()
        return
      }

      if (message.type === 'kicked') {
        kicked = true
        clearTimers()
        store.leaveMuseum(message.payload?.reason ?? 'Bạn đã bị admin đưa ra khỏi bảo tàng.')
        socketRef.current?.close()
        return
      }

      if (message.type === 'guideStatus') {
        store.setIsGuide(Boolean(message.payload?.isGuide))
        return
      }

      if (message.type === 'adminAward' && message.payload?.score !== undefined) {
        store.setScore(message.payload.score)
        return
      }

      if (message.type === 'playerJoined' && message.payload?.player) {
        store.upsertRemotePlayers([toRemotePlayer(message.payload.player)])
        return
      }

      if (message.type === 'playerUpdated' && message.payload?.player) {
        if (message.payload.player.playerId === store.multiplayerPlayerId) store.setIsGuide(Boolean(message.payload.player.isGuide))
        else store.upsertRemotePlayers([toRemotePlayer(message.payload.player)])
        return
      }

      if (message.type === 'playerLeft' && message.playerId) {
        store.removeRemotePlayer(message.playerId)
        return
      }

      if (message.type === 'chat' && message.playerId && message.payload?.text) {
        store.addChatMessage({
          id: `${message.playerId}-${performance.now()}`,
          playerId: message.playerId,
          name: message.payload.name ?? 'Khách tham quan',
          text: message.payload.text,
        })
      }

      if (message.type === 'quizResult' && message.payload?.quizRoomId !== undefined && message.payload.availableAt) {
        store.setScore(message.payload.score ?? 0)
        store.setQuizCooldown(message.payload.quizRoomId, Date.parse(message.payload.availableAt))
        store.setQuizResult({ roomId: message.payload.quizRoomId, correct: message.payload.correct ?? 0, earned: message.payload.earned ?? 0, score: message.payload.score ?? 0 })
      }

      if (message.type === 'quizCooldown' && message.payload?.quizRoomId !== undefined && message.payload.availableAt) {
        store.setQuizCooldown(message.payload.quizRoomId, Date.parse(message.payload.availableAt))
      }

      if (message.type === 'pvpInvite' && message.payload?.fromPlayerId && message.payload.name && message.payload.expiresAt) {
        store.setPvpInvite({ fromPlayerId: message.payload.fromPlayerId, name: message.payload.name, expiresAt: Date.parse(message.payload.expiresAt) })
      }
      if (message.type === 'pvpInviteSent' && message.payload?.targetPlayerId && message.payload.targetName && message.payload.expiresAt) {
        store.setPvpOutgoingInvite({ targetPlayerId: message.payload.targetPlayerId, name: message.payload.targetName, expiresAt: Date.parse(message.payload.expiresAt) })
        if (message.payload.cooldownUntil) store.setPvpCooldownUntil(Date.parse(message.payload.cooldownUntil))
      }
      if (message.type === 'pvpCooldown' && message.payload?.cooldownUntil) {
        store.setPvpCooldownUntil(Date.parse(message.payload.cooldownUntil))
        store.setPvpOutgoingInvite(null)
      }
      if (message.type === 'pvpDeclined' || message.type === 'pvpRequestRejected') {
        store.setPvpOutgoingInvite(null)
        if (message.type === 'pvpRequestRejected') store.setPvpCooldownUntil(0)
      }
      if (message.type === 'pvpInviteExpired') {
        if (message.payload?.fromPlayerId && store.pvpInvite?.fromPlayerId === message.payload.fromPlayerId) store.setPvpInvite(null)
        if (message.payload?.targetPlayerId && store.pvpOutgoingInvite?.targetPlayerId === message.payload.targetPlayerId) store.setPvpOutgoingInvite(null)
      }
      if (message.type === 'duelStart' && message.payload?.duelId && message.payload.opponent) store.startDuel(message.payload.duelId, message.payload.opponent)
      if (message.type === 'duelSnapshot' && message.payload?.duelPlayers) store.setDuelSnapshot(Object.fromEntries(message.payload.duelPlayers.map((player) => [player.playerId, { ...player, avatarId: player.avatarId ?? 'block-explorer', isGuide: Boolean(player.isGuide), pose: player.pose ?? 0 }])))
      if (message.type === 'duelShot' && message.payload?.shotId && message.payload.shooterId
        && message.payload.startX !== undefined && message.payload.startY !== undefined && message.payload.startZ !== undefined
        && message.payload.endX !== undefined && message.payload.endY !== undefined && message.payload.endZ !== undefined) {
        store.setDuelShot({
          shotId: message.payload.shotId,
          shooterId: message.payload.shooterId,
          startX: message.payload.startX,
          startY: message.payload.startY,
          startZ: message.payload.startZ,
          endX: message.payload.endX,
          endY: message.payload.endY,
          endZ: message.payload.endZ,
          hit: Boolean(message.payload.hit),
        })
      }
      if (message.type === 'duelFinished' && message.payload?.winnerId && message.payload.winnerName
        && message.payload.loserId && message.payload.loserName && message.payload.returnsAt) {
        store.setDuelFinished({
          winnerId: message.payload.winnerId,
          winnerName: message.payload.winnerName,
          winnerWins: message.payload.winnerWins ?? 3,
          winnerScore: message.payload.winnerScore ?? 0,
          loserId: message.payload.loserId,
          loserName: message.payload.loserName,
          loserWins: message.payload.loserWins ?? 0,
          loserScore: message.payload.loserScore ?? 0,
          transfer: message.payload.transfer ?? 0,
          aborted: Boolean(message.payload.aborted),
          returnsAt: Date.parse(message.payload.returnsAt),
        })
      }
      if (message.type === 'duelResult') {
        if (message.payload?.score !== undefined) store.setScore(message.payload.score)
        if (message.payload?.returnPose) store.setPlayerPose(message.payload.returnPose)
        store.endDuel(message.payload?.returnPose)
      }
    }

    const connect = () => {
      const socket = new WebSocket(getWebSocketUrl())
      socketRef.current = socket

      socket.addEventListener('open', () => {
        const state = useStore.getState()
        socket.send(JSON.stringify({ type: 'join', payload: { name: state.playerName, avatarId: state.avatarId } }))
      })

      socket.addEventListener('message', handleMessage)

      socket.addEventListener('close', () => {
        if (socketRef.current === socket) socketRef.current = null
        if (sendTimerRef.current !== null) window.clearInterval(sendTimerRef.current)
        sendTimerRef.current = null
        useStore.getState().setMultiplayerConnected(false)
        if (!rejected && !kicked) scheduleReconnect()
      })

      socket.addEventListener('error', () => {
        socket.close()
      })
    }

    connect()

    return () => {
      disposed = true
      clearTimers()
      unsubscribeFromChat()
      unsubscribeFromQuiz()
      unsubscribeFromPvp()
      unsubscribeFromDuel()
      socketRef.current?.close()
      socketRef.current = null
      const store = useStore.getState()
      store.setMultiplayerConnected(false)
      store.setMultiplayerPlayerId(null)
      store.clearRemotePlayers()
    }
  }, [shouldConnect])

  return null
}
