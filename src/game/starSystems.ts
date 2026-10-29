import { createEvent } from './engine'
import type { GameEvent, Planet, StarSystem } from './types'
import { hashPlanetId } from './frontierGeneration'
import { spawnSystemMandateWorlds } from './systemGeneration'

export const FOUNDING_SYSTEM_ID = 'founding'

/** Galactic arm — systems visible on the stellar chart from game start. */
const GALACTIC_SYSTEM_BLUEPRINTS: Omit<
  StarSystem,
  'charted' | 'frontierWave' | 'sectorSeed'
>[] = [
  {
    id: FOUNDING_SYSTEM_ID,
    name: 'Helios Corridor',
    starLabel: 'Iron Sun',
    galacticX: 50,
    galacticY: 50,
    isFounding: true,
  },
  { id: 'cyan-gate', name: 'Cyan Gate Reach', starLabel: 'Azure Pulsar', galacticX: 28, galacticY: 38, isFounding: false },
  { id: 'sable-rift', name: 'Sable Rift', starLabel: 'Obsidian Crown', galacticX: 72, galacticY: 34, isFounding: false },
  { id: 'lumen-spire', name: 'Lumen Spire', starLabel: 'Radiant Spire', galacticX: 62, galacticY: 68, isFounding: false },
  { id: 'mire-drift', name: 'Mire Drift', starLabel: 'Pale Mire', galacticX: 34, galacticY: 72, isFounding: false },
  { id: 'keth-belt', name: 'Keth Aster Belt', starLabel: 'Keth Binary', galacticX: 18, galacticY: 52, isFounding: false },
  { id: 'nyx-terminus', name: 'Nyx Terminus', starLabel: 'Nyx Ember', galacticX: 82, galacticY: 52, isFounding: false },
  { id: 'iron-halo', name: 'Iron Halo', starLabel: 'Halo Forge', galacticX: 44, galacticY: 22, isFounding: false },
  { id: 'vail-expanse', name: 'Vail Expanse', starLabel: 'Vail Nebula', galacticX: 56, galacticY: 86, isFounding: false },
  { id: 'zenith-crown', name: 'Zenith Crown', starLabel: 'Crown Star', galacticX: 12, galacticY: 28, isFounding: false },
  { id: 'ember-fall', name: 'Ember Fall', starLabel: 'Ember Giant', galacticX: 88, galacticY: 28, isFounding: false },
  { id: 'quill-deep', name: 'Quill Deep', starLabel: 'Deep Quill', galacticX: 8, galacticY: 78, isFounding: false },
]

const ADJACENCY: Record<string, string[]> = {
  [FOUNDING_SYSTEM_ID]: ['cyan-gate', 'sable-rift', 'lumen-spire', 'mire-drift', 'iron-halo'],
  'cyan-gate': [FOUNDING_SYSTEM_ID, 'keth-belt', 'iron-halo', 'zenith-crown'],
  'sable-rift': [FOUNDING_SYSTEM_ID, 'nyx-terminus', 'ember-fall', 'lumen-spire'],
  'lumen-spire': [FOUNDING_SYSTEM_ID, 'sable-rift', 'mire-drift', 'vail-expanse'],
  'mire-drift': [FOUNDING_SYSTEM_ID, 'lumen-spire', 'keth-belt', 'quill-deep', 'vail-expanse'],
  'keth-belt': ['cyan-gate', 'mire-drift', 'zenith-crown', 'quill-deep'],
  'nyx-terminus': ['sable-rift', 'ember-fall'],
  'iron-halo': [FOUNDING_SYSTEM_ID, 'cyan-gate', 'zenith-crown', 'ember-fall'],
  'vail-expanse': ['lumen-spire', 'mire-drift', 'quill-deep'],
  'zenith-crown': ['cyan-gate', 'keth-belt', 'iron-halo'],
  'ember-fall': ['sable-rift', 'nyx-terminus', 'iron-halo'],
  'quill-deep': ['mire-drift', 'keth-belt', 'vail-expanse'],
}

