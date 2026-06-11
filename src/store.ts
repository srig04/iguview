import { create } from 'zustand'
import type { IGU, Zone, TintLookup, Direction, Site, ScheduleSlot } from './types'

export const SITES: Site[] = [
  { id: 'nyc', name: 'New York, NY', lat: 40.7559, lon: -73.9704, file: '/tint_lookup_nyc.json' },
  { id: 'phx', name: 'Phoenix, AZ',  lat: 33.4484, lon: -112.0740, file: '/tint_lookup_phx.json' },
  { id: 'sea', name: 'Seattle, WA',  lat: 47.6062, lon: -122.3321, file: '/tint_lookup_sea.json' },
  { id: 'mia', name: 'Miami, FL',    lat: 25.7617, lon: -80.1918,  file: '/tint_lookup_mia.json' },
]

// ── Building constants ────────────────────────────────────────────────────────
const BUILDING_HALF = 19
const FLOORS        = 5
const FLOOR_H       = 3.5
const IGUS_PER_ROW  = 7
const IGU_SPACING   = 4.8
const IGU_OFFSET    = 0.06   // panel sits just off the wall surface

const ZONE_COLORS = [
  '#3b82f6','#10b981','#f59e0b','#ef4444',
  '#8b5cf6','#ec4899','#14b8a6','#f97316',
]

// Only 4 cardinal facades on a rectangular building
const DIRECTIONS: Direction[] = ['N', 'E', 'S', 'W']

const FACADE_CONFIG: Record<string, {
  rotation: [number, number, number]
  spreadAxis: 'x' | 'z'
  baseX: number
  baseZ: number
}> = {
  N: { rotation: [0, 0,          0], spreadAxis: 'x', baseX: 0,                      baseZ: -(BUILDING_HALF + IGU_OFFSET) },
  S: { rotation: [0, Math.PI,    0], spreadAxis: 'x', baseX: 0,                      baseZ:  (BUILDING_HALF + IGU_OFFSET) },
  E: { rotation: [0,-Math.PI/2,  0], spreadAxis: 'z', baseX:  (BUILDING_HALF + IGU_OFFSET), baseZ: 0 },
  W: { rotation: [0, Math.PI/2,  0], spreadAxis: 'z', baseX: -(BUILDING_HALF + IGU_OFFSET), baseZ: 0 },
}

function buildIGUs(): IGU[] {
  const igus: IGU[] = []
  DIRECTIONS.forEach(dir => {
    const { rotation, spreadAxis, baseX, baseZ } = FACADE_CONFIG[dir]
    for (let floor = 1; floor <= FLOORS; floor++) {
      const y = (floor - 1) * FLOOR_H + FLOOR_H * 0.5 + 0.05
      for (let i = 0; i < IGUS_PER_ROW; i++) {
        const offset = (i - (IGUS_PER_ROW - 1) / 2) * IGU_SPACING
        const x = spreadAxis === 'x' ? baseX + offset : baseX
        const z = spreadAxis === 'z' ? baseZ + offset : baseZ
        igus.push({
          id: `${dir}-F${floor}-${i}`,
          direction: dir as Direction,
          floor, facadeIndex: i,
          penetrationDepth: 1,
          windowHeight: 8,
          position: [x, y, z],
          rotation,
          zoneId: null,
        })
      }
    }
  })
  return igus
}

// ── Store ─────────────────────────────────────────────────────────────────────
interface AppState {
  tintLookup: TintLookup | null
  currentSiteId: string
  igus: IGU[]
  zones: Zone[]
  hour: number
  month: number
  selectedIds: string[]
  colorIndex: number
  cameraAzimuth: number   // updated every frame by CameraSync

  setTintLookup: (l: TintLookup) => void
  setSite: (siteId: string) => void
  setHour:  (h: number) => void
  setMonth: (m: number) => void
  toggleSelect: (id: string) => void
  clearSelection: () => void
  createZone: (name: string, depth: number) => void
  updateZonePenetration: (zoneId: string, depth: number) => void
  ungroupZone: (zoneId: string) => void
  setCameraAzimuth: (a: number) => void
  cycleScheduleHour: (zoneId: string, hour: number) => void
  toggleZoneEnergyMode: (zoneId: string) => void
  toggleZoneOccupied: (zoneId: string) => void
}

