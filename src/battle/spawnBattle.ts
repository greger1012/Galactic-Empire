import type { TechModifiers } from '../game/research'
import type { PlanetType } from '../game/types'
import { BIOMES, generateBiomeCovers, type Biome } from './biomes'
import {
  buildHostileSlots,
  getHostileRosterName,
  resolveHostileStats,
  type HostileSlot,
} from './enemyLoadouts'
import type { BattleState, BattleUnit, UnitArchetype } from './types'

const FIELD_WIDTH = 960
const FIELD_HEIGHT = 540

interface UnitStats {
  health: number
  damage: number
  moveSpeed: number
  range: number
  fireInterval?: number
}

function createUnit(
  team: 'player' | 'enemy',
  index: number,
  x: number,
  y: number,
  label: string,
  archetype: UnitArchetype,
  stats: UnitStats,
  factionId?: string
): BattleUnit {
  const baseInterval = stats.fireInterval ?? 0.55 + Math.random() * 0.25
  return {
    id: `${team}-${index}`,
    team,
    archetype,
    factionId,
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
    fireInterval: baseInterval,
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
  makeUnit: (index: number) => {
    label: string
    archetype: UnitArchetype
    stats: UnitStats
    factionId?: string
  }
): BattleUnit[] {
  const units: BattleUnit[] = []
  const cols = Math.ceil(Math.sqrt(count))

  for (let i = 0; i < count; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)
    const offsetX = (col - (cols - 1) / 2) * 36
    const offsetY = (row - Math.floor(count / cols) / 2) * 36
    const spec = makeUnit(i)
    units.push(
      createUnit(
        team,
        i,
        baseX + offsetX + (Math.random() - 0.5) * 10,
        baseY + offsetY + (Math.random() - 0.5) * 10,
        spec.label,
        spec.archetype,
        spec.stats,
        spec.factionId
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

export interface BattleSetup {
  planetId: string
  planetName: string
  planetType: PlanetType
  enemyFactionId?: string
  enemyColor: string
  fleetPower: number
  defenseRating: number
  mods: TechModifiers
}

export function createBattle(setup: BattleSetup): BattleState {
  const {
    planetId,
    planetName,
    planetType,
    enemyFactionId,
    enemyColor,
    fleetPower,
    defenseRating,
    mods,
  } = setup
  const biome = BIOMES[planetType]
  const playerCount = getPlayerUnitCount(fleetPower)
  const enemyCount = getEnemyUnitCount(defenseRating)
  const sharedPlayerStats = playerStats(biome, mods)

  const hostileSlots = buildHostileSlots(enemyCount, planetId, planetType, enemyFactionId)

  const playerUnits = spawnSquad('player', playerCount, 140, FIELD_HEIGHT / 2, (i) => ({
    label: i % 3 === 0 ? 'Veteran Legionnaire' : 'Legionnaire',
    archetype: i % 3 === 0 ? 'legionVeteran' : 'legionLine',
    stats: sharedPlayerStats,
  }))

  const enemyUnits = spawnSquad(
    'enemy',
    enemyCount,
    FIELD_WIDTH - 140,
    FIELD_HEIGHT / 2,
    (i) => {
      const slot: HostileSlot = hostileSlots[i]
      const stats = resolveHostileStats(slot, biome, enemyFactionId)
      return {
        label: slot.label,
        archetype: slot.unitArchetype,
        stats: {
          health: stats.health,
          damage: stats.damage,
          moveSpeed: stats.moveSpeed,
          range: stats.range,
          fireInterval: stats.fireInterval,
        },
        factionId: enemyFactionId,
      }
    }
  )

  return {
    active: true,
    planetId,
    planetName,
    planetType,
    enemyFactionId,
    hostileRosterName: getHostileRosterName(planetType, enemyFactionId),
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
