import type { BattleCover, BattleState, BattleUnit } from './types'

const FIELD_WIDTH = 960
const FIELD_HEIGHT = 540

function spawnSquad(
  team: 'player' | 'enemy',
  count: number,
  baseX: number,
  baseY: number,
  label: string
): BattleUnit[] {
  const units: BattleUnit[] = []
  const cols = Math.ceil(Math.sqrt(count))

  for (let i = 0; i < count; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)
    const offsetX = (col - (cols - 1) / 2) * 36
    const offsetY = (row - Math.floor(count / cols) / 2) * 36

    units.push({
      id: `${team}-${i}`,
      team,
      label,
      x: baseX + offsetX + (Math.random() - 0.5) * 10,
      y: baseY + offsetY + (Math.random() - 0.5) * 10,
      moveTargetX: null,
      moveTargetY: null,
      health: team === 'player' ? 100 : 90,
      maxHealth: team === 'player' ? 100 : 90,
      damage: team === 'player' ? 14 : 12,
      range: 155,
      moveSpeed: team === 'player' ? 72 : 64,
      fireCooldown: Math.random() * 0.5,
      fireInterval: 0.55 + Math.random() * 0.25,
      state: 'idle',
      stateTimer: 0,
      facing: team === 'player' ? 0 : Math.PI,
      animFrame: Math.random() * 8,
      shootTargetId: null,
      squadIndex: i,
    })
  }

  return units
}

function createCovers(): BattleCover[] {
  return [
    { x: 320, y: 160, width: 70, height: 44 },
    { x: 480, y: 280, width: 90, height: 50 },
    { x: 620, y: 140, width: 64, height: 40 },
    { x: 400, y: 400, width: 80, height: 48 },
    { x: 700, y: 360, width: 56, height: 56 },
  ]
}

export function getPlayerUnitCount(fleetPower: number): number {
  return Math.min(14, Math.max(5, Math.floor(fleetPower / 7)))
}

export function getEnemyUnitCount(defenseRating: number): number {
  return Math.min(18, Math.max(5, Math.floor(defenseRating / 5)))
}

export function createBattle(
  planetId: string,
  planetName: string,
  enemyColor: string,
  fleetPower: number,
  defenseRating: number
): BattleState {
  const playerCount = getPlayerUnitCount(fleetPower)
  const enemyCount = getEnemyUnitCount(defenseRating)

  const playerUnits = spawnSquad('player', playerCount, 140, FIELD_HEIGHT / 2, 'Legionnaire')
  const enemyUnits = spawnSquad(
    'enemy',
    enemyCount,
    FIELD_WIDTH - 140,
    FIELD_HEIGHT / 2,
    'Defender'
  )

  return {
    active: true,
    planetId,
    planetName,
    enemyColor,
    status: 'active',
    units: [...playerUnits, ...enemyUnits],
    tracers: [],
    covers: createCovers(),
    selectedUnitId: null,
    initialPlayerCount: playerCount,
    elapsed: 0,
    width: FIELD_WIDTH,
    height: FIELD_HEIGHT,
  }
}
