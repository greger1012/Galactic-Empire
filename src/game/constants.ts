import type {
  BuildingType,
  EnemyFaction,
  Planet,
  PlanetType,
  Resources,
  ShipType,
} from './types'

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
    name: 'Extraction Hub',
    description: 'Mines minerals from the planet core',
    icon: '⛏️',
    baseCost: { minerals: 50, energy: 20, food: 0, credits: 0 },
    costMultiplier: 1.6,
    produces: { minerals: 3 },
    consumes: { energy: 1 },
    defenseBonus: 0,
    maxLevel: 10,
  },
  solarArray: {
    name: 'Solar Array',
    description: 'Generates energy from stellar radiation',
    icon: '☀️',
    baseCost: { minerals: 40, energy: 0, food: 0, credits: 0 },
    costMultiplier: 1.5,
    produces: { energy: 4 },
    defenseBonus: 0,
    maxLevel: 10,
  },
  hydroponics: {
    name: 'Hydroponics Bay',
    description: 'Grows food to sustain your population',
    icon: '🌱',
    baseCost: { minerals: 30, energy: 15, food: 0, credits: 0 },
    costMultiplier: 1.5,
    produces: { food: 3 },
    consumes: { energy: 1 },
    defenseBonus: 0,
    maxLevel: 10,
  },
  shipyard: {
    name: 'Orbital Shipyard',
    description: 'Constructs warships for your fleet',
    icon: '🚀',
    baseCost: { minerals: 100, energy: 50, food: 0, credits: 25 },
    costMultiplier: 1.8,
    consumes: { energy: 2 },
    defenseBonus: 5,
    maxLevel: 5,
  },
  shieldGenerator: {
    name: 'Planetary Shield',
    description: 'Defends against enemy bombardment',
    icon: '🛡️',
    baseCost: { minerals: 80, energy: 40, food: 0, credits: 10 },
    costMultiplier: 1.7,
    consumes: { energy: 2 },
    defenseBonus: 25,
    maxLevel: 8,
  },
  commandCenter: {
    name: 'Command Center',
    description: 'Coordinates empire operations and generates credits',
    icon: '🏛️',
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
    name: 'Scout',
    description: 'Fast reconnaissance vessel',
    icon: '🔭',
    cost: { minerals: 25, energy: 10, food: 0, credits: 5 },
    attackPower: 5,
    buildTime: 1,
  },
  frigate: {
    name: 'Frigate',
    description: 'Versatile combat ship',
    icon: '⚔️',
    cost: { minerals: 60, energy: 30, food: 0, credits: 15 },
    attackPower: 15,
    buildTime: 2,
  },
  destroyer: {
    name: 'Destroyer',
    description: 'Heavy warship with devastating firepower',
    icon: '💥',
    cost: { minerals: 150, energy: 80, food: 0, credits: 40 },
    attackPower: 40,
    buildTime: 4,
  },
  carrier: {
    name: 'Carrier',
    description: 'Massive capital ship commanding fleets',
    icon: '🛸',
    cost: { minerals: 400, energy: 200, food: 0, credits: 100 },
    attackPower: 80,
    buildTime: 8,
  },
}

export const PLANET_TYPE_INFO: Record<
  PlanetType,
  { name: string; icon: string; mineralBonus: number; energyBonus: number; foodBonus: number }
> = {
  terran: { name: 'Terran', icon: '🌍', mineralBonus: 1.0, energyBonus: 1.0, foodBonus: 1.2 },
  desert: { name: 'Desert', icon: '🏜️', mineralBonus: 1.3, energyBonus: 1.2, foodBonus: 0.7 },
  ice: { name: 'Ice', icon: '❄️', mineralBonus: 0.8, energyBonus: 0.9, foodBonus: 0.8 },
  volcanic: { name: 'Volcanic', icon: '🌋', mineralBonus: 1.5, energyBonus: 1.4, foodBonus: 0.5 },
  gasGiant: { name: 'Gas Giant', icon: '🪐', mineralBonus: 0.6, energyBonus: 1.8, foodBonus: 0.3 },
}

export const ENEMY_FACTIONS: EnemyFaction[] = [
  { id: 'kryll', name: 'Kryll Dominion', color: '#e74c3c', aggression: 0.7 },
  { id: 'vexar', name: 'Vexar Collective', color: '#9b59b6', aggression: 0.5 },
  { id: 'zynthian', name: 'Zynthian Empire', color: '#2ecc71', aggression: 0.4 },
  { id: 'pirates', name: 'Outer Rim Pirates', color: '#f39c12', aggression: 0.8 },
]

export const ENEMY_PLANETS: Omit<Planet, 'buildings' | 'defenseRating'>[] = [
  {
    id: 'kryll-prime',
    name: 'Kryll Prime',
    type: 'volcanic',
    owner: 'enemy',
    enemyFaction: 'kryll',
    population: 5000,
    maxPopulation: 10000,
  },
  {
    id: 'vexar-nexus',
    name: 'Vexar Nexus',
    type: 'gasGiant',
    owner: 'enemy',
    enemyFaction: 'vexar',
    population: 3000,
    maxPopulation: 8000,
  },
  {
    id: 'zynthia',
    name: 'Zynthia',
    type: 'terran',
    owner: 'enemy',
    enemyFaction: 'zynthian',
    population: 4000,
    maxPopulation: 12000,
  },
  {
    id: 'pirate-haven',
    name: 'Pirate Haven',
    type: 'desert',
    owner: 'enemy',
    enemyFaction: 'pirates',
    population: 1500,
    maxPopulation: 5000,
  },
  {
    id: 'kryll-outpost',
    name: 'Kryll Outpost',
    type: 'desert',
    owner: 'enemy',
    enemyFaction: 'kryll',
    population: 2000,
    maxPopulation: 6000,
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

  const defenseRating =
    30 +
    buildings.reduce((sum, b) => {
      const info = BUILDING_INFO[b.type]
      return sum + info.defenseBonus * b.level
    }, 0) +
    Math.floor(template.population / 500)

  return { ...template, buildings, defenseRating }
}
