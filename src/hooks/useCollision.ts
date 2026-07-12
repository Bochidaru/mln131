import { Vector3 } from 'three'
import { galleryLayouts, walkableZones } from '../data/layout'

const PLAYER_RADIUS = 0.38

const blockers = [
  { minX: -7.3, maxX: -3.2, minZ: -5.8, maxZ: -3.2 },
  { minX: -1.05, maxX: 1.05, minZ: -4.2, maxZ: -2.1 },
  { minX: 4.45, maxX: 7.95, minZ: -6.55, maxZ: -5.05 },
  { minX: 4.45, maxX: 7.95, minZ: -8.05, maxZ: -6.55 },
  ...galleryLayouts.flatMap((gallery) => {
    const benchX = gallery.center.x + (gallery.side === 'left' ? 1.2 : -1.2)
    const plinthX = gallery.center.x + (gallery.side === 'left' ? -4.7 : 4.7)
    const caseX = gallery.center.x + (gallery.side === 'left' ? 4.9 : -4.9)
    return [
      { minX: benchX - .65, maxX: benchX + .65, minZ: gallery.center.z - 1.8, maxZ: gallery.center.z + 1.8 },
      { minX: plinthX - .75, maxX: plinthX + .75, minZ: gallery.center.z + 5.15, maxZ: gallery.center.z + 6.65 },
      { minX: caseX - .95, maxX: caseX + .95, minZ: gallery.center.z - 6.75, maxZ: gallery.center.z - 4.85 },
    ]
  }),
]

function isWalkable(x: number, z: number) {
  const insideZone = walkableZones.some((zone) => (
    x >= zone.minX + PLAYER_RADIUS && x <= zone.maxX - PLAYER_RADIUS
    && z >= zone.minZ + PLAYER_RADIUS && z <= zone.maxZ - PLAYER_RADIUS
  ))
  if (!insideZone) return false
  return !blockers.some((blocker) => (
    x >= blocker.minX - PLAYER_RADIUS && x <= blocker.maxX + PLAYER_RADIUS
    && z >= blocker.minZ - PLAYER_RADIUS && z <= blocker.maxZ + PLAYER_RADIUS
  ))
}

export function resolvePlayerMovement(position: Vector3, displacement: Vector3) {
  const nextX = position.x + displacement.x
  if (isWalkable(nextX, position.z)) position.x = nextX

  const nextZ = position.z + displacement.z
  if (isWalkable(position.x, nextZ)) position.z = nextZ

  position.y = 1.68
  return position
}

export function constrainPlayer(position: Vector3) {
  position.y = 1.68
  return position
}
