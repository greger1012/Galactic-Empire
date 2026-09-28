import type {
  BuildingType,
  EnemyFaction,
  Planet,
  PlanetType,
  PlanetTypeInfo,
  Resources,
  ShipType,
} from './types'
import { FACTION_LORE } from './lore'
import { BUILDING_LORE, PLANET_LORE_NAMES, SHIP_LORE } from './names'

export const TICK_INTERVAL_MS = 1000

export const BUILDING_INFO: Record<
  BuildingType,
  {
    name: string
    description: string
    icon: string
    baseCost: Resources
    costMultiplier: number
    produces?: Partial<Resources>
    consumes?: Partial<Resources>
    defenseBonus: number
    maxLevel: number
  }
> = {
  extractionHub: {
    name: BUILDING_LORE.extractionHub.name,
    description: BUILDING_LORE.extractionHub.description,
    icon: BUILDING_LORE.extractionHub.icon,
    baseCost: { minerals: 50, energy: 20, food: 0, credits: 0 },
    costMultiplier: 1.6,
    produces: { minerals: 3 },
    consumes: { energy: 1 },
    defenseBonus: 0,
    maxLevel: 10,
  },
  solarArray: {
    name: BUILDING_LORE.solarArray.name,
    description: BUILDING_LORE.solarArray.description,
    icon: BUILDING_LORE.solarArray.icon,
    baseCost: { minerals: 40, energy: 0, food: 0, credits: 0 },
    costMultiplier: 1.5,
    produces: { energy: 4 },
    defenseBonus: 0,
    maxLevel: 10,
  },
  hydroponics: {
    name: BUILDING_LORE.hydroponics.name,
    description: BUILDING_LORE.hydroponics.description,
    icon: BUILDING_LORE.hydroponics.icon,
    baseCost: { minerals: 30, energy: 15, food: 0, credits: 0 },
    costMultiplier: 1.5,
    produces: { food: 3 },
    consumes: { energy: 1 },
    defenseBonus: 0,
    maxLevel: 10,
  },
  shipyard: {
    name: BUILDING_LORE.shipyard.name,
    description: BUILDING_LORE.shipyard.description,
    icon: BUILDING_LORE.shipyard.icon,
    baseCost: { minerals: 100, energy: 50, food: 0, credits: 25 },
    costMultiplier: 1.8,
    consumes: { energy: 2 },
    defenseBonus: 5,
    maxLevel: 5,
  },
  shieldGenerator: {
    name: BUILDING_LORE.shieldGenerator.name,
    description: BUILDING_LORE.shieldGenerator.description,
    icon: BUILDING_LORE.shieldGenerator.icon,
    baseCost: { minerals: 80, energy: 40, food: 0, credits: 10 },
    costMultiplier: 1.7,
    consumes: { energy: 2 },
    defenseBonus: 25,
    maxLevel: 8,
  },
  commandCenter: {
    name: BUILDING_LORE.commandCenter.name,
    description: BUILDING_LORE.commandCenter.description,
    icon: BUILDING_LORE.commandCenter.icon,
    baseCost: { minerals: 150, energy: 60, food: 30, credits: 0 },
    costMultiplier: 2.0,
    produces: { credits: 1 },
    consumes: { energy: 1 },
    defenseBonus: 10,
    maxLevel: 5,
  },
}

export const SHIP_INFO: Record<
  ShipType,
  {
    name: string
    description: string
    icon: string
    cost: Resources
    attackPower: number
    buildTime: number
  }