export const useStore = create<AppState>((set) => ({
  tintLookup: null,
  currentSiteId: SITES[0].id,
  igus: buildIGUs(),
  zones: [],
  hour: 10,
  month: 6,
  selectedIds: [],
  colorIndex: 0,
  cameraAzimuth: 0,

  setTintLookup: (tintLookup) => set({ tintLookup }),
  setSite: (currentSiteId) => set({ currentSiteId, tintLookup: null }),
  setHour:  (hour)  => set({ hour }),
  setMonth: (month) => set({ month }),
  setCameraAzimuth: (cameraAzimuth) => set({ cameraAzimuth }),

  toggleSelect: (id) => set(s => ({
    selectedIds: s.selectedIds.includes(id)
      ? s.selectedIds.filter(x => x !== id)
      : [...s.selectedIds, id],
  })),

  clearSelection: () => set({ selectedIds: [] }),

  createZone: (name, depth) => set(s => {
    if (!s.selectedIds.length) return s
    const color  = ZONE_COLORS[s.colorIndex % ZONE_COLORS.length]
    const zoneId = `zone-${Date.now()}`
    const schedule: ScheduleSlot[] = Array(24).fill('auto')
    return {
      zones: [...s.zones, { id: zoneId, name, color, penetrationDepth: depth, iguIds: [...s.selectedIds], schedule, energyModeEnabled: false, occupied: true }],
      igus:  s.igus.map(igu => s.selectedIds.includes(igu.id) ? { ...igu, zoneId, penetrationDepth: depth } : igu),
      selectedIds: [],
      colorIndex: s.colorIndex + 1,
    }
  }),

  updateZonePenetration: (zoneId, depth) => set(s => ({
    zones: s.zones.map(z => z.id === zoneId ? { ...z, penetrationDepth: depth } : z),
    igus:  s.igus.map(i => i.zoneId === zoneId ? { ...i, penetrationDepth: depth } : i),
  })),

  ungroupZone: (zoneId) => set(s => ({
    zones: s.zones.filter(z => z.id !== zoneId),
    igus:  s.igus.map(i => i.zoneId === zoneId ? { ...i, zoneId: null } : i),
  })),

  cycleScheduleHour: (zoneId, hour) => set(s => ({
    zones: s.zones.map(z => {
      if (z.id !== zoneId) return z
      const next: Record<ScheduleSlot, ScheduleSlot> = { auto: 'clear', clear: 'tinted', tinted: 'auto' }
      const schedule = [...z.schedule]
      schedule[hour] = next[schedule[hour]]
      return { ...z, schedule }
    }),
  })),

  toggleZoneEnergyMode: (zoneId) => set(s => ({
    zones: s.zones.map(z => z.id === zoneId ? { ...z, energyModeEnabled: !z.energyModeEnabled } : z),
  })),

  toggleZoneOccupied: (zoneId) => set(s => ({
    zones: s.zones.map(z => z.id === zoneId ? { ...z, occupied: !z.occupied } : z),
  })),
}))

// ── Pure tint lookup helper ───────────────────────────────────────────────────
export function getTint(
  lookup: TintLookup | null,
  direction: Direction,
  hour: number,
  month: number,
  depth: number,
): 0 | 1 {
  if (!lookup) return 0
  const entry = lookup[month]?.[direction]?.[hour]?.[depth]
  if (!entry) return 0
  // Physical hard rule: sun below horizon → always Clear, overrides model
  if (entry.altitude <= 0) return 0
  return entry.tint as 0 | 1
}

export function getSunPosition(
  lookup: TintLookup | null,
  month: number,
  hour: number,
): { altitude: number; azimuth: number } {
  // Use N/depth=0 — altitude & azimuth are site-wide, same for all directions
  const entry = lookup?.[month]?.['N']?.[hour]?.[0]
  return { altitude: entry?.altitude ?? -30, azimuth: entry?.azimuth ?? 180 }
}

export function getConfidence(
  lookup: TintLookup | null,
  direction: Direction,
  hour: number,
  month: number,
  depth: number,
): number {
  if (!lookup) return 0
  return lookup[month]?.[direction]?.[hour]?.[depth]?.confidence ?? 0
}

const WINTER_MONTHS = [12, 1, 2]
const SUMMER_MONTHS = [6, 7, 8]

// Combines schedule overrides, energy mode, and ML worst-case into one effective tint for a zone
export function getZoneEffectiveTint(
  lookup: TintLookup | null,
  zone: Zone,
  igus: IGU[],
  hour: number,
  month: number,
): 0 | 1 {
  const slot = zone.schedule[hour]
  if (slot === 'clear') return 0
  if (slot === 'tinted') return 1

  if (zone.energyModeEnabled && !zone.occupied) {
    if (WINTER_MONTHS.includes(month)) return 0
    if (SUMMER_MONTHS.includes(month)) return 1
  }

  return zone.iguIds.some(id => {
    const member = igus.find(i => i.id === id)
    return member ? getTint(lookup, member.direction, hour, month, member.penetrationDepth) === 1 : false
  }) ? 1 : 0
}
