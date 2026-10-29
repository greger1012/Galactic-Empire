export type TechBranch = 'economy' | 'military' | 'science'

export type TechId =
  | 'deepStrata'
  | 'luminFocusing'
  | 'vitaeGenomics'
  | 'mercantileCharter'
  | 'modularForges'
  | 'lanceCalibration'
  | 'voidDrydocks'
  | 'aegisHardening'
  | 'legionPlate'
  | 'pulseRifles'
  | 'kineticActuators'
  | 'noosphericUplink'
  | 'gravWells'

export interface Tech {
  id: TechId
  name: string
  branch: TechBranch
  tier: number
  cost: number
  requires: TechId[]
  description: string
  effect: string
  icon: string
}

export const TECH_BRANCH_LABELS: Record<TechBranch, { label: string; color: string }> = {
  economy: { label: 'Industry & Commerce', color: '#d4a843' },
  military: { label: 'Void & Legion Warfare', color: '#c44b4b' },
  science: { label: 'Noospheric Sciences', color: '#6ec4d8' },
}

export const TECHS: Record<TechId, Tech> = {
  deepStrata: {
    id: 'deepStrata',
    name: 'Deep Strata Boring',
    branch: 'economy',
    tier: 1,
    cost: 40,
    requires: [],
    description: 'Phase-drill arrays reach mantle-depth adamant seams.',
    effect: '+20% adamant output',
    icon: '⛏️',
  },
  luminFocusing: {
    id: 'luminFocusing',
    name: 'Lumin Focusing Lattices',
    branch: 'economy',
    tier: 1,
    cost: 40,
    requires: [],
    description: 'Crystalline lattices concentrate stellar collection efficiency.',
    effect: '+20% lumin output',
    icon: '☀️',
  },
  vitaeGenomics: {
    id: 'vitaeGenomics',
    name: 'Vitae Genomics',
    branch: 'economy',
    tier: 2,
    cost: 80,
    requires: ['luminFocusing'],
    description: 'Gene-tailored biomass thrives in hostile atmospheres.',
    effect: '+25% sustenance output',
    icon: '🧬',
  },
  mercantileCharter: {
    id: 'mercantileCharter',
    name: 'Mercantile Charter',
    branch: 'economy',
    tier: 2,
    cost: 90,
    requires: ['deepStrata'],
    description: 'Throne-sanctioned trade guilds open new void routes.',
    effect: '+30% sovereign mark income',
    icon: '⚜️',
  },
  modularForges: {
    id: 'modularForges',
    name: 'Modular Forge Design',
    branch: 'economy',
    tier: 3,
    cost: 150,
    requires: ['mercantileCharter', 'vitaeGenomics'],
    description: 'Standardised components slash construction overhead.',
    effect: '-15% building costs',
    icon: '🏗️',
  },

  lanceCalibration: {
    id: 'lanceCalibration',
    name: 'Lance Calibration',
    branch: 'military',
    tier: 1,
    cost: 50,
    requires: [],
    description: 'Refined targeting cogitators for capital lance batteries.',
    effect: '+15% armada strength',
    icon: '🎯',
  },
  legionPlate: {
    id: 'legionPlate',
    name: 'Composite Legion Plate',
    branch: 'military',
    tier: 1,
    cost: 50,
    requires: [],
    description: 'Layered ceramite-adamant plate for ground legions.',
    effect: '+25 legionnaire health',
    icon: '🛡️',
  },
  voidDrydocks: {
    id: 'voidDrydocks',
    name: 'Automated Void Drydocks',
    branch: 'military',
    tier: 2,
    cost: 100,
    requires: ['lanceCalibration'],
    description: 'Servitor-crewed assembly rings accelerate ship commissioning.',
    effect: '-15% voidship costs',
    icon: '🚀',
  },
  pulseRifles: {
    id: 'pulseRifles',
    name: 'Pulse Rifle Pattern',
    branch: 'military',
    tier: 2,
    cost: 100,
    requires: ['legionPlate'],
    description: 'Compact lumin-pulse weaponry replaces kinetic small arms.',
    effect: '+20% legionnaire damage',
    icon: '🔫',
  },
  aegisHardening: {
    id: 'aegisHardening',
    name: 'Aegis Field Hardening',
    branch: 'military',
    tier: 3,
    cost: 160,
    requires: ['voidDrydocks', 'pulseRifles'],
    description: 'Overlapping hard-light barriers shrug off orbital assault.',
    effect: '+20% planetary defense',
    icon: '🔰',
  },

  noosphericUplink: {
    id: 'noosphericUplink',
    name: 'Noospheric Uplink',
    branch: 'science',
    tier: 1,
    cost: 60,
    requires: [],
    description: 'Direct cogitator linkage between throne nodes and the Noosphere.',
    effect: '+50% research rate',
    icon: '🧠',
  },
  kineticActuators: {
    id: 'kineticActuators',
    name: 'Kinetic Actuator Suites',
    branch: 'science',
    tier: 2,
    cost: 110,
    requires: ['noosphericUplink'],
    description: 'Servo-assisted legion armour with reflex dampening.',
    effect: '+15% legion speed, half suppression duration',
    icon: '⚙️',
  },
  gravWells: {
    id: 'gravWells',
    name: 'Gravitic Well Anchors',
    branch: 'science',
    tier: 3,
    cost: 180,
    requires: ['kineticActuators'],
    description: 'Stabilised gravity wells expand habitable planetary zones.',
    effect: '+25% population capacity on all worlds',
    icon: '🌐',
  },
}