function systemSeed(id: string, base = 0x4a7e91): number {
  let h = base >>> 0
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function createInitialStarSystems(): StarSystem[] {
  return GALACTIC_SYSTEM_BLUEPRINTS.map((blueprint) => ({
    ...blueprint,
    charted: blueprint.id === FOUNDING_SYSTEM_ID,
    frontierWave: 0,
    sectorSeed: systemSeed(blueprint.id),
  }))
}

export function getStarSystem(state: { starSystems: StarSystem[] }, systemId: string): StarSystem | undefined {
  return state.starSystems.find((s) => s.id === systemId)
}

export function planetsInSystem(planets: Planet[], systemId: string): Planet[] {
  return planets.filter((p) => (p.systemId ?? FOUNDING_SYSTEM_ID) === systemId)
}

export function countEnemiesInSystem(planets: Planet[], systemId: string): number {
  return planetsInSystem(planets, systemId).filter((p) => p.owner === 'enemy').length
}

export function getGalacticMapBounds(systems: StarSystem[], padding = 8) {
  let minX = 50
  let maxX = 50
  let minY = 50
  let maxY = 50
  for (const system of systems) {
    minX = Math.min(minX, system.galacticX)
    maxX = Math.max(maxX, system.galacticX)
    minY = Math.min(minY, system.galacticY)
    maxY = Math.max(maxY, system.galacticY)
  }
  minX -= padding
  maxX += padding
  minY -= padding
  maxY += padding
  const scale = 10
  return {
    minX,
    minY,
    widthPx: (maxX - minX) * scale,
    heightPx: (maxY - minY) * scale,
    toLocalX: (x: number) => (x - minX) * scale,
    toLocalY: (y: number) => (y - minY) * scale,
  }
}

export function getSystemGalacticPosition(system: StarSystem, bounds: ReturnType<typeof getGalacticMapBounds>) {
  return {
    x: bounds.toLocalX(system.galacticX),
    y: bounds.toLocalY(system.galacticY),
  }
}

export function getHyperlanePairs(systems: StarSystem[]): [string, string][] {
  const charted = new Set(systems.filter((s) => s.charted).map((s) => s.id))
  const pairs: [string, string][] = []
  const seen = new Set<string>()

  for (const system of systems) {
    if (!charted.has(system.id)) continue
    for (const neighborId of ADJACENCY[system.id] ?? []) {
      if (!charted.has(neighborId)) continue
      const key = [system.id, neighborId].sort().join('|')
      if (seen.has(key)) continue
      seen.add(key)
      pairs.push([system.id, neighborId])
    }
  }
  return pairs
}

export function migratePlanetsWithSystemId(planets: Planet[]): Planet[] {
  return planets.map((p) => ({
    ...p,
    systemId: p.systemId ?? FOUNDING_SYSTEM_ID,
  }))
}

export function migrateStarSystemsForSave(
  savedSystems: StarSystem[] | undefined
): StarSystem[] {
  if (savedSystems && savedSystems.length > 0) return savedSystems
  return createInitialStarSystems()
}

export interface ChartSystemsResult {
  starSystems: StarSystem[]
  planets: Planet[]
  events: GameEvent[]
}

/** When a star system is fully secured, reveal and populate adjacent uncharted systems. */
export function chartAdjacentStarSystems(
  clearedSystemId: string,
  starSystems: StarSystem[],
  planets: Planet[]
): ChartSystemsResult {
  const neighborIds = ADJACENCY[clearedSystemId] ?? []
  let nextSystems = starSystems
  let nextPlanets = planets
  const events: GameEvent[] = []

  for (const neighborId of neighborIds) {
    const neighbor = nextSystems.find((s) => s.id === neighborId)
    if (!neighbor || neighbor.charted) continue

    nextSystems = nextSystems.map((s) =>
      s.id === neighborId ? { ...s, charted: true } : s
    )
    const populated = populateChartedSystem(neighborId, nextSystems, nextPlanets)
    nextPlanets = populated.planets
    events.push(
      createEvent(
        'info',
        `Imperial cartographers fix the ${neighbor.name} (${neighbor.starLabel}) — ${populated.planetCount} contested mandates detected.`
      )
    )
  }

  return { starSystems: nextSystems, planets: nextPlanets, events }
}

/** Initial contested worlds when a new star system is first charted. */
export function populateChartedSystem(
  systemId: string,
  starSystems: StarSystem[],
  planets: Planet[]
): { planets: Planet[]; planetCount: number } {
  if (planetsInSystem(planets, systemId).length > 0) {
    return { planets, planetCount: planetsInSystem(planets, systemId).filter((p) => p.owner === 'enemy').length }
  }

  const system = starSystems.find((s) => s.id === systemId)
  if (!system) return { planets, planetCount: 0 }

  const count = 4 + (hashPlanetId(systemId) * 1000) % 3
  const newEnemies = spawnSystemMandateWorlds(system, count)
  return { planets: [...planets, ...newEnemies], planetCount: newEnemies.length }
}
