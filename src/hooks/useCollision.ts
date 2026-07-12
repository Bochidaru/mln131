import { Vector3 } from 'three'
export function constrainPlayer(position: Vector3) {
  position.x = Math.max(-5.35, Math.min(5.35, position.x))
  position.z = Math.max(-84.5, Math.min(4.5, position.z))
  position.y = 1.6
  return position
}
