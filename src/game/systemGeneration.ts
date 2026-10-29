import {
  ENEMY_FACTIONS,
  createEnemyPlanet,
  getPlanetMaxPopulation,
} from './constants'
import type { Planet, PlanetType, StarSystem } from './types'
import { hashPlanetId } from './frontierGeneration'

const MANDATE_TYPES: PlanetType[] = [
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

const PREFIXES = ['Ash', 'Cinder', 'Dusk', 'Ember', 'Frost', 'Iron', 'Jade', 'Keth', 'Nyx', 'Pale', 'Rime', 'Sable']
const CORES = ['Reach', 'Bastion', 'Drift', 'Gate', 'Haven', 'Mark', 'Nexus', 'Rift', 'Spire', 'Terminus', 'Vale']

/** Contested worlds when an outer star system is first charted. */
export function spawnSystemMandateWorlds(system: StarSystem, count: number): Planet[] {
  const rng = new SeededRng(system.sectorSeed ^ 0x51c419)
  const worlds: Planet[] = []

  for (let i = 0; i < count; i++) {
    const faction = rng.pick(ENEMY_FACTIONS)
    const type = rng.pick(MANDATE_TYPES)
    const name = `${rng.pick(PREFIXES)} ${rng.pick(CORES)}`
    const id = `${system.id}-mandate-${i + 1}`

    const raw = createEnemyPlanet({
      id,
      name,
      type,
      owner: 'enemy',
      enemyFaction: faction.id,
      population: rng.int(900, 3200),
      maxPopulation: getPlanetMaxPopulation(type, rng.int(4000, 9000)),
      systemId: system.id,
      epithet: `${system.name} — ${faction.shortName} mandate`,
      procedural: true,
    })

    const defenseBoost = 1 + hashPlanetId(id) * 0.25
    worlds.push({
      ...raw,
      defenseRating: Math.min(95, Math.floor(raw.defenseRating * defenseBoost)),
    })
  }

  return worlds
}
