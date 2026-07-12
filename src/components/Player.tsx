import { PointerLockControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { Euler, Vector3 } from 'three'
import { constrainPlayer } from '../hooks/useCollision'
import { museumAudio } from '../audio'
import { useIsMobile } from '../hooks/useIsMobile'
import { useStore } from '../store/useStore'

const direction = new Vector3()
const forward = new Vector3()
const right = new Vector3()
const euler = new Euler(0, 0, 0, 'YXZ')
export function Player() {
  const { camera } = useThree()
  const keys = useRef(new Set<string>())
  const mobile = useIsMobile()
  const activePoster = useStore((s) => s.activePoster)
  useEffect(() => {
    camera.position.set(0, 1.6, 3.5)
    const down = (event: KeyboardEvent) => keys.current.add(event.code)
    const up = (event: KeyboardEvent) => keys.current.delete(event.code)
    addEventListener('keydown', down); addEventListener('keyup', up)
    return () => { removeEventListener('keydown', down); removeEventListener('keyup', up) }
  }, [camera])
  useFrame((_, delta) => {
    if (activePoster) return
    const state = useStore.getState()
    const zInput = (keys.current.has('KeyW') ? 1 : 0) - (keys.current.has('KeyS') ? 1 : 0) - state.mobileMove.z
    const xInput = (keys.current.has('KeyD') ? 1 : 0) - (keys.current.has('KeyA') ? 1 : 0) + state.mobileMove.x
    direction.set(0, 0, 0)
    camera.getWorldDirection(forward); forward.y = 0; forward.normalize(); right.crossVectors(forward, camera.up).normalize()
    direction.addScaledVector(forward, zInput).addScaledVector(right, xInput)
    if (direction.lengthSq() > 0) { camera.position.addScaledVector(direction.normalize(), Math.min(delta, 0.05) * 3); museumAudio.step(performance.now() / 1000) }
    if (mobile && (state.mobileLook.x || state.mobileLook.y)) {
      euler.setFromQuaternion(camera.quaternion); euler.y -= state.mobileLook.x * delta * 1.6; euler.x = Math.max(-1.25, Math.min(1.25, euler.x - state.mobileLook.y * delta * 1.3)); camera.quaternion.setFromEuler(euler)
    }
    constrainPlayer(camera.position)
    state.setCurrentRoom(Math.max(0, Math.min(8, Math.round(-camera.position.z / 10))))
  })
  return mobile || activePoster ? null : <PointerLockControls makeDefault />
}
