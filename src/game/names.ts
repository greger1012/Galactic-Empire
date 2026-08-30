import type { BuildingType, ShipType } from './types'

/** Golden-age archaeotech building names and flavor text. */
export const BUILDING_LORE: Record<
  BuildingType,
  { name: string; description: string; icon: string }
> = {
  extractionHub: {
    name: 'Stratum Excavator',
    description: 'Phase-drills bore into planetary mantles to extract adamant ore.',
    icon: '⛏️',
  },
  solarArray: {
    name: 'Helios Collector Array',
    description: 'Stellar vanes capture voltaic lumin from the local star.',
    icon: '☀️',
  },
  hydroponics: {
    name: 'Vitae Synthesis Dome',
    description: 'Gene-crafted biomass vats sustain void-populations indefinitely.',
    icon: '🌱',
  },
  shipyard: {
    name: 'Void Forge Annexe',
    description: 'Orbital drydocks where warships are ritually awakened and armed.',
    icon: '🚀',
  },
  shieldGenerator: {
    name: 'Aegis Pylon Network',
    description: 'Hard-light barriers deflect orbital bombardment and invasion craft.',
    icon: '🛡️',
  },
  commandCenter: {
    name: 'Noospheric Throne Node',
    description: 'Cogitator hub linking planetary governance to the imperial mandate.',
    icon: '🏛️',
  },
}

/** Void warship classifications of the Ascendancy fleet. */
export const SHIP_LORE: Record<
  ShipType,
  { name: string; description: string; icon: string }
> = {
  scout: {
    name: 'Spectre Corvette',
    description: 'Swift augury-vessel for void reconnaissance and picket duty.',
    icon: '🔭',
  },
  frigate: {
    name: 'Lance Frigate',
    description: 'Workhorse warship of the mandate fleets — balanced and relentless.',
    icon: '⚔️',
  },
  destroyer: {
    name: 'Obelisk Destroyer',
    description: 'Heavy line-ship mounting archaeotech lance batteries.',
    icon: '💥',
  },
  carrier: {
    name: 'Sovereign Carrier',
    description: 'Capital void-cathedral commanding legion drops and fleet actions.',
    icon: '🛸',
  },
}

/** Renamed contested worlds with golden-age flavor. */
export const PLANET_LORE_NAMES: Record<string, { name: string; epithet?: string }> = {
  'terra-prime': { name: 'Helios Prime', epithet: 'Cradle of the Second Dawn' },
  'kryll-prime': { name: 'Forge Pyros', epithet: 'Heart of the Kryll Anvil' },
  'vexar-nexus': { name: 'Synod Nexus', epithet: 'Circuit-Cathedral of Vexar' },
  zynthia: { name: 'Concordia', epithet: 'Jewel of the Zynthian Concord' },
  'azure-depths': { name: 'Mare Profundum', epithet: 'Azure Vitae Gardens' },
  'pirate-haven': { name: 'Scrap Sovereign', epithet: 'Reaver Anchorage' },
  'kryll-outpost': { name: 'Anvil Rock', epithet: 'Kryll Mining Claim' },
  'sentinel-drift': { name: 'Sentinel Drift', epithet: 'Chokepoint of the Void Roads' },
  'vexar-shard': { name: 'Prism Shard', epithet: 'Crystalline Vexar Sanctum' },
  'toxica-iv': { name: 'Venenum IV', epithet: 'Sealed Chem-Habs of the Kryll' },
}

export function getPlanetDisplayName(planetId: string, fallback: string): string {
  return PLANET_LORE_NAMES[planetId]?.name ?? fallback
}

export function getPlanetEpithet(planetId: string): string | undefined {
  return PLANET_LORE_NAMES[planetId]?.epithet
}