> = {
  scout: {
    name: SHIP_LORE.scout.name,
    description: SHIP_LORE.scout.description,
    icon: SHIP_LORE.scout.icon,
    cost: { minerals: 25, energy: 10, food: 0, credits: 5 },
    attackPower: 5,
    buildTime: 1,
  },
  frigate: {
    name: SHIP_LORE.frigate.name,
    description: SHIP_LORE.frigate.description,
    icon: SHIP_LORE.frigate.icon,
    cost: { minerals: 60, energy: 30, food: 0, credits: 15 },
    attackPower: 15,
    buildTime: 2,
  },
  destroyer: {
    name: SHIP_LORE.destroyer.name,
    description: SHIP_LORE.destroyer.description,
    icon: SHIP_LORE.destroyer.icon,
    cost: { minerals: 150, energy: 80, food: 0, credits: 40 },
    attackPower: 40,
    buildTime: 4,
  },
  carrier: {
    name: SHIP_LORE.carrier.name,
    description: SHIP_LORE.carrier.description,
    icon: SHIP_LORE.carrier.icon,
    cost: { minerals: 400, energy: 200, food: 0, credits: 100 },
    attackPower: 80,
    buildTime: 8,
  },
}

export const PLANET_SPECIALIZATION_LABELS: Record<
  PlanetTypeInfo['specialization'],
  { label: string; color: string }
> = {
  balanced: { label: 'Throne World', color: '#c9a227' },
  farming: { label: 'Vitae Belt', color: '#5a9e6f' },
  civilization: { label: 'Megacity', color: '#6ec4d8' },
  mining: { label: 'Stratum Rich', color: '#d4a843' },
  industrial: { label: 'Forge Orbit', color: '#9b7ec8' },
  strategic: { label: 'Void Chokepoint', color: '#c44b4b' },
}

export const ENEMY_FACTIONS: EnemyFaction[] = FACTION_LORE

