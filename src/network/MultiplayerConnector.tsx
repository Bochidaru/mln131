import { useEffect, useRef } from 'react'
import { useStore, type RemotePlayer } from '../store/useStore'

type ServerPlayer = {
  playerId: string
  name?: string
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
  players?: ServerPlayer[]
  payload?: {
    roomId?: string
    tickRate?: number
    online?: number
    players?: ServerPlayer[]
    player?: ServerPlayer
  }
}

const SEND_INTERVAL_MS = 50
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
  const socketRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef<number | null>(null)
  const sendTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!entered) return

    let disposed = false

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
        if (message.payload?.players) store.upsertRemotePlayers(message.payload.players.map(toRemotePlayer))
        return
      }

      if (message.type === 'snapshot' && message.players) {
        store.upsertRemotePlayers(message.players.map(toRemotePlayer))
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
      }
    }

    const connect = () => {
      const socket = new WebSocket(getWebSocketUrl())
      socketRef.current = socket

      socket.addEventListener('open', () => {
        useStore.getState().setMultiplayerConnected(true)
        const playerName = useStore.getState().playerName
        socket.send(JSON.stringify({ type: 'profile', payload: { name: playerName } }))
        if (sendTimerRef.current !== null) window.clearInterval(sendTimerRef.current)
        sendPose()
        sendTimerRef.current = window.setInterval(sendPose, SEND_INTERVAL_MS)
      })

      socket.addEventListener('message', handleMessage)

      socket.addEventListener('close', () => {
        if (socketRef.current === socket) socketRef.current = null
        if (sendTimerRef.current !== null) window.clearInterval(sendTimerRef.current)
        sendTimerRef.current = null
        useStore.getState().setMultiplayerConnected(false)
        scheduleReconnect()
      })

      socket.addEventListener('error', () => {
        socket.close()
      })
    }

    connect()

    return () => {
      disposed = true
      clearTimers()
      socketRef.current?.close()
      socketRef.current = null
      const store = useStore.getState()
      store.setMultiplayerConnected(false)
      store.setMultiplayerPlayerId(null)
      store.clearRemotePlayers()
    }
  }, [entered])

  return null
}
