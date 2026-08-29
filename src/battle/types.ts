export type BattleTeam = 'player' | 'enemy'

export type UnitAnimState = 'idle' | 'moving' | 'shooting' | 'dying' | 'dead'

export interface BattleUnit {
  id: string
  team: BattleTeam
  label: string
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
  state: UnitAnimState
  stateTimer: number
  facing: number
  animFrame: number
  shootTargetId: string | null
  squadIndex: number
}

export interface BattleTracer {
  id: string
  fromX: number
  fromY: number
  toX: number
  toY: number
  team: BattleTeam
  life: number
}

export interface BattleCover {
  x: number
  y: number
  width: number
  height: number
}

export type BattleStatus = 'active' | 'victory' | 'defeat'

export interface BattleState {
  active: boolean
  planetId: string
  planetName: string
  enemyColor: string
  status: BattleStatus
  units: BattleUnit[]
  tracers: BattleTracer[]
  covers: BattleCover[]
  selectedUnitId: string | null
  initialPlayerCount: number
  elapsed: number
  width: number
  height: number
}
