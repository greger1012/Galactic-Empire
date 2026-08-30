export type BattleTeam = 'player' | 'enemy'

export type UnitAnimState = 'idle' | 'moving' | 'shooting' | 'dying' | 'dead'

export type CoverLevel = 'none' | 'half' | 'full'

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
  holdPosition: boolean
  suppressedTimer: number
  grenadeCooldown: number
  coverLevel: CoverLevel
  pendingGrenade: { x: number; y: number } | null
}

export interface BattleTracer {
  id: string
  fromX: number
  fromY: number
  toX: number
  toY: number
  team: BattleTeam
  life: number
  blocked: boolean
}

export interface BattleExplosion {
  id: string
  x: number
  y: number
  radius: number
  life: number
  maxLife: number
  team: BattleTeam
}

export interface BattleCover {
  x: number
  y: number
  width: number
  height: number
  level: CoverLevel
}

export type BattleStatus = 'active' | 'victory' | 'defeat'

export type ActiveAbility = 'none' | 'grenade'

export interface DragSelect {
  startX: number
  startY: number
  endX: number
  endY: number
}

export interface BattleState {
  active: boolean
  planetId: string
  planetName: string
  enemyColor: string
  status: BattleStatus
  paused: boolean
  units: BattleUnit[]
  tracers: BattleTracer[]
  explosions: BattleExplosion[]
  covers: BattleCover[]
  selectedUnitIds: string[]
  dragSelect: DragSelect | null
  activeAbility: ActiveAbility
  initialPlayerCount: number
  elapsed: number
  width: number
  height: number
}
