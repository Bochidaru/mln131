import { useEffect } from 'react'
import { museumAudio } from '../audio'
import { useStore } from '../store/useStore'
export function AudioController() {
  const audioOn = useStore((s) => s.audioOn)
  useEffect(() => {
    museumAudio.start()
    const visibility = () => museumAudio.mute(document.hidden || !useStore.getState().audioOn)
    document.addEventListener('visibilitychange', visibility)
    return () => document.removeEventListener('visibilitychange', visibility)
  }, [])
  useEffect(() => { museumAudio.mute(!audioOn) }, [audioOn])
  return null
}
