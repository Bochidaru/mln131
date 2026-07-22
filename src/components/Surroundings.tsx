import { useFrame } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import {
  CanvasTexture,
  Color,
  DynamicDrawUsage,
  Object3D,
  SRGBColorSpace,
  type InstancedMesh,
} from 'three'

// Thành phố nằm hoàn toàn ngoài vùng walkable của bảo tàng. Tất cả nhà, xe,
// người và nội thất đường phố đều dùng instancing, không đổ bóng và không tham
// gia collision để cảnh đông nhưng vẫn nhẹ.

function makeRng(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
}

type Point2 = readonly [number, number]

interface RouteSegment {
  x0: number
  z0: number
  dx: number
  dz: number
  start: number
  length: number
  rotationY: number
}

interface Route {
  segments: RouteSegment[]
  length: number
}

interface RouteSample {
  x: number
  z: number
  dx: number
  dz: number
  rotationY: number
}

function makeRoute(points: readonly Point2[]): Route {
  const segments: RouteSegment[] = []
  let total = 0
  for (let index = 0; index < points.length; index++) {
    const [x0, z0] = points[index]
    const [x1, z1] = points[(index + 1) % points.length]
    const vx = x1 - x0
    const vz = z1 - z0
    const length = Math.hypot(vx, vz)
    if (length === 0) continue
    const dx = vx / length
    const dz = vz / length
    segments.push({ x0, z0, dx, dz, start: total, length, rotationY: -Math.atan2(dz, dx) })
    total += length
  }
  return { segments, length: total }
}

function sampleRoute(route: Route, distance: number, target: RouteSample) {
  const wrapped = ((distance % route.length) + route.length) % route.length
  let segment = route.segments[route.segments.length - 1]
  for (const candidate of route.segments) {
    if (wrapped < candidate.start + candidate.length) {
      segment = candidate
      break
    }
  }
  const local = wrapped - segment.start
  target.x = segment.x0 + segment.dx * local
  target.z = segment.z0 + segment.dz * local
  target.dx = segment.dx
  target.dz = segment.dz
  target.rotationY = segment.rotationY
}

interface BuildingSpec {
  x: number
  z: number
  width: number
  depth: number
  height: number
  color: string
}

const buildingColors = [
  '#c7c0b4', '#aeb7bb', '#9caab2', '#b8ada1',
  '#c8b8a6', '#a9b2ad', '#b6b8b4', '#c3c0b8',
]

function makeBuildings() {
  const random = makeRng(20260712)
  const buildings: BuildingSpec[] = []

  const add = (x: number, z: number, width: number, depth: number, nearMuseum: boolean) => {
    const tower = !nearMuseum && random() < 0.16
    const height = nearMuseum
      ? 12 + random() * 18
      : 15 + random() * 25 + (tower ? 18 + random() * 24 : 0)
    buildings.push({
      x: x + (random() - 0.5) * 1.8,
      z: z + (random() - 0.5) * 2.2,
      width,
      depth,
      height: Math.min(height, 64),
      color: buildingColors[Math.floor(random() * buildingColors.length)],
    })
  }

  // Hai dải phố chạy dọc hai bên bảo tàng.
  for (const side of [-1, 1] as const) {
    for (let column = 0; column < 8; column++) {
      for (let row = 0; row < 9; row++) {
        const x = side * (49 + column * 14.2)
        const z = -92 + row * 17
        add(x, z, 8.2 + random() * 2.2, 10 + random() * 2.6, column === 0)
      }
    }
  }

  // Các ô phố đối diện cổng chính.
  for (let row = 0; row < 6; row++) {
    for (let column = 0; column < 7; column++) {
      add(-42 + column * 14, 76 + row * 16, 9.2 + random() * 2.2, 8.5 + random() * 2.2, row === 0)
    }
  }

  // Cụm nhà phía sau bảo tàng hoàn thiện đường chân trời bốn phía.
  for (let row = 0; row < 3; row++) {
    for (let column = 0; column < 7; column++) {
      add(-42 + column * 14, -126 - row * 16, 9.2 + random() * 2.1, 8.5 + random() * 2.4, row === 0)
    }
  }

  return buildings
}

function createFacadeTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 192
  const context = canvas.getContext('2d')
  if (context) {
    const random = makeRng(711)
    context.fillStyle = '#d5d3cc'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.fillStyle = '#777d7f'
    context.fillRect(0, 0, canvas.width, 5)
    for (let row = 0; row < 10; row++) {
      for (let column = 0; column < 6; column++) {
        const x = 7 + column * 20
        const y = 9 + row * 18
        context.fillStyle = random() < 0.12 ? '#d6bd87' : random() < 0.35 ? '#8096a0' : '#657b85'
        context.fillRect(x, y, 13, 10)
        context.fillStyle = 'rgba(220, 230, 230, 0.22)'
        context.fillRect(x + 2, y + 1, 2, 8)
      }
    }
  }
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

function createWindowEmissionTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 192
  const context = canvas.getContext('2d')
  if (context) {
    const random = makeRng(1711)
    context.fillStyle = '#000000'
    context.fillRect(0, 0, canvas.width, canvas.height)
    for (let row = 0; row < 10; row++) {
      for (let column = 0; column < 6; column++) {
        if (random() > 0.38) continue
        context.fillStyle = random() < 0.55 ? '#9ca9a8' : '#b9a77e'
        context.fillRect(7 + column * 20, 9 + row * 18, 13, 10)
      }
    }
  }
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

