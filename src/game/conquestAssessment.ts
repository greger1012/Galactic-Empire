import { getArmadaStrengthDisplay, getOrbitalShipRoles, type OrbitalDoctrine } from '../battle/orbitalEngagement'
import { getEnemyUnitCount, getPlayerUnitCount } from '../battle/spawnBattle'
import { BIOMES } from '../battle/biomes'
import { getHostileRosterName } from '../battle/enemyLoadouts'
import { getDeepVoidTierLabel } from './deepVoid'
import { getFleetPower } from './engine'
import { ENEMY_FACTIONS } from './constants'
import type { TechModifiers } from './research'
import type { Fleet, GameState, Planet } from './types'
import { FOUNDING_SYSTEM_ID, planetsInSystem } from './starSystems'

export type ConquestThreatTier = 'favorable' | 'contested' | 'punishing' | 'dire' | 'apex'

export interface ConquestDossier {
  planetId: string
  planetName: string
  systemName: string
  baseAegis: number
  garrisonBonus: number
  effectiveAegis: number
  fleetPower: number
  armadaProjection: number
  powerRatio: number
  threatTier: ConquestThreatTier
  threatLabel: string
  threatSummary: string
  siblingContested: number
  playerLegions: number
  hostileLegions: number
  hostileRoster: string
  voidTierLabel: string
  biomeLabel: string
  biomeHint: string
  recommendedDoctrine: OrbitalDoctrine
  doctrineReason: string
  factionName?: string
  isFrontierBoss: boolean
}

const GARRISON_PER_SIBLING = 4
const MAX_GARRISON_BONUS = 24

export function getSystemGarrisonBonus(
  planets: Planet[],
  systemId: string,
  targetPlanetId: string
): number {
  const siblings = planetsInSystem(planets, systemId).filter(
    (p) => p.id !== targetPlanetId && p.owner === 'enemy'
  )
  return Math.min(MAX_GARRISON_BONUS, siblings.length * GARRISON_PER_SIBLING)
}

export function getEffectiveAegis(planet: Planet, planets: Planet[]): number {
  const systemId = planet.systemId ?? FOUNDING_SYSTEM_ID
  const garrison = getSystemGarrisonBonus(planets, systemId, planet.id)
  return planet.defenseRating + garrison
}

function threatFromRatio(
  ratio: number,
  isFrontierBoss: boolean
): { tier: ConquestThreatTier; label: string; summary: string } {
  if (isFrontierBoss) {
    return {
      tier: 'apex',
      label: 'Apex bastion',
      summary: 'Void-hardened aegis and elite legions — expect heavy attrition.',
    }
  }
  if (ratio >= 1.12) {
    return {
      tier: 'favorable',
      label: 'Favorable exchange',
      summary: 'Armada projection exceeds local aegis — press the mandate with confidence.',
    }
  }
  if (ratio >= 0.88) {
    return {
      tier: 'contested',
      label: 'Contested lanes',
      summary: 'Orbital and ground phases will trade casualties — choose doctrine deliberately.',
    }
  }
  if (ratio >= 0.62) {
    return {
      tier: 'punishing',
      label: 'Punishing assault',
      summary: 'Garrison webs and aegis depth favor the defender — reinforce voidships first.',
    }
  }
  return {
    tier: 'dire',
    label: 'Dire mismatch',
    summary: 'Mandate assault likely repulsed without stronger armada or tech.',
  }
}

export function suggestOrbitalDoctrine(
  fleet: Fleet,
  effectiveAegis: number,
  mods: TechModifiers
): { doctrine: OrbitalDoctrine; reason: string } {
  const roles = getOrbitalShipRoles(fleet, mods)
  const projection = roles.orbitalAttack
  const ratio = projection / Math.max(1, effectiveAegis)

  if (ratio < 0.75 && (fleet.frigate >= 4 || fleet.scout >= 6)) {
    return {
      doctrine: 'voidScreens',
      reason: 'Preserve hulls while you erode aegis — your screen strength is high.',
    }
  }
  if (ratio >= 1.05 && fleet.destroyer >= 3) {
    return {
      doctrine: 'lanceBarrage',
      reason: 'Obelisk batteries can overwhelm this aegis — accept voidship losses.',
    }
  }
  if (fleet.carrier >= 2 && ratio >= 0.9) {
    return {
      doctrine: 'balanced',
      reason: 'Carrier cadres boost legion deployment after a measured orbital win.',
    }
  }
  return {
    doctrine: ratio >= 1 ? 'lanceBarrage' : 'balanced',
    reason:
      ratio >= 1
        ? 'Standard void doctrine with aggressive batteries fits this projection.'
        : 'Methodical exchange — avoid Lance Barrage until armada strength rises.',
  }
}

export function buildConquestDossier(
  state: GameState,
  planetId: string,
  fleet: Fleet,
  mods: TechModifiers
): ConquestDossier | null {
  const planet = state.planets.find((p) => p.id === planetId)
  if (!planet || planet.owner !== 'enemy') return null

  const systemId = planet.systemId ?? FOUNDING_SYSTEM_ID
  const system = state.starSystems?.find((s) => s.id === systemId)
  const garrisonBonus = getSystemGarrisonBonus(state.planets, systemId, planet.id)
  const effectiveAegis = planet.defenseRating + garrisonBonus
  const fleetPower = getFleetPower(fleet, mods)
  const armadaProjection = getArmadaStrengthDisplay(fleet, mods)
  const powerRatio = armadaProjection / Math.max(1, effectiveAegis)
  const isFrontierBoss = planet.isFrontierBoss === true
  const threat = threatFromRatio(powerRatio, isFrontierBoss)
  const frontierWave = planet.frontierWave ?? system?.frontierWave ?? 0
  const biome = BIOMES[planet.type]
  const siblingContested = planetsInSystem(state.planets, systemId).filter(
    (p) => p.owner === 'enemy' && p.id !== planet.id
  ).length
  const faction = planet.enemyFaction
    ? ENEMY_FACTIONS.find((f) => f.id === planet.enemyFaction)
    : undefined
  const { doctrine, reason } = suggestOrbitalDoctrine(fleet, effectiveAegis, mods)

  return {
    planetId,
    planetName: planet.name,
    systemName: system?.name ?? 'Helios Corridor',
    baseAegis: planet.defenseRating,
    garrisonBonus,
    effectiveAegis,
    fleetPower,
    armadaProjection,
    powerRatio,
    threatTier: threat.tier,
    threatLabel: threat.label,
    threatSummary: threat.summary,
    siblingContested,
    playerLegions: getPlayerUnitCount(fleetPower),
    hostileLegions: getEnemyUnitCount(effectiveAegis, {
      frontierWave,
      isFrontierBoss,
    }),
    hostileRoster: getHostileRosterName(planet.type, planet.enemyFaction),
    voidTierLabel: getDeepVoidTierLabel(frontierWave),
    biomeLabel: biome.name,
    biomeHint: biome.hazardLabel ?? biome.tagline,
    recommendedDoctrine: doctrine,
    doctrineReason: reason,
    factionName: faction?.shortName,
    isFrontierBoss,
  }
}
