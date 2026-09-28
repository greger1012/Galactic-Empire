import type { ShipType } from '../../game/types'
import type { OrbitalDoctrine } from '../orbitalEngagement'

export type VoidTeam = 'player' | 'enemy'

export interface VoidTracer {
  id: string
  fromX: number
  fromY: number
  toX: number
  toY: number
  team: VoidTeam
  life: number
}

export interface VoidShipUnit {
  id: string
  team: VoidTeam
  shipType?: ShipType
  label: string
  icon: string
  x: number
  y: number
  moveTargetX: number | null
  moveTargetY: number | null
  health: number
  maxHealth: number
  damage: number
  range: number
  moveSpeed: number
  fireCooldown: number
  fireInterval: number
  shootTargetId: string | null
}

export type OrbitalTacticalStatus = 'active' | 'victory' | 'defeat'

export interface OrbitalTacticalState {
  active: true
  width: number
  height: number
  planetName: string
  enemyColor: string
  doctrine: OrbitalDoctrine
  aegisHp: number
  aegisMaxHp: number
  aegisX: number
  aegisY: number
  ships: VoidShipUnit[]
  tracers: VoidTracer[]
  selectedUnitIds: string[]
  dragSelect: { startX: number; startY: number; endX: number; endY: number } | null
  paused: boolean
  status: OrbitalTacticalStatus
  initialPlayerCount: number
  elapsed: number
}
