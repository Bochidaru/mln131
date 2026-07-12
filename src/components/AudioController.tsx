import { useEffect } from 'react'
import { museumAudio } from '../audio'
import { useStore } from '../store/useStore'

export function AudioController() {
  const audioOn = useStore((state) => state.audioOn)
  const entered = useStore((state) => state.entered)

  useEffect(() => {
    if (!entered) return
    museumAudio.start()
    const visibility = () => museumAudio.mute(document.hidden || !useStore.getState().audioOn)
    document.addEventListener('visibilitychange', visibility)
    return () => document.removeEventListener('visibilitychange', visibility)
  }, [entered])

  useEffect(() => { museumAudio.mute(!audioOn || !entered) }, [audioOn, entered])
  return null
}
