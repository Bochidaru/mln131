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
  avatarId: string
  score: number
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

export interface ChatEntry {
  id: string
  playerId: string
  name: string
  text: string
}

interface MuseumState {
  entered: boolean
  joining: boolean
  joinError: string | null
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
  avatarId: string
  graphicsQuality: 'auto' | 'low' | 'medium' | 'high'
  settingsOpen: boolean
  entranceDoorOpen: boolean
  score: number
  quizRoomId: number | null
  quizCooldowns: Record<number, number>
  quizOpen: boolean
  outgoingQuiz: { id: number; roomId: number; correct: number } | null
  chatOpen: boolean
  chatMessages: ChatEntry[]
  outgoingChat: { id: number; text: string } | null
  remotePlayers: Record<string, RemotePlayer>
  enter: () => void
  beginJoining: () => void
  rejectJoining: (message: string) => void
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
  setAvatarId: (avatarId: string) => void
  setGraphicsQuality: (quality: MuseumState['graphicsQuality']) => void
  setSettingsOpen: (open: boolean) => void
  setEntranceDoorOpen: (open: boolean) => void
  setScore: (score: number) => void
  setQuizRoomId: (roomId: number | null) => void
  setQuizOpen: (open: boolean) => void
  setQuizCooldown: (roomId: number, availableAt: number) => void
  submitQuiz: (roomId: number, correct: number) => void
  setChatOpen: (open: boolean) => void
  addChatMessage: (message: ChatEntry) => void
  queueChat: (text: string) => void
  upsertRemotePlayers: (players: RemotePlayer[]) => void
  removeRemotePlayer: (playerId: string) => void
  clearRemotePlayers: () => void
}

export const useStore = create<MuseumState>((set) => ({
  entered: false,
  joining: false,
  joinError: null,
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
  avatarId: 'block-explorer',
  graphicsQuality: 'auto',
  settingsOpen: false,
  entranceDoorOpen: false,
  score: 0,
  quizRoomId: null,
  quizCooldowns: {},
  quizOpen: false,
  outgoingQuiz: null,
  chatOpen: false,
  chatMessages: [],
  outgoingChat: null,
  remotePlayers: {},
  enter: () => set({ entered: true, joining: false, joinError: null }),
  beginJoining: () => set({ joining: true, joinError: null }),
  rejectJoining: (joinError) => set({ joining: false, joinError }),
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
  setAvatarId: (avatarId) => set({ avatarId }),
  setGraphicsQuality: (graphicsQuality) => set({ graphicsQuality }),
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  setEntranceDoorOpen: (entranceDoorOpen) => set({ entranceDoorOpen }),
  setScore: (score) => set({ score }),
  setQuizRoomId: (quizRoomId) => set((state) => state.quizRoomId === quizRoomId ? state : { quizRoomId }),
  setQuizOpen: (quizOpen) => set({ quizOpen }),
  setQuizCooldown: (roomId, availableAt) => set((state) => ({ quizCooldowns: { ...state.quizCooldowns, [roomId]: availableAt } })),
  submitQuiz: (roomId, correct) => set({ outgoingQuiz: { id: Date.now(), roomId, correct }, quizOpen: false }),
  setChatOpen: (chatOpen) => set({ chatOpen }),
  addChatMessage: (message) => set((state) => ({ chatMessages: [...state.chatMessages, message].slice(-60) })),
  queueChat: (text) => set({ outgoingChat: { id: Date.now(), text } }),
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