export const PLANET_TYPE_INFO: Record<PlanetType, PlanetTypeInfo> = {
  terran: {
    name: 'Terran',
    icon: '🌍',
    description: 'A throne-world of the Golden Age — balanced strata, lumin, and vitae in sacred proportion.',
    specialization: 'balanced',
    mineralBonus: 1.0,
    energyBonus: 1.0,
    foodBonus: 1.2,
    creditBonus: 1.0,
    survivability: 1.0,
    populationCapMultiplier: 1.0,
    strategicBonus: 0,
    baseDefenseBonus: 0,
  },
  desert: {
    name: 'Desert',
    icon: '🏜️',
    description: 'Arid wastes rich in exposed mineral deposits, but harsh on settlers.',
    specialization: 'mining',
    mineralBonus: 1.35,
    energyBonus: 1.25,
    foodBonus: 0.65,
    creditBonus: 0.9,
    survivability: 0.72,
    populationCapMultiplier: 0.75,
    strategicBonus: 0,
    baseDefenseBonus: 2,
  },
  ice: {
    name: 'Ice',
    icon: '❄️',
    description: 'Frozen tundra suited to greenhouse farming, with modest ore beneath the permafrost.',
    specialization: 'farming',
    mineralBonus: 0.75,
    energyBonus: 0.85,
    foodBonus: 1.15,
    creditBonus: 0.85,
    survivability: 0.58,
    populationCapMultiplier: 0.65,
    strategicBonus: 0,
    baseDefenseBonus: 5,
  },
  volcanic: {
    name: 'Volcanic',
    icon: '🌋',
    description: 'Magma-scarred surface with exceptional geothermal energy and rare earth metals.',
    specialization: 'mining',
    mineralBonus: 1.55,
    energyBonus: 1.45,
    foodBonus: 0.45,
    creditBonus: 0.75,
    survivability: 0.48,
    populationCapMultiplier: 0.55,
    strategicBonus: 0,
    baseDefenseBonus: 8,
  },
  gasGiant: {
    name: 'Gas Giant',
    icon: '🪐',
    description: 'Massive atmosphere ideal for fuel harvesting and orbital industry.',
    specialization: 'industrial',
    mineralBonus: 0.55,
    energyBonus: 1.85,
    foodBonus: 0.25,
    creditBonus: 1.15,
    survivability: 0.38,
    populationCapMultiplier: 0.45,
    strategicBonus: 0,
    baseDefenseBonus: 3,
  },
  oceanic: {
    name: 'Oceanic',
    icon: '🌊',
    description: 'World-spanning seas teeming with aquaculture potential and mild climates.',
    specialization: 'farming',
    mineralBonus: 0.65,
    energyBonus: 0.9,
    foodBonus: 1.65,
    creditBonus: 0.95,
    survivability: 0.92,
    populationCapMultiplier: 1.25,
    strategicBonus: 0,
    baseDefenseBonus: 0,
  },
  jungle: {
    name: 'Jungle',
    icon: '🌴',
    description: 'Lush biosphere supporting dense populations and abundant harvests.',
    specialization: 'farming',
    mineralBonus: 0.85,
    energyBonus: 0.95,
    foodBonus: 1.45,
    creditBonus: 1.05,
    survivability: 0.88,
    populationCapMultiplier: 1.35,
    strategicBonus: 0,
    baseDefenseBonus: 4,
  },
  habitable: {
    name: 'Habitable',
    icon: '🏙️',
    description: 'Prime colony world with vast cities, trade hubs, and soaring population limits.',
    specialization: 'civilization',
    mineralBonus: 0.8,
    energyBonus: 1.0,
    foodBonus: 1.05,
    creditBonus: 1.35,
    survivability: 1.0,
    populationCapMultiplier: 1.85,
    strategicBonus: 0,
    baseDefenseBonus: 6,
  },
  asteroid: {
    name: 'Asteroid',
    icon: '☄️',
    description: 'A hollowed rock rich in ore. Few can live here, but miners extract fortunes.',
    specialization: 'mining',
    mineralBonus: 2.0,
    energyBonus: 0.65,
    foodBonus: 0.15,
    creditBonus: 0.55,
    survivability: 0.22,
    populationCapMultiplier: 0.18,
    strategicBonus: 6,
    baseDefenseBonus: 12,
  },
  barren: {
    name: 'Barren',
    icon: '🌑',
    description: 'A dead world with almost no resources — but control of it dominates nearby trade lanes.',
    specialization: 'strategic',
    mineralBonus: 0.35,
    energyBonus: 0.55,
    foodBonus: 0.08,
    creditBonus: 0.45,
    survivability: 0.12,
    populationCapMultiplier: 0.12,
    strategicBonus: 28,
    baseDefenseBonus: 18,
  },
  toxic: {
    name: 'Toxic',
    icon: '☠️',
    description: 'Poisonous atmosphere hides valuable chemical deposits. Colonies require sealed habitats.',
    specialization: 'mining',
    mineralBonus: 1.25,
    energyBonus: 1.05,
    foodBonus: 0.25,
    creditBonus: 0.85,
    survivability: 0.32,
    populationCapMultiplier: 0.35,
    strategicBonus: 4,
    baseDefenseBonus: 10,
  },
  crystalline: {
    name: 'Crystalline',
    icon: '💎',
    description: 'Radiant crystal formations yield exotic minerals prized across the galaxy.',
    specialization: 'mining',
    mineralBonus: 1.75,
    energyBonus: 1.15,
    foodBonus: 0.18,
    creditBonus: 1.2,
    survivability: 0.42,
    populationCapMultiplier: 0.3,
    strategicBonus: 8,
    baseDefenseBonus: 14,
  },
}

export function getPlanetMaxPopulation(type: PlanetType, baseCap: number): number {
  return Math.floor(baseCap * PLANET_TYPE_INFO[type].populationCapMultiplier)
}

export function getPlanetTypeSummary(type: PlanetType): string {
  const info = PLANET_TYPE_INFO[type]
  const spec = PLANET_SPECIALIZATION_LABELS[info.specialization].label
  if (info.specialization === 'strategic') {
    return `${spec} · Low survivability · Void road control`
  }
  return `${spec} · Survivability ${Math.round(info.survivability * 100)}%`
}

