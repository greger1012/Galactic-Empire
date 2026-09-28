import { ENEMY_FACTIONS } from './constants'
import { getDeepVoidPulsePressure } from './deepVoid'
import { createEvent } from './engine'
import { getFactionLore } from './lore'
import type { GameEvent, Planet, Resources } from './types'

/** Contested mandates react on this cadence (mandate cycles). */
export const FACTION_PULSE_INTERVAL = 15

const MAX_ENEMY_DEFENSE = 95

type PulseKind = 'reinforce' | 'raid' | 'embargo' | 'muster'

function pulseRoll(tickCount: number, factionId: string, salt: number): number {
  let h = tickCount * 2654435761 + salt
  for (let i = 0; i < factionId.length; i++) {
    h ^= factionId.charCodeAt(i) << (i % 8)
    h = Math.imul(h, 2246822519)
  }
  return ((h >>> 0) % 1000) / 1000
}

function pickPulseKind(aggression: number, roll: number): PulseKind {
  if (roll < aggression * 0.28) return 'muster'
  if (roll < aggression * 0.28 + 0.32) return 'reinforce'
  if (roll < aggression * 0.28 + 0.32 + 0.22) return 'raid'
  return 'embargo'
}

function planetsForFaction(planets: Planet[], factionId: string): Planet[] {
  return planets.filter((p) => p.owner === 'enemy' && p.enemyFaction === factionId)
}

export interface FactionPulseResult {
  planets: Planet[]
  resources: Resources
  events: GameEvent[]
}

export function runFactionPulse(
  tickCount: number,
  planets: Planet[],
  resources: Resources,
  frontierWave = 0
): FactionPulseResult {
  const pulsePressure = 1 + getDeepVoidPulsePressure(frontierWave)
  if (tickCount <= 0 || tickCount % FACTION_PULSE_INTERVAL !== 0) {
    return { planets, resources, events: [] }
  }

  const factionIds = [
    ...new Set(
      planets.filter((p) => p.owner === 'enemy' && p.enemyFaction).map((p) => p.enemyFaction!)
    ),
  ]

  if (factionIds.length === 0) {
    return { planets, resources, events: [] }
  }

  let nextPlanets = planets.map((p) => ({ ...p }))
  let nextResources = { ...resources }
  const events: GameEvent[] = []

  for (const factionId of factionIds) {
    const lore = getFactionLore(factionId) ?? ENEMY_FACTIONS.find((f) => f.id === factionId)
    if (!lore) continue

    const roll = pulseRoll(tickCount, factionId, 17)
    if (roll > 0.42 + lore.aggression * 0.35) continue

    const kind = pickPulseKind(lore.aggression, pulseRoll(tickCount, factionId, 91))
    const targets = planetsForFaction(nextPlanets, factionId)
    if (targets.length === 0) continue

    switch (kind) {
      case 'reinforce': {
        const target = targets[Math.floor(pulseRoll(tickCount, factionId, 3) * targets.length)]
        const boost = 4 + Math.floor(lore.aggression * 8)
        nextPlanets = nextPlanets.map((p) =>
          p.id === target.id
            ? {
                ...p,
                defenseRating: Math.min(MAX_ENEMY_DEFENSE, p.defenseRating + boost),
              }
            : p
        )
        events.push(
          createEvent(
            'warning',
            `${lore.shortName} reinforce ${target.name}: aegis +${boost} as garrisons dig in.`
          )
        )
        break
      }
      case 'muster': {
        const boost = 2 + Math.floor(lore.aggression * 4)
        nextPlanets = nextPlanets.map((p) =>
          p.enemyFaction === factionId && p.owner === 'enemy'
            ? {
                ...p,
                defenseRating: Math.min(MAX_ENEMY_DEFENSE, p.defenseRating + boost),
              }
            : p
        )
        events.push(
          createEvent(
            'warning',
            `${lore.name} issues a sector muster — all ${lore.shortName} worlds gain +${boost} aegis.`
          )
        )
        break
      }
      case 'raid': {
        const mineralLoss = Math.max(
          3,
          Math.floor(nextResources.minerals * (0.04 + lore.aggression * 0.04) * pulsePressure)
        )
        const energyLoss = Math.max(
          2,
          Math.floor(nextResources.energy * (0.03 + lore.aggression * 0.03) * pulsePressure)
        )
        nextResources = {
          ...nextResources,
          minerals: Math.max(0, nextResources.minerals - mineralLoss),
          energy: Math.max(0, nextResources.energy - energyLoss),
        }
        events.push(
          createEvent(
            'danger',
            `${lore.shortName} void-raiders strike a trade lane — lost ${mineralLoss} adamant and ${energyLoss} lumin.`
          )
        )
        break
      }
      case 'embargo': {
        const creditLoss = Math.max(2, Math.floor((4 + lore.aggression * 10) * pulsePressure))
        nextResources = {
          ...nextResources,
          credits: Math.max(0, nextResources.credits - creditLoss),
        }
        events.push(
          createEvent(
            'warning',
            `${lore.shortName} merchants enforce an embargo — sovereign marks −${creditLoss} this cycle.`
          )
        )
        break
      }
    }
  }

  return { planets: nextPlanets, resources: nextResources, events }
}
