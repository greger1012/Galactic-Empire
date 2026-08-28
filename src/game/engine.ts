import {
  BUILDING_INFO,
  PLANET_TYPE_INFO,
  SHIP_INFO,
} from './constants'
import type {
  BuildingType,
  Fleet,
  GameEvent,
  Planet,
  ProductionRates,
  Resources,
  ShipType,
} from './types'

let eventCounter = 0

export function createEvent(
  type: GameEvent['type'],
  message: string
): GameEvent {
  return {
    id: `evt-${++eventCounter}`,
    timestamp: Date.now(),
    type,
    message,
  }
}

export function getBuildingLevel(
  planet: Planet,
  type: BuildingType
): number {
  return planet.buildings.find((b) => b.type === type)?.level ?? 0
}

export function getBuildingCost(
  type: BuildingType,
  currentLevel: number
): Resources {
  const info = BUILDING_INFO[type]
  const multiplier = Math.pow(info.costMultiplier, currentLevel)
  return {
    minerals: Math.floor(info.baseCost.minerals * multiplier),
    energy: Math.floor(info.baseCost.energy * multiplier),
    food: Math.floor(info.baseCost.food * multiplier),
    credits: Math.floor(info.baseCost.credits * multiplier),
  }
}

export function canAfford(resources: Resources, cost: Resources): boolean {
  return (
    resources.minerals >= cost.minerals &&
    resources.energy >= cost.energy &&
    resources.food >= cost.food &&
    resources.credits >= cost.credits
  )
}

export function subtractResources(
  resources: Resources,
  cost: Resources
): Resources {
  return {
    minerals: resources.minerals - cost.minerals,
    energy: resources.energy - cost.energy,
    food: resources.food - cost.food,
    credits: resources.credits - cost.credits,
  }
}

export function calculateProduction(planets: Planet[]): ProductionRates {
  const rates: ProductionRates = {
    minerals: 0,
    energy: 0,
    food: 0,
    credits: 0,
  }

  for (const planet of planets) {
    if (planet.owner !== 'player') continue
    const typeInfo = PLANET_TYPE_INFO[planet.type]

    for (const building of planet.buildings) {
      const info = BUILDING_INFO[building.type]
      if (info.produces) {
        for (const [key, value] of Object.entries(info.produces)) {
          const resource = key as keyof ProductionRates
          let amount = value * building.level
          if (resource === 'minerals') amount *= typeInfo.mineralBonus
          if (resource === 'energy') amount *= typeInfo.energyBonus
          if (resource === 'food') amount *= typeInfo.foodBonus
          rates[resource] += amount
        }
      }
    }
  }

  return rates
}

export function calculateConsumption(planets: Planet[]): ProductionRates {
  const consumption: ProductionRates = {
    minerals: 0,
    energy: 0,
    food: 0,
    credits: 0,
  }

  for (const planet of planets) {
    if (planet.owner !== 'player') continue

    for (const building of planet.buildings) {
      const info = BUILDING_INFO[building.type]
      if (info.consumes) {
        for (const [key, value] of Object.entries(info.consumes)) {
          consumption[key as keyof ProductionRates] += value * building.level
        }
      }
    }

    consumption.food += Math.ceil(planet.population / 1000)
  }

  return consumption
}

export function calculatePlanetDefense(planet: Planet): number {
  let defense = 10
  for (const building of planet.buildings) {
    const info = BUILDING_INFO[building.type]
    defense += info.defenseBonus * building.level
  }
  defense += Math.floor(planet.population / 500)
  if (planet.owner === 'enemy') {
    defense += 20
  }
  return defense
}

export function getFleetPower(fleet: Fleet): number {
  return (Object.keys(fleet) as ShipType[]).reduce(
    (total, type) => total + fleet[type] * SHIP_INFO[type].attackPower,
    0
  )
}

export interface CombatResult {
  victory: boolean
  attackerLosses: Partial<Fleet>
  defenderLosses: number
  message: string
}

export function resolveCombat(
  attackingFleet: Fleet,
  defenseRating: number,
  planetName: string
): CombatResult {
  const attackPower = getFleetPower(attackingFleet)
  const defenseRoll = defenseRating * (0.8 + Math.random() * 0.4)
  const attackRoll = attackPower * (0.85 + Math.random() * 0.3)

  if (attackRoll > defenseRoll) {
    const lossRatio = Math.min(0.6, defenseRoll / attackRoll)
    const losses: Partial<Fleet> = {}
    for (const type of Object.keys(attackingFleet) as ShipType[]) {
      const count = attackingFleet[type]
      if (count > 0) {
        losses[type] = Math.max(0, Math.floor(count * lossRatio * (0.3 + Math.random() * 0.4)))
      }
    }
    return {
      victory: true,
      attackerLosses: losses,
      defenderLosses: defenseRating,
      message: `Victory! ${planetName} has been conquered!`,
    }
  }

  const losses: Partial<Fleet> = {}
  for (const type of Object.keys(attackingFleet) as ShipType[]) {
    losses[type] = attackingFleet[type]
  }
  return {
    victory: false,
    attackerLosses: losses,
    defenderLosses: 0,
    message: `Defeat at ${planetName}. Your fleet was destroyed.`,
  }
}

export function applyFleetLosses(fleet: Fleet, losses: Partial<Fleet>): Fleet {
  const result = { ...fleet }
  for (const type of Object.keys(losses) as ShipType[]) {
    result[type] = Math.max(0, result[type] - (losses[type] ?? 0))
  }
  return result
}

export function getTotalShips(fleet: Fleet): number {
  return Object.values(fleet).reduce((a, b) => a + b, 0)
}
