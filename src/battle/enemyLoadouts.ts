import { getFactionLore } from '../game/lore'
import type { PlanetType } from '../game/types'
import type { Biome } from './biomes'
import type { HostileArchetype, UnitArchetype } from './types'

export interface HostileArchetypeDef {
  healthMult: number
  damageMult: number
  speedMult: number
  rangeMult: number
  fireIntervalMult: number
}

export const HOSTILE_ARCHETYPE_DEFS: Record<HostileArchetype, HostileArchetypeDef> = {
  line: {
    healthMult: 1,
    damageMult: 1,
    speedMult: 1,
    rangeMult: 1,
    fireIntervalMult: 1,
  },
  heavy: {
    healthMult: 1.38,
    damageMult: 1.22,
    speedMult: 0.86,
    rangeMult: 1.02,
    fireIntervalMult: 1.08,
  },
  skirmisher: {
    healthMult: 0.78,
    damageMult: 0.92,
    speedMult: 1.2,
    rangeMult: 0.9,
    fireIntervalMult: 0.92,
  },
  bulwark: {
    healthMult: 1.58,
    damageMult: 1.08,
    speedMult: 0.7,
    rangeMult: 0.94,
    fireIntervalMult: 1.18,
  },
}

type WeightTable = Record<HostileArchetype, number>

const BASE_PLANET_WEIGHTS: Record<PlanetType, WeightTable> = {
  terran: { line: 0.55, heavy: 0.2, skirmisher: 0.15, bulwark: 0.1 },
  desert: { line: 0.4, heavy: 0.25, skirmisher: 0.25, bulwark: 0.1 },
  ice: { line: 0.45, heavy: 0.3, skirmisher: 0.15, bulwark: 0.1 },
  volcanic: { line: 0.22, heavy: 0.42, skirmisher: 0.16, bulwark: 0.2 },
  gasGiant: { line: 0.38, heavy: 0.42, skirmisher: 0.12, bulwark: 0.08 },
  oceanic: { line: 0.62, heavy: 0.18, skirmisher: 0.2, bulwark: 0 },
  jungle: { line: 0.28, heavy: 0.12, skirmisher: 0.55, bulwark: 0.05 },
  habitable: { line: 0.48, heavy: 0.22, skirmisher: 0.25, bulwark: 0.05 },
  asteroid: { line: 0.35, heavy: 0.28, skirmisher: 0.32, bulwark: 0.05 },
  barren: { line: 0.12, heavy: 0.28, skirmisher: 0.08, bulwark: 0.52 },
  toxic: { line: 0.4, heavy: 0.35, skirmisher: 0.2, bulwark: 0.05 },
  crystalline: { line: 0.38, heavy: 0.32, skirmisher: 0.25, bulwark: 0.05 },
}

const FACTION_WEIGHT_SHIFT: Record<string, Partial<WeightTable>> = {
  kryll: { heavy: 0.12, bulwark: 0.08, skirmisher: -0.1 },
  vexar: { line: 0.1, heavy: 0.05, skirmisher: -0.08 },
  zynthian: { skirmisher: 0.14, line: 0.05, bulwark: -0.08 },
  pirates: { skirmisher: 0.18, heavy: -0.1, bulwark: -0.12 },
}

const FACTION_ARCHETYPE_LABELS: Record<string, Record<HostileArchetype, string>> = {
  kryll: {
    line: 'Clan Militant',
    heavy: 'Forge Warden',
    skirmisher: 'Ash Runner',
    bulwark: 'Slag Anvil',
  },
  vexar: {
    line: 'Synod Acolyte',
    heavy: 'Circuit Penitent',
    skirmisher: 'Null Skiff',
    bulwark: 'Reliquary Guard',
  },
  zynthian: {
    line: 'Concord Lancer',
    heavy: 'Vitae Knight',
    skirmisher: 'Canopy Stalker',
    bulwark: 'Harmony Bulwark',
  },
  pirates: {
    line: 'Reaver Cutthroat',
    heavy: 'Boarding Brute',
    skirmisher: 'Void Runner',
    bulwark: 'Hull Breacher',
  },
}

const DEFAULT_LABELS: Record<HostileArchetype, string> = {
  line: 'Planetary Militia',
  heavy: 'Heavy Infantry',
  skirmisher: 'Light Raider',
  bulwark: 'Bastion Trooper',
}

