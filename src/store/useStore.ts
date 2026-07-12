import { create } from 'zustand'
import type { PosterData } from '../data/content'

interface MuseumState {
  entered: boolean; activePoster: PosterData | null; focusedPoster: string | null; currentRoom: number; audioOn: boolean;
  mobileMove: { x: number; z: number }; mobileLook: { x: number; y: number };
  enter: () => void; openPoster: (poster: PosterData) => void; closePoster: () => void; setFocusedPoster: (id: string | null) => void;
  setCurrentRoom: (room: number) => void; toggleAudio: () => void; setMobileMove: (move: { x: number; z: number }) => void; setMobileLook: (look: { x: number; y: number }) => void;
}

export const useStore = create<MuseumState>((set) => ({
  entered: false, activePoster: null, focusedPoster: null, currentRoom: 0, audioOn: true,
  mobileMove: { x: 0, z: 0 }, mobileLook: { x: 0, y: 0 },
  enter: () => set({ entered: true }), openPoster: (activePoster) => set({ activePoster }), closePoster: () => set({ activePoster: null }),
  setFocusedPoster: (focusedPoster) => set({ focusedPoster }), setCurrentRoom: (currentRoom) => set({ currentRoom }),
  toggleAudio: () => set((state) => ({ audioOn: !state.audioOn })), setMobileMove: (mobileMove) => set({ mobileMove }), setMobileLook: (mobileLook) => set({ mobileLook }),
}))
