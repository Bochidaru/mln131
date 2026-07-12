import { Howl, Howler } from 'howler'
import ambientUrl from './assets/audio/ambient.mp3'
import clickUrl from './assets/audio/click.mp3'
import footstepUrl from './assets/audio/footstep.mp3'

const ambient = new Howl({ src: [ambientUrl], loop: true, volume: 0.55 })
const click = new Howl({ src: [clickUrl], volume: 0.7 })
const footstep = new Howl({ src: [footstepUrl], volume: 0.18, rate: 0.88 })
let lastStep = 0
export const museumAudio = {
  start() { if (!ambient.playing()) ambient.play() },
  mute(muted: boolean) { Howler.mute(muted) },
  click() { click.play() },
  step(time: number) { if (time - lastStep > 0.48) { footstep.play(); lastStep = time } },
}