function CityBuildings({ buildings }: { buildings: BuildingSpec[] }) {
  const bodies = useRef<InstancedMesh>(null)
  const roofs = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new Object3D(), [])
  const facadeTexture = useMemo(() => createFacadeTexture(), [])
  const windowEmissionTexture = useMemo(() => createWindowEmissionTexture(), [])

  useEffect(() => () => facadeTexture.dispose(), [facadeTexture])
  useEffect(() => () => windowEmissionTexture.dispose(), [windowEmissionTexture])

  useLayoutEffect(() => {
    if (!bodies.current || !roofs.current) return
    buildings.forEach((building, index) => {
      dummy.position.set(building.x, building.height / 2, building.z)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.set(building.width, building.height, building.depth)
      dummy.updateMatrix()
      bodies.current?.setMatrixAt(index, dummy.matrix)
      bodies.current?.setColorAt(index, new Color(building.color))

      dummy.position.set(building.x, building.height + 0.24, building.z)
      dummy.scale.set(building.width * 1.035, 0.48, building.depth * 1.035)
      dummy.updateMatrix()
      roofs.current?.setMatrixAt(index, dummy.matrix)
      roofs.current?.setColorAt(index, new Color(building.color).multiplyScalar(0.58))
    })
    bodies.current.instanceMatrix.needsUpdate = true
    roofs.current.instanceMatrix.needsUpdate = true
    if (bodies.current.instanceColor) bodies.current.instanceColor.needsUpdate = true
    if (roofs.current.instanceColor) roofs.current.instanceColor.needsUpdate = true
    bodies.current.computeBoundingSphere()
    roofs.current.computeBoundingSphere()
  }, [buildings, dummy])

  return <>
    <instancedMesh ref={bodies} args={[undefined, undefined, buildings.length]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        map={facadeTexture}
        emissiveMap={windowEmissionTexture}
        emissive="#dfe8e5"
        emissiveIntensity={0.48}
        vertexColors
        roughness={0.82}
        metalness={0.04}
      />
    </instancedMesh>
    <instancedMesh ref={roofs} args={[undefined, undefined, buildings.length]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial vertexColors emissive="#2f3435" emissiveIntensity={0.22} roughness={0.88} metalness={0.08} />
    </instancedMesh>
  </>
}

interface BoxSpec {
  position: readonly [number, number, number]
  scale: readonly [number, number, number]
  rotationY?: number
}

function StaticBoxes({
  items,
  color,
  roughness = 0.9,
  metalness = 0,
  emissive,
  emissiveIntensity = 0,
}: {
  items: BoxSpec[]
  color: string
  roughness?: number
  metalness?: number
  emissive?: string
  emissiveIntensity?: number
}) {
  const mesh = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new Object3D(), [])

  useLayoutEffect(() => {
    if (!mesh.current) return
    items.forEach((item, index) => {
      dummy.position.set(...item.position)
      dummy.rotation.set(0, item.rotationY ?? 0, 0)
      dummy.scale.set(...item.scale)
      dummy.updateMatrix()
      mesh.current?.setMatrixAt(index, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
    mesh.current.computeBoundingSphere()
  }, [dummy, items])

  return <instancedMesh ref={mesh} args={[undefined, undefined, items.length]}>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial
      color={color}
      roughness={roughness}
      metalness={metalness}
      emissive={emissive}
      emissiveIntensity={emissiveIntensity}
    />
  </instancedMesh>
}

const cityBlocks: BoxSpec[] = [
  { position: [-97, -0.2, -25], scale: [106, 0.18, 150] },
  { position: [97, -0.2, -25], scale: [106, 0.18, 150] },
  { position: [0, -0.2, 118], scale: [90, 0.18, 96] },
  { position: [0, -0.2, -145], scale: [90, 0.18, 50] },
]

const roads: BoxSpec[] = [
  { position: [0, -0.08, 58], scale: [330, 0.14, 12] },
  { position: [0, -0.08, -108], scale: [330, 0.14, 12] },
  { position: [-34, -0.08, -25], scale: [10, 0.14, 166] },
  { position: [34, -0.08, -25], scale: [10, 0.14, 166] },
]

const sidewalks: BoxSpec[] = [
  { position: [0, -0.025, 49.5], scale: [330, 0.18, 5] },
  { position: [0, -0.025, 66.5], scale: [330, 0.18, 5] },
  { position: [0, -0.025, -99.5], scale: [330, 0.18, 5] },
  { position: [0, -0.025, -116.5], scale: [330, 0.18, 5] },
  { position: [-26.5, -0.025, -25], scale: [5, 0.18, 149] },
  { position: [26.5, -0.025, -25], scale: [5, 0.18, 149] },
  { position: [-41.5, -0.025, -25], scale: [5, 0.18, 149] },
  { position: [41.5, -0.025, -25], scale: [5, 0.18, 149] },
]

function makeRoadMarkings() {
  const marks: BoxSpec[] = []
  for (let x = -154; x <= 154; x += 8) {
    marks.push({ position: [x, 0.015, 58], scale: [3.8, 0.025, 0.16] })
    marks.push({ position: [x, 0.015, -108], scale: [3.8, 0.025, 0.16] })
  }
  for (let z = -96; z <= 46; z += 8) {
    marks.push({ position: [-34, 0.015, z], scale: [0.16, 0.025, 3.8] })
    marks.push({ position: [34, 0.015, z], scale: [0.16, 0.025, 3.8] })
  }
  for (let x = -5.4; x <= 5.4; x += 1.2) {
    marks.push({ position: [x, 0.022, 58], scale: [0.62, 0.03, 9.5] })
  }
  return marks
}

const roadMarkings = makeRoadMarkings()

function makeStreetTreePositions() {
  const positions: Point2[] = []
  for (let x = -84; x <= 84; x += 14) {
    if (Math.abs(x) > 8) positions.push([x, 49.4])
  }
  for (let z = -91; z <= 43; z += 18) {
    positions.push([-26.5, z], [26.5, z])
  }
  return positions
}

const streetTreePositions = makeStreetTreePositions()

function StreetTrees() {
  const trunks = useRef<InstancedMesh>(null)
  const crowns = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new Object3D(), [])
  const tones = useMemo(() => ['#3f6242', '#4b6d49', '#36573b'].map((tone) => new Color(tone)), [])

  useLayoutEffect(() => {
    if (!trunks.current || !crowns.current) return
    streetTreePositions.forEach(([x, z], index) => {
      dummy.position.set(x, 1.2, z)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.set(0.16, 2.4, 0.16)
      dummy.updateMatrix()
      trunks.current?.setMatrixAt(index, dummy.matrix)

      dummy.position.set(x, 3.25, z)
      dummy.scale.set(1.1, 1.35, 1.1)
      dummy.updateMatrix()
      crowns.current?.setMatrixAt(index, dummy.matrix)
      crowns.current?.setColorAt(index, tones[index % tones.length])
    })
    trunks.current.instanceMatrix.needsUpdate = true
    crowns.current.instanceMatrix.needsUpdate = true
    if (crowns.current.instanceColor) crowns.current.instanceColor.needsUpdate = true
    trunks.current.computeBoundingSphere()
    crowns.current.computeBoundingSphere()
  }, [dummy, tones])

  return <>
    <instancedMesh ref={trunks} args={[undefined, undefined, streetTreePositions.length]}>
      <cylinderGeometry args={[1, 1.25, 1, 7]} />
      <meshStandardMaterial color="#654e39" roughness={1} />
    </instancedMesh>
    <instancedMesh ref={crowns} args={[undefined, undefined, streetTreePositions.length]}>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial vertexColors roughness={1} />
    </instancedMesh>
  </>
}

function makeStreetLightPositions() {
  const positions: Point2[] = []
  for (let x = -72; x <= 72; x += 18) positions.push([x, 66.4])
  for (let z = -88; z <= 38; z += 21) positions.push([-41.5, z], [41.5, z])
  return positions
}

const streetLightPositions = makeStreetLightPositions()

function StreetLights() {
  const poles = useRef<InstancedMesh>(null)
  const lamps = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new Object3D(), [])

  useLayoutEffect(() => {
    if (!poles.current || !lamps.current) return
    streetLightPositions.forEach(([x, z], index) => {
      dummy.position.set(x, 1.65, z)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.set(0.065, 3.3, 0.065)
      dummy.updateMatrix()
      poles.current?.setMatrixAt(index, dummy.matrix)

      dummy.position.set(x, 3.32, z)
      dummy.scale.set(0.42, 0.13, 0.22)
      dummy.updateMatrix()
      lamps.current?.setMatrixAt(index, dummy.matrix)
    })
    poles.current.instanceMatrix.needsUpdate = true
    lamps.current.instanceMatrix.needsUpdate = true
    poles.current.computeBoundingSphere()
    lamps.current.computeBoundingSphere()
  }, [dummy])

  return <>
    <instancedMesh ref={poles} args={[undefined, undefined, streetLightPositions.length]}>
      <cylinderGeometry args={[1, 1.15, 1, 7]} />
      <meshStandardMaterial color="#333735" metalness={0.68} roughness={0.4} />
    </instancedMesh>
    <instancedMesh ref={lamps} args={[undefined, undefined, streetLightPositions.length]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#e8d29e" emissive="#d8aa58" emissiveIntensity={0.35} roughness={0.42} />
    </instancedMesh>
  </>
}

const trafficRoutes = [
  makeRoute([[-36, -106], [-36, 58], [36, 58], [36, -106]]),
  makeRoute([[-32, -110], [32, -110], [32, 62], [-32, 62]]),
  makeRoute([[-145, 55], [145, 55], [145, 61], [-145, 61]]),
  makeRoute([[-145, -105], [145, -105], [145, -111], [-145, -111]]),
]

interface VehicleSpec {
  route: number
  offset: number
  speed: number
  length: number
  width: number
  height: number
  color: string
}

const vehicleColors = ['#9b3028', '#315f78', '#d4b34d', '#d8d6ce', '#36413f', '#7d4f77', '#5f743d']

function makeVehicles() {
  const random = makeRng(404)
  const vehicles: VehicleSpec[] = []
  const counts = [8, 8, 12, 8]
  counts.forEach((count, routeIndex) => {
    const route = trafficRoutes[routeIndex]
    for (let index = 0; index < count; index++) {
      const van = random() < 0.14
      vehicles.push({
        route: routeIndex,
        offset: route.length * (index / count) + random() * 7,
        speed: 5.5 + random() * 4.5,
        length: van ? 4.4 : 3.25 + random() * 0.45,
        width: van ? 1.7 : 1.45 + random() * 0.2,
        height: van ? 0.78 : 0.58,
        color: vehicleColors[Math.floor(random() * vehicleColors.length)],
      })
    }
  })
  return vehicles
}

function Traffic({ vehicles }: { vehicles: VehicleSpec[] }) {
  const bodies = useRef<InstancedMesh>(null)
  const cabins = useRef<InstancedMesh>(null)
  const headlights = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new Object3D(), [])
  const sample = useMemo<RouteSample>(() => ({ x: 0, z: 0, dx: 1, dz: 0, rotationY: 0 }), [])

  useLayoutEffect(() => {
    if (!bodies.current || !cabins.current || !headlights.current) return
    bodies.current.instanceMatrix.setUsage(DynamicDrawUsage)
    cabins.current.instanceMatrix.setUsage(DynamicDrawUsage)
    headlights.current.instanceMatrix.setUsage(DynamicDrawUsage)
    vehicles.forEach((vehicle, index) => bodies.current?.setColorAt(index, new Color(vehicle.color)))
    if (bodies.current.instanceColor) bodies.current.instanceColor.needsUpdate = true
  }, [vehicles])

  useFrame(({ clock }) => {
    if (!bodies.current || !cabins.current || !headlights.current) return
    const elapsed = clock.elapsedTime
    vehicles.forEach((vehicle, index) => {
      sampleRoute(trafficRoutes[vehicle.route], vehicle.offset + elapsed * vehicle.speed, sample)

      dummy.position.set(sample.x, vehicle.height / 2 + 0.08, sample.z)
      dummy.rotation.set(0, sample.rotationY, 0)
      dummy.scale.set(vehicle.length, vehicle.height, vehicle.width)
      dummy.updateMatrix()
      bodies.current?.setMatrixAt(index, dummy.matrix)

      dummy.position.set(
        sample.x - sample.dx * vehicle.length * 0.08,
        vehicle.height + 0.35,
        sample.z - sample.dz * vehicle.length * 0.08,
      )
      dummy.scale.set(vehicle.length * 0.48, vehicle.height * 0.78, vehicle.width * 0.76)
      dummy.updateMatrix()
      cabins.current?.setMatrixAt(index, dummy.matrix)

      dummy.position.set(
        sample.x + sample.dx * vehicle.length * 0.51,
        vehicle.height * 0.58 + 0.09,
        sample.z + sample.dz * vehicle.length * 0.51,
      )
      dummy.scale.set(0.08, 0.16, vehicle.width * 0.68)
      dummy.updateMatrix()
      headlights.current?.setMatrixAt(index, dummy.matrix)
    })
    bodies.current.instanceMatrix.needsUpdate = true
    cabins.current.instanceMatrix.needsUpdate = true
    headlights.current.instanceMatrix.needsUpdate = true
  })

  return <>
    <instancedMesh ref={bodies} args={[undefined, undefined, vehicles.length]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial vertexColors roughness={0.48} metalness={0.16} />
    </instancedMesh>
    <instancedMesh ref={cabins} args={[undefined, undefined, vehicles.length]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#40515a" roughness={0.28} metalness={0.28} />
    </instancedMesh>
    <instancedMesh ref={headlights} args={[undefined, undefined, vehicles.length]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#fff0bd" emissive="#ffd77a" emissiveIntensity={1.5} toneMapped={false} />
    </instancedMesh>
  </>
}

const pedestrianRoutes = [
  makeRoute([[-26.5, -98], [-26.5, 49], [26.5, 49], [26.5, -98]]),
  makeRoute([[-41.5, -117], [41.5, -117], [41.5, 67], [-41.5, 67]]),
  makeRoute([[-82, 48.5], [82, 48.5], [82, 67], [-82, 67]]),
]

interface WalkerSpec {
  route: number
  offset: number
  speed: number
  phase: number
  scale: number
  clothing: string
  skin: string
  trousers: string
}

const clothingColors = ['#93463e', '#365d72', '#b28b45', '#556b4f', '#765676', '#d0c2ad', '#444b4c']
const skinTones = ['#e0b18f', '#c98f6d', '#a96f52', '#80513d', '#edc6a6']
const trouserColors = ['#30363a', '#4a4541', '#2f4050', '#5b5147']

function makeWalkers() {
  const random = makeRng(905)
  const walkers: WalkerSpec[] = []
  const counts = [22, 22, 20]
  counts.forEach((count, routeIndex) => {
    const route = pedestrianRoutes[routeIndex]
    for (let index = 0; index < count; index++) {
      walkers.push({
        route: routeIndex,
        offset: route.length * (index / count) + random() * 5,
        speed: 0.62 + random() * 0.62,
        phase: random() * Math.PI * 2,
        scale: 0.9 + random() * 0.18,
        clothing: clothingColors[Math.floor(random() * clothingColors.length)],
        skin: skinTones[Math.floor(random() * skinTones.length)],
        trousers: trouserColors[Math.floor(random() * trouserColors.length)],
      })
    }
  })
  return walkers
}

function Pedestrians({ walkers }: { walkers: WalkerSpec[] }) {
  const torsos = useRef<InstancedMesh>(null)
  const heads = useRef<InstancedMesh>(null)
  const legs = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new Object3D(), [])
  const sample = useMemo<RouteSample>(() => ({ x: 0, z: 0, dx: 1, dz: 0, rotationY: 0 }), [])

  useLayoutEffect(() => {
    if (!torsos.current || !heads.current || !legs.current) return
    torsos.current.instanceMatrix.setUsage(DynamicDrawUsage)
    heads.current.instanceMatrix.setUsage(DynamicDrawUsage)
    legs.current.instanceMatrix.setUsage(DynamicDrawUsage)
    walkers.forEach((walker, index) => {
      torsos.current?.setColorAt(index, new Color(walker.clothing))
      heads.current?.setColorAt(index, new Color(walker.skin))
      legs.current?.setColorAt(index * 2, new Color(walker.trousers))
      legs.current?.setColorAt(index * 2 + 1, new Color(walker.trousers))
    })
    if (torsos.current.instanceColor) torsos.current.instanceColor.needsUpdate = true
    if (heads.current.instanceColor) heads.current.instanceColor.needsUpdate = true
    if (legs.current.instanceColor) legs.current.instanceColor.needsUpdate = true
  }, [walkers])

  useFrame(({ clock }) => {
    if (!torsos.current || !heads.current || !legs.current) return
    const elapsed = clock.elapsedTime
    walkers.forEach((walker, index) => {
      sampleRoute(pedestrianRoutes[walker.route], walker.offset + elapsed * walker.speed, sample)
      const step = Math.sin(elapsed * 7 * walker.speed + walker.phase)
      const bob = Math.abs(step) * 0.035
      const scale = walker.scale

      dummy.position.set(sample.x, 0.95 * scale + bob, sample.z)
      dummy.rotation.set(0, sample.rotationY, 0)
      dummy.scale.set(scale, scale, scale)
      dummy.updateMatrix()
      torsos.current?.setMatrixAt(index, dummy.matrix)

      dummy.position.set(sample.x, 1.61 * scale + bob, sample.z)
      dummy.scale.set(0.2 * scale, 0.2 * scale, 0.2 * scale)
      dummy.updateMatrix()
      heads.current?.setMatrixAt(index, dummy.matrix)

      const perpendicularX = -sample.dz
      const perpendicularZ = sample.dx
      for (let side = 0; side < 2; side++) {
        const sign = side === 0 ? -1 : 1
        const stride = sign * step * 0.13 * scale
        dummy.position.set(
          sample.x + sample.dx * stride + perpendicularX * sign * 0.1 * scale,
          0.28 * scale,
          sample.z + sample.dz * stride + perpendicularZ * sign * 0.1 * scale,
        )
        dummy.scale.set(0.12 * scale, 0.56 * scale, 0.14 * scale)
        dummy.updateMatrix()
        legs.current?.setMatrixAt(index * 2 + side, dummy.matrix)
      }
    })
    torsos.current.instanceMatrix.needsUpdate = true
    heads.current.instanceMatrix.needsUpdate = true
    legs.current.instanceMatrix.needsUpdate = true
  })

  return <>
    <instancedMesh ref={torsos} args={[undefined, undefined, walkers.length]} frustumCulled={false}>
      <capsuleGeometry args={[0.18, 0.62, 4, 6]} />
      <meshStandardMaterial vertexColors emissive="#282828" emissiveIntensity={0.2} roughness={0.88} />
    </instancedMesh>
    <instancedMesh ref={heads} args={[undefined, undefined, walkers.length]} frustumCulled={false}>
      <sphereGeometry args={[1, 8, 6]} />
      <meshStandardMaterial vertexColors roughness={0.92} />
    </instancedMesh>
    <instancedMesh ref={legs} args={[undefined, undefined, walkers.length * 2]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial vertexColors emissive="#202020" emissiveIntensity={0.14} roughness={0.94} />
    </instancedMesh>
  </>
}

export function Surroundings({ lowEnd = false }: { lowEnd?: boolean }) {
  const buildings = useMemo(() => makeBuildings(), [])
  const vehicles = useMemo(() => makeVehicles(), [])
  const walkers = useMemo(() => makeWalkers(), [])

  return <group>
    <mesh position={[0, -0.32, -22]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[420, 420]} />
      <meshStandardMaterial color="#8d928c" roughness={1} />
    </mesh>

    <StaticBoxes items={cityBlocks} color="#aaa9a3" roughness={1} />
    <StaticBoxes items={roads} color="#303536" roughness={0.96} />
    <StaticBoxes items={sidewalks} color="#b9b8b1" roughness={0.94} />
    {lowEnd ? <></> : <>
      <StaticBoxes items={roadMarkings} color="#d7d1b2" roughness={0.72} />
      <CityBuildings buildings={buildings} />
      <StreetTrees />
      <StreetLights />
      <Traffic vehicles={vehicles} />
      <Pedestrians walkers={walkers} />
    </>}
  </group>
}