export const ENEMY_PLANETS: Omit<Planet, 'buildings' | 'defenseRating'>[] = [
  {
    id: 'kryll-prime',
    name: PLANET_LORE_NAMES['kryll-prime'].name,
    type: 'volcanic',
    owner: 'enemy',
    enemyFaction: 'kryll',
    population: 5000,
    maxPopulation: getPlanetMaxPopulation('volcanic', 10000),
  },
  {
    id: 'vexar-nexus',
    name: PLANET_LORE_NAMES['vexar-nexus'].name,
    type: 'gasGiant',
    owner: 'enemy',
    enemyFaction: 'vexar',
    population: 3000,
    maxPopulation: getPlanetMaxPopulation('gasGiant', 8000),
  },
  {
    id: 'zynthia',
    name: PLANET_LORE_NAMES.zynthia.name,
    type: 'habitable',
    owner: 'enemy',
    enemyFaction: 'zynthian',
    population: 6000,
    maxPopulation: getPlanetMaxPopulation('habitable', 12000),
  },
  {
    id: 'azure-depths',
    name: PLANET_LORE_NAMES['azure-depths'].name,
    type: 'oceanic',
    owner: 'enemy',
    enemyFaction: 'zynthian',
    population: 4500,
    maxPopulation: getPlanetMaxPopulation('oceanic', 10000),
  },
  {
    id: 'pirate-haven',
    name: PLANET_LORE_NAMES['pirate-haven'].name,
    type: 'jungle',
    owner: 'enemy',
    enemyFaction: 'pirates',
    population: 2500,
    maxPopulation: getPlanetMaxPopulation('jungle', 7000),
  },
  {
    id: 'kryll-outpost',
    name: PLANET_LORE_NAMES['kryll-outpost'].name,
    type: 'asteroid',
    owner: 'enemy',
    enemyFaction: 'kryll',
    population: 400,
    maxPopulation: getPlanetMaxPopulation('asteroid', 2500),
  },
  {
    id: 'sentinel-drift',
    name: PLANET_LORE_NAMES['sentinel-drift'].name,
    type: 'barren',
    owner: 'enemy',
    enemyFaction: 'pirates',
    population: 120,
    maxPopulation: getPlanetMaxPopulation('barren', 1500),
  },
  {
    id: 'vexar-shard',
    name: PLANET_LORE_NAMES['vexar-shard'].name,
    type: 'crystalline',
    owner: 'enemy',
    enemyFaction: 'vexar',
    population: 900,
    maxPopulation: getPlanetMaxPopulation('crystalline', 4000),
  },
  {
    id: 'toxica-iv',
    name: PLANET_LORE_NAMES['toxica-iv'].name,
    type: 'toxic',
    owner: 'enemy',
    enemyFaction: 'kryll',
    population: 1800,
    maxPopulation: getPlanetMaxPopulation('toxic', 5500),
  },
]

export function createEnemyPlanet(
  template: Omit<Planet, 'buildings' | 'defenseRating'>
): Planet {
  const buildingCount = Math.floor(Math.random() * 3) + 2
  const buildingTypes: BuildingType[] = [
    'extractionHub',
    'solarArray',
    'hydroponics',
    'shieldGenerator',
  ]
  const buildings = Array.from({ length: buildingCount }, (_, i) => ({
    type: buildingTypes[i % buildingTypes.length],
    level: Math.floor(Math.random() * 3) + 1,
  }))

  const typeInfo = PLANET_TYPE_INFO[template.type]
  const defenseRating =
    10 +
    typeInfo.baseDefenseBonus +
    typeInfo.strategicBonus +
    buildings.reduce((sum, b) => {
      const info = BUILDING_INFO[b.type]
      return sum + info.defenseBonus * b.level
    }, 0) +
    Math.floor(template.population / 500) +
    20

  return { ...template, buildings, defenseRating }
}
