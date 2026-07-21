import { create } from 'zustand'
import type { PosterData } from '../data/content'
import { getAreaAt, type MuseumArea } from '../data/layout'

export interface PlayerPose {
  x: number
  z: number
  dirX: number
  dirZ: number
}

export interface SeatPose {
  id: string
  center: [number, number] // x, z dùng để đo khoảng cách
  eye: [number, number, number] // vị trí camera khi ngồi
  look: [number, number, number] // điểm nhìn khi ngồi
}

export interface RemotePlayer {
  id: string
  name: string
  x: number
  y: number
  z: number
  dirX: number
  dirZ: number
  area: MuseumArea | string
  focusedPoster: string | null
  seated: boolean
  tickId: number
  lastSeen: number
}

interface MuseumState {
  entered: boolean
  activePoster: PosterData | null
  focusedPoster: string | null
  focusedSeat: SeatPose | null
  seated: SeatPose | null
  currentArea: MuseumArea
  visitedRooms: number[]
  playerPose: PlayerPose
  controlsLocked: boolean
  audioOn: boolean
  mapExpanded: boolean
  mobileMove: { x: number; z: number }
  mobileLook: { x: number; y: number }
  multiplayerConnected: boolean
  multiplayerPlayerId: string | null
  playerName: string
  remotePlayers: Record<string, RemotePlayer>
  enter: () => void
  openPoster: (poster: PosterData) => void
  closePoster: () => void
  setFocusedPoster: (id: string | null) => void
  setFocusedSeat: (seat: SeatPose | null) => void
  sit: (seat: SeatPose) => void
  stand: () => void
  setPlayerPose: (pose: PlayerPose) => void
  setControlsLocked: (locked: boolean) => void
  toggleAudio: () => void
  toggleMap: () => void
  setMapExpanded: (expanded: boolean) => void
  setMobileMove: (move: { x: number; z: number }) => void
  setMobileLook: (look: { x: number; y: number }) => void
  setMultiplayerConnected: (connected: boolean) => void
  setMultiplayerPlayerId: (playerId: string | null) => void
  setPlayerName: (name: string) => void
  upsertRemotePlayers: (players: RemotePlayer[]) => void
  removeRemotePlayer: (playerId: string) => void
  clearRemotePlayers: () => void
}

export const useStore = create<MuseumState>((set) => ({
  entered: false,
  activePoster: null,
  focusedPoster: null,
  focusedSeat: null,
  seated: null,
  currentArea: 'grounds',
  visitedRooms: [],
  playerPose: { x: 0, z: 42, dirX: 0, dirZ: -1 },
  controlsLocked: false,
  audioOn: true,
  mapExpanded: true,
  mobileMove: { x: 0, z: 0 },
  mobileLook: { x: 0, y: 0 },
  multiplayerConnected: false,
  multiplayerPlayerId: null,
  playerName: '',
  remotePlayers: {},
  enter: () => set({ entered: true }),
  openPoster: (activePoster) => set({ activePoster, focusedPoster: null }),
  closePoster: () => set({ activePoster: null }),
  setFocusedPoster: (focusedPoster) => set({ focusedPoster }),
  setFocusedSeat: (focusedSeat) => set({ focusedSeat }),
  sit: (seat) => set({ seated: seat }),
  stand: () => set({ seated: null }),
  setPlayerPose: (playerPose) => set((state) => {
    const currentArea = getAreaAt(playerPose.x, playerPose.z)
    const roomMatch = currentArea.match(/^room-(\d+)$/)
    const roomId = roomMatch ? Number(roomMatch[1]) : currentArea === 'lobby' ? 0 : null
    const visitedRooms = roomId !== null && !state.visitedRooms.includes(roomId)
      ? [...state.visitedRooms, roomId]
      : state.visitedRooms
    return { playerPose, currentArea, visitedRooms }
  }),
  setControlsLocked: (controlsLocked) => set({ controlsLocked }),
  toggleAudio: () => set((state) => ({ audioOn: !state.audioOn })),
  toggleMap: () => set((state) => ({ mapExpanded: !state.mapExpanded })),
  setMapExpanded: (mapExpanded) => set({ mapExpanded }),
  setMobileMove: (mobileMove) => set({ mobileMove }),
  setMobileLook: (mobileLook) => set({ mobileLook }),
  setMultiplayerConnected: (multiplayerConnected) => set({ multiplayerConnected }),
  setMultiplayerPlayerId: (multiplayerPlayerId) => set({ multiplayerPlayerId }),
  setPlayerName: (playerName) => set({ playerName }),
  upsertRemotePlayers: (players) => set((state) => {
    const remotePlayers = { ...state.remotePlayers }
    for (const player of players) {
      if (player.id !== state.multiplayerPlayerId) remotePlayers[player.id] = player
    }
    return { remotePlayers }
  }),
  removeRemotePlayer: (playerId) => set((state) => {
    const remotePlayers = { ...state.remotePlayers }
    delete remotePlayers[playerId]
    return { remotePlayers }
  }),
  clearRemotePlayers: () => set({ remotePlayers: {} }),
}))
