export type ResourceType = 'minerals' | 'energy' | 'food' | 'credits'

export type Resources = Record<ResourceType, number>

export type BuildingType =
  | 'extractionHub'
  | 'solarArray'
  | 'hydroponics'
  | 'shipyard'
  | 'shieldGenerator'
  | 'commandCenter'

export type ShipType = 'scout' | 'frigate' | 'destroyer' | 'carrier'

export type PlanetType =
  | 'terran'
  | 'desert'
  | 'ice'
  | 'volcanic'
  | 'gasGiant'
  | 'oceanic'
  | 'jungle'
  | 'habitable'
  | 'asteroid'
  | 'barren'
  | 'toxic'
  | 'crystalline'

export type PlanetSpecialization =
  | 'balanced'
  | 'farming'
  | 'civilization'
  | 'mining'
  | 'industrial'
  | 'strategic'

export interface PlanetTypeInfo {
  name: string
  icon: string
  description: string
  specialization: PlanetSpecialization
  mineralBonus: number
  energyBonus: number
  foodBonus: number
  creditBonus: number
  survivability: number
  populationCapMultiplier: number
  strategicBonus: number
  baseDefenseBonus: number
}

export type Owner = 'player' | 'enemy'

export interface Building {
  type: BuildingType
  level: number
}

export interface Planet {
  id: string
  name: string
  type: PlanetType
  owner: Owner
  enemyFaction?: string
  population: number
  maxPopulation: number
  buildings: Building[]
  defenseRating: number
}

export interface Fleet {
  scout: number
  frigate: number
  destroyer: number
  carrier: number
}

export interface EnemyFaction {
  id: string
  name: string
  color: string
  aggression: number
}

export interface GameEvent {
  id: string
  timestamp: number
  type: 'info' | 'success' | 'warning' | 'danger'
  message: string
}

export interface ProductionRates {
  minerals: number
  energy: number
  food: number
  credits: number
}

export interface GameState {
  empireName: string
  tickCount: number
  resources: Resources
  planets: Planet[]
  fleet: Fleet
  selectedPlanetId: string
  events: GameEvent[]
  gameWon: boolean
  gameOver: boolean
}