export const TECH_LIST: Tech[] = Object.values(TECHS)

export interface TechModifiers {
  mineralMult: number
  energyMult: number
  foodMult: number
  creditMult: number
  buildingCostMult: number
  shipCostMult: number
  fleetPowerMult: number
  defenseMult: number
  researchMult: number
  populationCapMult: number
  legionHealthBonus: number
  legionDamageMult: number
  legionSpeedMult: number
  suppressionMult: number
}

const BASE_MODIFIERS: TechModifiers = {
  mineralMult: 1,
  energyMult: 1,
  foodMult: 1,
  creditMult: 1,
  buildingCostMult: 1,
  shipCostMult: 1,
  fleetPowerMult: 1,
  defenseMult: 1,
  researchMult: 1,
  populationCapMult: 1,
  legionHealthBonus: 0,
  legionDamageMult: 1,
  legionSpeedMult: 1,
  suppressionMult: 1,
}

export function getTechModifiers(researched: readonly string[]): TechModifiers {
  const m = { ...BASE_MODIFIERS }
  const has = (id: TechId) => researched.includes(id)

  if (has('deepStrata')) m.mineralMult *= 1.2
  if (has('luminFocusing')) m.energyMult *= 1.2
  if (has('vitaeGenomics')) m.foodMult *= 1.25
  if (has('mercantileCharter')) m.creditMult *= 1.3
  if (has('modularForges')) m.buildingCostMult *= 0.85
  if (has('lanceCalibration')) m.fleetPowerMult *= 1.15
  if (has('voidDrydocks')) m.shipCostMult *= 0.85
  if (has('aegisHardening')) m.defenseMult *= 1.2
  if (has('legionPlate')) m.legionHealthBonus += 25
  if (has('pulseRifles')) m.legionDamageMult *= 1.2
  if (has('kineticActuators')) {
    m.legionSpeedMult *= 1.15
    m.suppressionMult *= 0.5
  }
  if (has('noosphericUplink')) m.researchMult *= 1.5
  if (has('gravWells')) m.populationCapMult *= 1.25

  return m
}

export function canResearch(tech: Tech, researched: readonly string[]): boolean {
  if (researched.includes(tech.id)) return false
  return tech.requires.every((r) => researched.includes(r))
}

/** Research points generated per cycle from Noospheric Throne Nodes. */
export function calculateResearchRate(throneNodeLevels: number, mods: TechModifiers): number {
  return (0.5 + throneNodeLevels * 0.6) * mods.researchMult
}