const ROSTER_NAMES: Record<PlanetType, string> = {
  terran: 'Throne Resistance Cadre',
  desert: 'Salt Pan Garrison',
  ice: 'Permafrost Watch',
  volcanic: 'Forge-Floor Phalanx',
  gasGiant: 'Refinery Security Detail',
  oceanic: 'Platform Defense Corps',
  jungle: 'Understory Ambush Pack',
  habitable: 'Urban Militia Block',
  asteroid: 'Hollow-Rock Militia',
  barren: 'Sentinel Bastion Garrison',
  toxic: 'Chem-Seal Perimeter Guard',
  crystalline: 'Prism Cavern Wardens',
}

function normalizeWeights(weights: WeightTable): WeightTable {
  const clamped: WeightTable = { ...weights }
  for (const key of Object.keys(clamped) as HostileArchetype[]) {
    clamped[key] = Math.max(0, clamped[key])
  }
  const sum = Object.values(clamped).reduce((a, b) => a + b, 0)
  if (sum <= 0) return { line: 1, heavy: 0, skirmisher: 0, bulwark: 0 }
  const out = { ...clamped }
  for (const key of Object.keys(out) as HostileArchetype[]) {
    out[key] /= sum
  }
  return out
}

function blendWeights(planet: WeightTable, factionId?: string): WeightTable {
  const merged = { ...planet }
  const shift = factionId ? FACTION_WEIGHT_SHIFT[factionId] : undefined
  if (shift) {
    for (const [key, delta] of Object.entries(shift) as [HostileArchetype, number][]) {
      merged[key] = (merged[key] ?? 0) + delta
    }
  }
  return normalizeWeights(merged)
}

function pickArchetype(weights: WeightTable, roll: number): HostileArchetype {
  let acc = 0
  const order: HostileArchetype[] = ['bulwark', 'heavy', 'skirmisher', 'line']
  for (const key of order) {
    acc += weights[key]
    if (roll <= acc) return key
  }
  return 'line'
}

/** Deterministic rolls from planet + slot so the same world always fields the same mix. */
function slotRoll(planetId: string, index: number): number {
  let h = 2166136261 ^ (index * 374761393)
  for (let i = 0; i < planetId.length; i++) {
    h ^= planetId.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 10000) / 10000
}

export function getHostileLabel(archetype: HostileArchetype, factionId?: string): string {
  if (factionId && FACTION_ARCHETYPE_LABELS[factionId]) {
    return FACTION_ARCHETYPE_LABELS[factionId][archetype]
  }
  return DEFAULT_LABELS[archetype]
}

export function getHostileRosterName(planetType: PlanetType, factionId?: string): string {
  const faction = factionId ? getFactionLore(factionId) : undefined
  const base = ROSTER_NAMES[planetType]
  return faction ? `${faction.shortName} ${base}` : base
}

export function toUnitArchetype(hostile: HostileArchetype): UnitArchetype {
  switch (hostile) {
    case 'heavy':
      return 'hostileHeavy'
    case 'skirmisher':
      return 'hostileSkirmisher'
    case 'bulwark':
      return 'hostileBulwark'
    default:
      return 'hostileLine'
  }
}

export interface HostileSlot {
  archetype: HostileArchetype
  unitArchetype: UnitArchetype
  label: string
}

export function buildHostileSlots(
  count: number,
  planetId: string,
  planetType: PlanetType,
  factionId?: string
): HostileSlot[] {
  const weights = blendWeights(BASE_PLANET_WEIGHTS[planetType], factionId)
  const slots: HostileSlot[] = []

  for (let i = 0; i < count; i++) {
    const archetype = pickArchetype(weights, slotRoll(planetId, i))
    slots.push({
      archetype,
      unitArchetype: toUnitArchetype(archetype),
      label: getHostileLabel(archetype, factionId),
    })
  }

  return slots
}

export interface HostileStatBlock {
  health: number
  damage: number
  moveSpeed: number
  range: number
  fireInterval: number
}

export function resolveHostileStats(
  slot: HostileSlot,
  biome: Biome,
  factionId?: string
): HostileStatBlock {
  const def = HOSTILE_ARCHETYPE_DEFS[slot.archetype]
  const baseHealth = 90
  const baseDamage = 12
  const baseSpeed = 64 * biome.moveSpeedMult
  const baseRange = 155 * biome.rangeMult
  const baseInterval = 0.65

  let damageMult = def.damageMult
  let rangeMult = def.rangeMult
  if (factionId === 'kryll') damageMult *= 1.08
  if (factionId === 'vexar') rangeMult *= 1.06
  if (factionId === 'pirates') damageMult *= 1.05

  return {
    health: Math.round(baseHealth * def.healthMult),
    damage: Math.round(baseDamage * damageMult),
    moveSpeed: baseSpeed * def.speedMult,
    range: baseRange * rangeMult,
    fireInterval: baseInterval * def.fireIntervalMult,
  }
}
