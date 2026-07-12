export type MuseumArea = 'grounds' | 'lobby' | 'corridor' | `room-${number}`
export type GallerySide = 'left' | 'right'

export interface GalleryLayout {
  roomId: number
  center: { x: number; z: number }
  size: { width: number; depth: number }
  side: GallerySide
  accent: string
}

export interface WalkableZone {
  id: string
  area: MuseumArea
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

const galleryZ = [-21, -42, -63, -82]
const accents = ['#a34732', '#3e6571', '#8b6a32', '#72536f', '#7a4a36', '#416558', '#86644d', '#9b3c32']

export const galleryLayouts: GalleryLayout[] = galleryZ.flatMap((z, index) => ([
  { roomId: index * 2 + 1, center: { x: -12.5, z }, size: { width: 16.6, depth: 17.5 }, side: 'left' as const, accent: accents[index * 2] },
  { roomId: index * 2 + 2, center: { x: 12.5, z }, size: { width: 16.6, depth: 17.5 }, side: 'right' as const, accent: accents[index * 2 + 1] },
]))

const mainZones: WalkableZone[] = [
  { id: 'grounds', area: 'grounds', minX: -10, maxX: 10, minZ: 8, maxZ: 46 },
  { id: 'lobby', area: 'lobby', minX: -13, maxX: 13, minZ: -11, maxZ: 9 },
  { id: 'corridor', area: 'corridor', minX: -4, maxX: 4, minZ: -91, maxZ: -10 },
  ...galleryLayouts.map<WalkableZone>((gallery) => ({
    id: `gallery-${gallery.roomId}`,
    area: `room-${gallery.roomId}`,
    minX: gallery.center.x - gallery.size.width / 2,
    maxX: gallery.center.x + gallery.size.width / 2,
    minZ: gallery.center.z - gallery.size.depth / 2,
    maxZ: gallery.center.z + gallery.size.depth / 2,
  })),
]

const doorZones: WalkableZone[] = galleryLayouts.map((gallery) => ({
  id: `door-${gallery.roomId}`,
  area: `room-${gallery.roomId}`,
  minX: gallery.side === 'left' ? -5 : 3,
  maxX: gallery.side === 'left' ? -3 : 5,
  minZ: gallery.center.z - 2.2,
  maxZ: gallery.center.z + 2.2,
}))

export const walkableZones = [...mainZones, ...doorZones]

export const museumMapBounds = { minX: -23, maxX: 23, minZ: -93, maxZ: 46 }

export function getAreaAt(x: number, z: number): MuseumArea {
  const gallery = galleryLayouts.find((item) => {
    const halfWidth = item.size.width / 2
    const halfDepth = item.size.depth / 2
    const insideRoom = x >= item.center.x - halfWidth && x <= item.center.x + halfWidth
      && z >= item.center.z - halfDepth && z <= item.center.z + halfDepth
    const insideDoor = Math.abs(z - item.center.z) <= 2.2
      && (item.side === 'left' ? x >= -5 && x <= -3 : x >= 3 && x <= 5)
    return insideRoom || insideDoor
  })
  if (gallery) return `room-${gallery.roomId}`
  if (x >= -13 && x <= 13 && z >= -11 && z <= 9) return 'lobby'
  if (x >= -10 && x <= 10 && z >= 8 && z <= 46) return 'grounds'
  return 'corridor'
}
