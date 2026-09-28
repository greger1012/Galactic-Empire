import {
  ENEMY_FACTIONS,
  PLANET_TYPE_INFO,
  createEnemyPlanet,
  getPlanetMaxPopulation,
} from './constants'
import { createEvent } from './engine'
import {
  getDeepVoidDefenseMult,
  getDeepVoidPopulationMult,
  getDeepVoidTierLabel,
  getFrontierBossDefenseMult,
} from './deepVoid'
import type { FrontierState, GameEvent, Planet, PlanetType } from './types'

const FRONTIER_PLANET_TYPES: PlanetType[] = [
  'desert',
  'ice',
  'volcanic',
  'gasGiant',
  'oceanic',
  'jungle',
  'habitable',
  'asteroid',
  'barren',
  'toxic',
  'crystalline',
]

const NAME_PREFIXES = [
  'Ash',
  'Cinder',
  'Dusk',
  'Ember',
  'Frost',
  'Glim',
  'Hollow',
  'Iron',
  'Jade',
  'Keth',
  'Lumen',
  'Mire',
  'Nyx',
  'Obsidian',
  'Pale',
  'Quill',
  'Rime',
  'Sable',
  'Thorn',
  'Umber',
  'Vail',
  'Wraith',
  'Xen',
  'Ydris',
  'Zephyr',
]

const NAME_CORES = [
  'Reach',
  'Bastion',
  'Crown',
  'Drift',
  'Fall',
  'Gate',
  'Haven',
  'Mark',
  'Nexus',
  'Oath',
  'Pinnacle',
  'Quarry',
  'Rift',
  'Spire',
  'Terminus',
  'Vale',
  'Ward',
  'Zenith',
]

const EPITHET_TEMPLATES = [
  'Outer Mandate of the {faction}',
  'Void Frontier Claim — Wave {wave}',
  'Uncharted {type} Expanse',
  'Provisional {faction} Dominion',
  'Iron Sun Survey Marker {wave}',
]

export const DEFAULT_FRONTIER: FrontierState = {
  wave: 0,
  sectorSeed: 0x4a7e91,
}

/** Stable 0..1 from a string id (galaxy map layout). */
export function hashPlanetId(id: string): number {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 4294967296
}

/** Percent positions for the stellar cartograph (center = Iron Sun). */
export function getPlanetMapPosition(planet: Planet): { x: number; y: number } {
  const h1 = hashPlanetId(planet.id)
  const h2 = hashPlanetId(`${planet.id}:alt`)
  const angle = h1 * Math.PI * 2

  if (planet.owner === 'player') {
    const radius = 52 + h2 * 22
    return {
      x: 50 + Math.cos(angle) * radius * 0.35,
      y: 50 + Math.sin(angle) * radius * 0.35,
    }
  }

  const waveBoost = (planet.frontierWave ?? 0) * 6
  const radius = 118 + h2 * 55 + waveBoost
  return {
    x: 50 + Math.cos(angle) * radius * 0.35,
    y: 50 + Math.sin(angle) * radius * 0.35,
  }
}

class SeededRng {
  private state: number

  constructor(seed: number) {
    this.state = seed >>> 0 || 1
  }

  next(): number {
    this.state = (Math.imul(this.state, 1664525) + 1013904223) >>> 0
    return this.state / 4294967296
  }

  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)]
  }

  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1))
  }
}

function frontierWaveSeed(sectorSeed: number, wave: number): number {
  return (sectorSeed ^ Math.imul(wave + 1, 0x9e3779b9)) >>> 0
}

function planetsInWave(wave: number): number {
  return 3 + Math.min(wave, 4) + Math.floor(wave / 2)
}

function scalePopulation(base: number, wave: number): number {
  const frontierWave = wave + 1
  const mult = (1 + wave * 0.12) * getDeepVoidPopulationMult(frontierWave)
  return Math.floor(base * mult)
}

const BOSS_FAVORED_TYPES: PlanetType[] = [
  'barren',
  'volcanic',
  'crystalline',
  'toxic',
  'habitable',
]

