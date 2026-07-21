import { useEffect, useRef } from 'react'
import { useStore, type RemotePlayer } from '../store/useStore'

type ServerPlayer = {
  playerId: string
  name?: string
  avatarId?: string
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
    players?: ServerPlayer[]
    player?: ServerPlayer
    reason?: string
    text?: string
    name?: string
    fromPlayerId?: string
    duelId?: string
    opponent?: string
    winnerId?: string
    transfer?: number
    returnPose?: { x: number; z: number; dirX: number; dirZ: number }
    duelPlayers?: { playerId: string; x: number; z: number; dirX: number; dirZ: number; hp: number; wins: number }[]
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
        if (message.payload?.players) store.upsertRemotePlayers(message.payload.players.map(toRemotePlayer))
        store.enter()
        if (sendTimerRef.current !== null) window.clearInterval(sendTimerRef.current)
        sendPose()
        sendTimerRef.current = window.setInterval(sendPose, SEND_INTERVAL_MS)
        return
      }

      if (message.type === 'snapshot' && message.players) {
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

      if (message.type === 'playerJoined' && message.payload?.player) {
        store.upsertRemotePlayers([toRemotePlayer(message.payload.player)])
        return
      }

      if (message.type === 'playerUpdated' && message.payload?.player) {
        store.upsertRemotePlayers([toRemotePlayer(message.payload.player)])
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

      if (message.type === 'pvpInvite' && message.payload?.fromPlayerId && message.payload.name) store.setPvpInvite({ fromPlayerId: message.payload.fromPlayerId, name: message.payload.name })
      if (message.type === 'duelStart' && message.payload?.duelId && message.payload.opponent) store.startDuel(message.payload.duelId, message.payload.opponent)
      if (message.type === 'duelSnapshot' && message.payload?.duelPlayers) store.setDuelSnapshot(Object.fromEntries(message.payload.duelPlayers.map((player) => [player.playerId, player])))
      if (message.type === 'duelResult') {
        if (message.payload?.score !== undefined) store.setScore(message.payload.score)
        if (message.payload?.returnPose) store.setPlayerPose(message.payload.returnPose)
        store.endDuel()
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
        if (!rejected) scheduleReconnect()
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
