import { PointerLockControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { Euler, Vector3 } from 'three'
import { museumAudio } from '../audio'
import { useIsMobile } from '../hooks/useIsMobile'
import { resolvePlayerMovement } from '../hooks/useCollision'
import { useStore } from '../store/useStore'
import { seatRegistry } from '../utils/seatRegistry'

const direction = new Vector3()
const displacement = new Vector3()
const forward = new Vector3()
const right = new Vector3()
const euler = new Euler(0, 0, 0, 'YXZ')

const SEAT_RANGE_SQ = 2.2 * 2.2

const deepLinks: Record<string, { position: [number, number, number]; target: [number, number, number] }> = {
  entrance: { position: [0, 1.68, 9.02], target: [0, 2, -4] },
  lobby: { position: [0, 1.68, 4], target: [0, 2.2, -8] },
  corridor: { position: [0, 1.68, -17], target: [0, 1.8, -55] },
  door: { position: [-2.96, 1.68, -21], target: [-2.96, 1.8, -45] },
  'gallery-wide': { position: [-11.2, 1.68, -21], target: [-20.8, 2.15, -21] },
  gallery: { position: [-17.35, 1.68, -21], target: [-20.8, 2.18, -21] },
}

export function Player() {
  const { camera } = useThree()
  const keys = useRef(new Set<string>())
  const lastPoseUpdate = useRef(0)
  const walkPhase = useRef(0)
  const focusedSeatId = useRef<string | null>(null)
  const seatReturn = useRef<[number, number, number] | null>(null)
  const mobile = useIsMobile()
  const entered = useStore((state) => state.entered)
  const activePoster = useStore((state) => state.activePoster)
  const setControlsLocked = useStore((state) => state.setControlsLocked)

  useEffect(() => {
    const requestedView = new URLSearchParams(window.location.search).get('view')
    const start = requestedView ? deepLinks[requestedView] : undefined
    camera.position.set(...(start?.position ?? [0, 1.68, 42]))
    camera.lookAt(...(start?.target ?? [0, 5.2, 4]))

    const down = (event: KeyboardEvent) => {
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) event.preventDefault()
      keys.current.add(event.code)
    }
    const up = (event: KeyboardEvent) => keys.current.delete(event.code)
    addEventListener('keydown', down)
    addEventListener('keyup', up)
    return () => {
      removeEventListener('keydown', down)
      removeEventListener('keyup', up)
    }
  }, [camera])

  // Nhấn E: ngồi xuống ghế đang ngắm / đứng dậy.
  useEffect(() => {
    const onInteract = (event: KeyboardEvent) => {
      if (event.code !== 'KeyE' && event.code !== 'Enter') return
      const store = useStore.getState()
      if (!store.entered || store.activePoster) return
      if (store.seated) {
        const back = seatReturn.current ?? [camera.position.x, 1.68, camera.position.z]
        camera.position.set(back[0], back[1], back[2])
        seatReturn.current = null
        store.stand()
        museumAudio.click()
        return
      }
      if (store.focusedSeat && !store.focusedPoster) {
        const seat = store.focusedSeat
        // Nhớ đúng chỗ đang đứng (đã đi được) để lát nữa đứng dậy trả về, tránh kẹt trong vùng va chạm của ghế.
        seatReturn.current = [camera.position.x, 1.68, camera.position.z]
        camera.position.set(seat.eye[0], seat.eye[1], seat.eye[2])
        camera.lookAt(seat.look[0], seat.look[1], seat.look[2])
        store.sit(seat)
        museumAudio.click()
      }
    }
    addEventListener('keydown', onInteract)
    return () => removeEventListener('keydown', onInteract)
  }, [camera])

  useFrame((state, delta) => {
    const store = useStore.getState()
    const cappedDelta = Math.min(delta, 0.05)
    const frameCamera = state.camera

    frameCamera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()

    if (!entered || activePoster) {
      if (state.clock.elapsedTime - lastPoseUpdate.current > 0.12) {
        store.setPlayerPose({ x: frameCamera.position.x, z: frameCamera.position.z, dirX: forward.x, dirZ: forward.z })
        lastPoseUpdate.current = state.clock.elapsedTime
      }
      return
    }

    // Đang ngồi: khóa vị trí, vẫn cho xoay nhìn quanh.
    if (store.seated) {
      if (focusedSeatId.current !== null) { store.setFocusedSeat(null); focusedSeatId.current = null }
      if (mobile && (store.mobileLook.x || store.mobileLook.y)) {
        euler.setFromQuaternion(frameCamera.quaternion)
        euler.y -= store.mobileLook.x * 0.028
        euler.x = Math.max(-1.25, Math.min(1.25, euler.x - store.mobileLook.y * 0.024))
        frameCamera.quaternion.setFromEuler(euler)
        store.setMobileLook({ x: 0, y: 0 })
      }
      if (state.clock.elapsedTime - lastPoseUpdate.current > 0.12) {
        store.setPlayerPose({ x: frameCamera.position.x, z: frameCamera.position.z, dirX: forward.x, dirZ: forward.z })
        lastPoseUpdate.current = state.clock.elapsedTime
      }
      return
    }

    // Tìm ghế gần nhất trong tầm với để hiện gợi ý "Nhấn E để ngồi".
    let nearest: string | null = null
    let nearestDist = SEAT_RANGE_SQ
    for (const seat of seatRegistry) {
      const dx = frameCamera.position.x - seat.center[0]
      const dz = frameCamera.position.z - seat.center[1]
      const dist = dx * dx + dz * dz
      if (dist < nearestDist) { nearestDist = dist; nearest = seat.id }
    }
    if (nearest !== focusedSeatId.current) {
      focusedSeatId.current = nearest
      store.setFocusedSeat(nearest ? seatRegistry.find((seat) => seat.id === nearest) ?? null : null)
    }

    const zInput = (keys.current.has('KeyW') || keys.current.has('ArrowUp') ? 1 : 0)
      - (keys.current.has('KeyS') || keys.current.has('ArrowDown') ? 1 : 0)
      - store.mobileMove.z
    const xInput = (keys.current.has('KeyD') || keys.current.has('ArrowRight') ? 1 : 0)
      - (keys.current.has('KeyA') || keys.current.has('ArrowLeft') ? 1 : 0)
      + store.mobileMove.x

    direction.set(0, 0, 0)
    right.crossVectors(forward, frameCamera.up).normalize()
    direction.addScaledVector(forward, zInput).addScaledVector(right, xInput)

    if (direction.lengthSq() > 0) {
      const speed = keys.current.has('ShiftLeft') || keys.current.has('ShiftRight') ? 4.35 : 2.65
      displacement.copy(direction).normalize().multiplyScalar(cappedDelta * speed)
      resolvePlayerMovement(frameCamera.position, displacement)
      walkPhase.current += cappedDelta * speed * 3.2
      frameCamera.position.y = 1.68 + Math.sin(walkPhase.current) * 0.018
      museumAudio.step(performance.now() / 1000)
    } else {
      frameCamera.position.y += (1.68 - frameCamera.position.y) * Math.min(1, cappedDelta * 10)
    }

    if (mobile && (store.mobileLook.x || store.mobileLook.y)) {
      euler.setFromQuaternion(frameCamera.quaternion)
      euler.y -= store.mobileLook.x * 0.028
      euler.x = Math.max(-1.25, Math.min(1.25, euler.x - store.mobileLook.y * 0.024))
      frameCamera.quaternion.setFromEuler(euler)
      store.setMobileLook({ x: 0, y: 0 })
    }

    if (state.clock.elapsedTime - lastPoseUpdate.current > 0.08) {
      frameCamera.getWorldDirection(forward)
      store.setPlayerPose({ x: frameCamera.position.x, z: frameCamera.position.z, dirX: forward.x, dirZ: forward.z })
      lastPoseUpdate.current = state.clock.elapsedTime
    }
  })

  if (mobile || !entered || activePoster) return null
  return <PointerLockControls makeDefault onLock={() => setControlsLocked(true)} onUnlock={() => setControlsLocked(false)} />
}
