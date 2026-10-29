import { ENEMY_FACTIONS } from './constants'
import { createEvent } from './engine'
import type { GameEvent, Planet } from './types'
import { FOUNDING_SYSTEM_ID, planetsInSystem } from './starSystems'

const MAX_ENEMY_DEFENSE = 95

function reprisalRoll(planetId: string, tickCount: number): number {
  let h = tickCount * 1597334677
  for (let i = 0; i < planetId.length; i++) {
    h = Math.imul(h ^ planetId.charCodeAt(i), 2246822519)
  }
  return ((h >>> 0) % 1000) / 1000
}

export interface ConquestReprisalResult {
  planets: Planet[]
  events: GameEvent[]
}

/** Rival mandates react when a contested world falls — garrisons dig in on siblings. */
export function applyConquestReprisal(
  planets: Planet[],
  conquered: Planet,
  tickCount: number
): ConquestReprisalResult {
  if (!conquered.enemyFaction) {
    return { planets, events: [] }
  }

  const faction = ENEMY_FACTIONS.find((f) => f.id === conquered.enemyFaction)
  if (!faction) return { planets, events: [] }

  const systemId = conquered.systemId ?? FOUNDING_SYSTEM_ID
  const siblings = planetsInSystem(planets, systemId).filter(
    (p) =>
      p.owner === 'enemy' &&
      p.id !== conquered.id &&
      p.enemyFaction === conquered.enemyFaction
  )

  if (siblings.length === 0) {
    return { planets, events: [] }
  }

  const chance = 0.28 + faction.aggression * 0.35
  if (reprisalRoll(conquered.id, tickCount) > chance) {
    return { planets, events: [] }
  }

  const target = siblings[Math.floor(reprisalRoll(conquered.id, tickCount + 7) * siblings.length)]
  const boost = 3 + Math.floor(faction.aggression * 6)

  const nextPlanets = planets.map((p) =>
    p.id === target.id
      ? {
          ...p,
          defenseRating: Math.min(MAX_ENEMY_DEFENSE, p.defenseRating + boost),
        }
      : p
  )

  return {
    planets: nextPlanets,
    events: [
      createEvent(
        'warning',
        `${faction.shortName} reprisal: ${target.name} garrisons swell (+${boost} aegis) after ${conquered.name} fell.`
      ),
    ],
  }
}

/** Cycles of reduced output while a newly conquered world resists Throne law. */
export const OCCUPATION_UNREST_CYCLES = 5
export const OCCUPATION_PRODUCTION_MULT = 0.68

export function occupationProductionMult(planet: Planet): number {
  if (planet.owner !== 'player') return 1
  const unrest = planet.occupationUnrest ?? 0
  return unrest > 0 ? OCCUPATION_PRODUCTION_MULT : 1
}
