import { Vector3 } from 'three'
import { galleryLayouts, walkableZones } from '../data/layout'
import { entranceDoorState } from '../utils/doorState'

const PLAYER_RADIUS = 0.38

// Kính lối vào: hai tấm cố định hai bên luôn chặn; khe giữa (hai cánh trượt)
// chỉ chặn khi cửa còn gần đóng, buộc người chơi chờ cửa mở như ngoài đời.
const DOOR_BAND_MIN_Z = 9.12
const DOOR_BAND_MAX_Z = 9.5
const entranceSideBlockers = [
  { minX: -7.4, maxX: -2.45, minZ: DOOR_BAND_MIN_Z, maxZ: DOOR_BAND_MAX_Z },
  { minX: 2.45, maxX: 7.4, minZ: DOOR_BAND_MIN_Z, maxZ: DOOR_BAND_MAX_Z },
]
const entranceCenterBlocker = { minX: -2.6, maxX: 2.6, minZ: DOOR_BAND_MIN_Z, maxZ: DOOR_BAND_MAX_Z }

const blockers = [
  { minX: -8.4, maxX: -4.2, minZ: -10.15, maxZ: -8.65 },
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

type Box = { minX: number; maxX: number; minZ: number; maxZ: number }

function hits(x: number, z: number, box: Box) {
  return x >= box.minX - PLAYER_RADIUS && x <= box.maxX + PLAYER_RADIUS
    && z >= box.minZ - PLAYER_RADIUS && z <= box.maxZ + PLAYER_RADIUS
}

function isWalkable(x: number, z: number) {
  const insideZone = walkableZones.some((zone) => (
    x >= zone.minX + PLAYER_RADIUS && x <= zone.maxX - PLAYER_RADIUS
    && z >= zone.minZ + PLAYER_RADIUS && z <= zone.maxZ - PLAYER_RADIUS
  ))
  if (!insideZone) return false
  if (blockers.some((blocker) => hits(x, z, blocker))) return false
  if (entranceSideBlockers.some((blocker) => hits(x, z, blocker))) return false
  if (entranceDoorState.openAmount < 0.55 && hits(x, z, entranceCenterBlocker)) return false
  return true
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
