import { DEFAULT_SQUAD_COOLDOWNS } from './abilities'
import { getDeepVoidCombatMult } from '../game/deepVoid'
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
    suppressiveFireTimer: 0,
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

export function getPlayerUnitCount(fleetPower: number, deploymentMult = 1): number {
  const base = Math.min(14, Math.max(5, Math.floor(fleetPower / 7)))
  return Math.min(16, Math.max(4, Math.floor(base * deploymentMult)))
}

export function getEnemyUnitCount(
  defenseRating: number,
  opts?: { isFrontierBoss?: boolean; frontierWave?: number }
): number {
  let count = Math.min(18, Math.max(5, Math.floor(defenseRating / 5)))
  const wave = opts?.frontierWave ?? 0
  if (wave > 0) {
    count = Math.min(22, Math.floor(count * (1 + wave * 0.05)))
  }
  if (opts?.isFrontierBoss) {
    count = Math.min(24, count + 4)
  }
  return count
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
  deploymentMult?: number
  legionDamageMult?: number
  orbitalChronicle?: string
  frontierWave?: number
  isFrontierBoss?: boolean
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
    deploymentMult = 1,
    legionDamageMult = 1,
    orbitalChronicle,
    frontierWave = 0,
    isFrontierBoss = false,
  } = setup
  const biome = BIOMES[planetType]
  const playerCount = getPlayerUnitCount(fleetPower, deploymentMult)
  const enemyCount = getEnemyUnitCount(defenseRating, { frontierWave, isFrontierBoss })
  const deepCombatMult = getDeepVoidCombatMult(frontierWave) * (isFrontierBoss ? 1.12 : 1)
  const basePlayerStats = playerStats(biome, mods)
  const sharedPlayerStats = {
    ...basePlayerStats,
    damage: Math.round(basePlayerStats.damage * legionDamageMult),
  }

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
          health: Math.round(stats.health * deepCombatMult),
          damage: Math.round(stats.damage * deepCombatMult),
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
    hoveredUnitId: null,
    dragSelect: null,
    activeAbility: 'none',
    squadCooldowns: { ...DEFAULT_SQUAD_COOLDOWNS },
    isFrontierBoss,
    initialPlayerCount: playerCount,
    elapsed: 0,
    width: FIELD_WIDTH,
    height: FIELD_HEIGHT,
    orbitalChronicle,
  }
}
