import { create } from 'zustand'
import type { PosterData } from '../data/content'
import { getAreaAt, type MuseumArea } from '../data/layout'

export interface PlayerPose {
  x: number
  z: number
  dirX: number
  dirZ: number
}

interface MuseumState {
  entered: boolean
  activePoster: PosterData | null
  focusedPoster: string | null
  currentArea: MuseumArea
  visitedRooms: number[]
  playerPose: PlayerPose
  controlsLocked: boolean
  audioOn: boolean
  mapExpanded: boolean
  mobileMove: { x: number; z: number }
  mobileLook: { x: number; y: number }
  enter: () => void
  openPoster: (poster: PosterData) => void
  closePoster: () => void
  setFocusedPoster: (id: string | null) => void
  setPlayerPose: (pose: PlayerPose) => void
  setControlsLocked: (locked: boolean) => void
  toggleAudio: () => void
  toggleMap: () => void
  setMapExpanded: (expanded: boolean) => void
  setMobileMove: (move: { x: number; z: number }) => void
  setMobileLook: (look: { x: number; y: number }) => void
}

export const useStore = create<MuseumState>((set) => ({
  entered: false,
  activePoster: null,
  focusedPoster: null,
  currentArea: 'grounds',
  visitedRooms: [],
  playerPose: { x: 0, z: 42, dirX: 0, dirZ: -1 },
  controlsLocked: false,
  audioOn: true,
  mapExpanded: true,
  mobileMove: { x: 0, z: 0 },
  mobileLook: { x: 0, y: 0 },
  enter: () => set({ entered: true }),
  openPoster: (activePoster) => set({ activePoster, focusedPoster: null }),
  closePoster: () => set({ activePoster: null }),
  setFocusedPoster: (focusedPoster) => set({ focusedPoster }),
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
}))
