import type { TechModifiers } from '../game/research'
import type { PlanetType } from '../game/types'
import { BIOMES, generateBiomeCovers, type Biome } from './biomes'
import type { BattleState, BattleUnit } from './types'

const FIELD_WIDTH = 960
const FIELD_HEIGHT = 540

interface UnitStats {
  health: number
  damage: number
  moveSpeed: number
  range: number
}

function createUnit(
  team: 'player' | 'enemy',
  index: number,
  x: number,
  y: number,
  label: string,
  stats: UnitStats
): BattleUnit {
  return {
    id: `${team}-${index}`,
    team,
    label,
    x,
    y,
    moveTargetX: null,
    moveTargetY: null,
    health: stats.health,
    maxHealth: stats.health,
    damage: stats.damage,
    range: stats.range,
    moveSpeed: stats.moveSpeed,
    fireCooldown: Math.random() * 0.5,
    fireInterval: 0.55 + Math.random() * 0.25,
    state: 'idle',
    stateTimer: 0,
    facing: team === 'player' ? 0 : Math.PI,
    animFrame: Math.random() * 8,
    shootTargetId: null,
    squadIndex: index,
    holdPosition: false,
    suppressedTimer: 0,
    grenadeCooldown: 0,
    coverLevel: 'none',
    pendingGrenade: null,
  }
}

function spawnSquad(
  team: 'player' | 'enemy',
  count: number,
  baseX: number,
  baseY: number,
  label: string,
  stats: UnitStats
): BattleUnit[] {
  const units: BattleUnit[] = []
  const cols = Math.ceil(Math.sqrt(count))

  for (let i = 0; i < count; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)
    const offsetX = (col - (cols - 1) / 2) * 36
    const offsetY = (row - Math.floor(count / cols) / 2) * 36
    units.push(
      createUnit(
        team,
        i,
        baseX + offsetX + (Math.random() - 0.5) * 10,
        baseY + offsetY + (Math.random() - 0.5) * 10,
        label,
        stats
      )
    )
  }

  return units
}

export function getPlayerUnitCount(fleetPower: number): number {
  return Math.min(14, Math.max(5, Math.floor(fleetPower / 7)))
}

export function getEnemyUnitCount(defenseRating: number): number {
  return Math.min(18, Math.max(5, Math.floor(defenseRating / 5)))
}

function playerStats(biome: Biome, mods: TechModifiers): UnitStats {
  return {
    health: 100 + mods.legionHealthBonus,
    damage: Math.round(14 * mods.legionDamageMult),
    moveSpeed: 72 * biome.moveSpeedMult * mods.legionSpeedMult,
    range: 155 * biome.rangeMult,
  }
}

function enemyStats(biome: Biome): UnitStats {
  return {
    health: 90,
    damage: 12,
    moveSpeed: 64 * biome.moveSpeedMult,
    range: 155 * biome.rangeMult,
  }
}

export interface BattleSetup {
  planetId: string
  planetName: string
  planetType: PlanetType
  enemyColor: string
  fleetPower: number
  defenseRating: number
  mods: TechModifiers
}

export function createBattle(setup: BattleSetup): BattleState {
  const { planetId, planetName, planetType, enemyColor, fleetPower, defenseRating, mods } = setup
  const biome = BIOMES[planetType]
  const playerCount = getPlayerUnitCount(fleetPower)
  const enemyCount = getEnemyUnitCount(defenseRating)

  const playerUnits = spawnSquad(
    'player',
    playerCount,
    140,
    FIELD_HEIGHT / 2,
    'Legionnaire',
    playerStats(biome, mods)
  )
  const enemyUnits = spawnSquad(
    'enemy',
    enemyCount,
    FIELD_WIDTH - 140,
    FIELD_HEIGHT / 2,
    'Defender',
    enemyStats(biome)
  )

  return {
    active: true,
    planetId,
    planetName,
    planetType,
    enemyColor,
    playerSuppressionMult: mods.suppressionMult,
    status: 'active',
    paused: false,
    units: [...playerUnits, ...enemyUnits],
    tracers: [],
    explosions: [],
    covers: generateBiomeCovers(biome, planetId, FIELD_WIDTH, FIELD_HEIGHT),
    selectedUnitIds: [],
    dragSelect: null,
    activeAbility: 'none',
    initialPlayerCount: playerCount,
    elapsed: 0,
    width: FIELD_WIDTH,
    height: FIELD_HEIGHT,
  }
}
