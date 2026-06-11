export type Direction = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW'

export interface TintEntry {
  tint: 0 | 1
  confidence: number
  altitude: number
  azimuth: number
}

// [month(1-12)][direction][hour][penetration_depth]
export type TintLookup = Record<number, Record<Direction, Record<number, Record<number, TintEntry>>>>

export interface IGU {
  id: string
  direction: Direction
  floor: number
  facadeIndex: number
  penetrationDepth: number
  windowHeight: number
  position: [number, number, number]
  rotation: [number, number, number]
  zoneId: string | null
}

export type ScheduleSlot = 'auto' | 'clear' | 'tinted'

export interface Zone {
  id: string
  name: string
  color: string
  penetrationDepth: number
  iguIds: string[]
  schedule: ScheduleSlot[]      // length 24, one per hour
  energyModeEnabled: boolean
  occupied: boolean
}

export interface Site {
  id: string
  name: string
  lat: number
  lon: number
  file: string
}
