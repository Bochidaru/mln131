import type { RemotePlayer } from '../store/useStore'

export const PVP_INTERACTION_RANGE = 2
const TARGET_HALF_WIDTH = 0.36
const TARGET_HEIGHT = 1.8
const EPSILON = 0.0001

type Vector3Like = { x: number; y: number; z: number }

function rayBoxDistance(origin: Vector3Like, direction: Vector3Like, min: Vector3Like, max: Vector3Like) {
  let near = 0
  let far = Infinity

  for (const axis of ['x', 'y', 'z'] as const) {
    if (Math.abs(direction[axis]) < EPSILON) {
      if (origin[axis] < min[axis] || origin[axis] > max[axis]) return null
      continue
    }

    const first = (min[axis] - origin[axis]) / direction[axis]
    const second = (max[axis] - origin[axis]) / direction[axis]
    near = Math.max(near, Math.min(first, second))
    far = Math.min(far, Math.max(first, second))
    if (near > far) return null
  }

  return far >= 0 ? near : null
}

export function findAimedPvpTarget(players: RemotePlayer[], origin: Vector3Like, direction: Vector3Like) {
  const directionLength = Math.hypot(direction.x, direction.y, direction.z)
  if (directionLength < EPSILON) return undefined
  const ray = {
    x: direction.x / directionLength,
    y: direction.y / directionLength,
    z: direction.z / directionLength,
  }
  let target: RemotePlayer | undefined
  let nearestHit = Infinity
  let nearestCenter = Infinity

  for (const player of players) {
    const centerDistanceSq = (player.x - origin.x) ** 2 + (player.z - origin.z) ** 2
    if (centerDistanceSq > PVP_INTERACTION_RANGE * PVP_INTERACTION_RANGE) continue
    const hitDistance = rayBoxDistance(origin, ray,
      { x: player.x - TARGET_HALF_WIDTH, y: 0, z: player.z - TARGET_HALF_WIDTH },
      { x: player.x + TARGET_HALF_WIDTH, y: TARGET_HEIGHT, z: player.z + TARGET_HALF_WIDTH })
    if (hitDistance === null || hitDistance > nearestHit || hitDistance === nearestHit && centerDistanceSq >= nearestCenter) continue
    target = player
    nearestHit = hitDistance
    nearestCenter = centerDistanceSq
  }

  return target
}