function applyFrontierScaling(planet: Planet, frontierWave: number, isBoss: boolean): Planet {
  let defenseRating = Math.floor(planet.defenseRating * getDeepVoidDefenseMult(frontierWave))
  if (isBoss) {
    defenseRating = Math.floor(defenseRating * getFrontierBossDefenseMult(frontierWave))
  }
  return {
    ...planet,
    defenseRating: Math.min(120, defenseRating),
    population: isBoss ? Math.floor(planet.population * 1.35) : planet.population,
  }
}

function createProceduralTemplate(
  wave: number,
  index: number,
  rng: SeededRng
): Omit<Planet, 'buildings' | 'defenseRating'> {
  const faction = rng.pick(ENEMY_FACTIONS)
  const type = rng.pick(FRONTIER_PLANET_TYPES)
  const typeInfo = PLANET_TYPE_INFO[type]
  const name = `${rng.pick(NAME_PREFIXES)} ${rng.pick(NAME_CORES)} ${wave + 1}-${index + 1}`
  const epithet = rng
    .pick(EPITHET_TEMPLATES)
    .replace('{faction}', faction.shortName)
    .replace('{wave}', String(wave + 1))
    .replace('{type}', typeInfo.name)

  const baseCap = rng.int(3500, 11000)
  const basePop = rng.int(800, 4500)

  return {
    id: `frontier-${wave + 1}-${index}`,
    name,
    type,
    owner: 'enemy',
    enemyFaction: faction.id,
    population: scalePopulation(basePop, wave),
    maxPopulation: getPlanetMaxPopulation(type, scalePopulation(baseCap, wave)),
    epithet,
    procedural: true,
    frontierWave: wave + 1,
  }
}

function createBossTemplate(
  wave: number,
  rng: SeededRng
): Omit<Planet, 'buildings' | 'defenseRating'> {
  const faction = rng.pick(ENEMY_FACTIONS)
  const type = rng.pick(BOSS_FAVORED_TYPES)
  const frontierWave = wave + 1
  const baseCap = rng.int(6000, 14000)
  const basePop = rng.int(3500, 8000)

  return {
    id: `frontier-${frontierWave}-apex`,
    name: `${faction.shortName} Void Regent`,
    type,
    owner: 'enemy',
    enemyFaction: faction.id,
    population: scalePopulation(basePop, wave),
    maxPopulation: getPlanetMaxPopulation(type, scalePopulation(baseCap, wave)),
    epithet: `Apex Bastion — ${getDeepVoidTierLabel(frontierWave)} · Wave ${frontierWave}`,
    procedural: true,
    frontierWave,
    isFrontierBoss: true,
  }
}

export interface SpawnFrontierResult {
  planets: Planet[]
  frontier: FrontierState
  events: GameEvent[]
}

/** Append the next procedural void frontier when a sector has no contested worlds left. */
export function spawnNextFrontierWave(
  planets: Planet[],
  frontier: FrontierState
): SpawnFrontierResult {
  const nextWave = frontier.wave + 1
  const seed = frontierWaveSeed(frontier.sectorSeed, nextWave)
  const rng = new SeededRng(seed)
  const regularCount = planetsInWave(nextWave) - 1
  const frontierWave = nextWave

  const regulars = Array.from({ length: regularCount }, (_, i) => {
    const raw = createEnemyPlanet(createProceduralTemplate(nextWave - 1, i, rng))
    return applyFrontierScaling(raw, frontierWave, false)
  })

  const bossRaw = createEnemyPlanet(createBossTemplate(nextWave - 1, rng))
  const boss = applyFrontierScaling(bossRaw, frontierWave, true)

  const newEnemies = [...regulars, boss]
  const tierLabel = getDeepVoidTierLabel(frontierWave)

  const events = [
    createEvent(
      'info',
      `Cartographers chart Void Frontier ${nextWave} (${tierLabel}): ${regularCount} mandates and a ${boss.name} apex bastion appear beyond the last iron-sun beacon.`
    ),
  ]

  return {
    planets: [...planets, ...newEnemies],
    frontier: { ...frontier, wave: nextWave },
    events,
  }
}

export function mergeFrontierState(saved: Partial<FrontierState> | undefined): FrontierState {
  return {
    wave: saved?.wave ?? DEFAULT_FRONTIER.wave,
    sectorSeed: saved?.sectorSeed ?? DEFAULT_FRONTIER.sectorSeed,
  }
}
