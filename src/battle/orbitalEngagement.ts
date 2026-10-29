import { SHIP_INFO } from '../game/constants'
import { getFleetPower } from '../game/engine'
import type { TechModifiers } from '../game/research'
import type { Fleet, ShipType } from '../game/types'

export type OrbitalDoctrine = 'lanceBarrage' | 'balanced' | 'voidScreens'

export interface DoctrineInfo {
  id: OrbitalDoctrine
  name: string
  tagline: string
  attackMult: number
  lossMult: number
  suppressionBonus: number
}

export const ORBITAL_DOCTRINES: DoctrineInfo[] = [
  {
    id: 'lanceBarrage',
    name: 'Lance Barrage',
    tagline: 'Overwhelm orbital aegis quickly — higher voidship attrition.',
    attackMult: 1.28,
    lossMult: 1.35,
    suppressionBonus: 0.1,
  },
  {
    id: 'balanced',
    name: 'Standard Void Doctrine',
    tagline: 'Methodical exchange between armada batteries and planetary aegis.',
    attackMult: 1,
    lossMult: 1,
    suppressionBonus: 0,
  },
  {
    id: 'voidScreens',
    name: 'Screened Approach',
    tagline: 'Frigates and escorts preserve hulls — slower aegis erosion.',
    attackMult: 0.88,
    lossMult: 0.62,
    suppressionBonus: 0.05,
  },
]

export interface OrbitalShipRoles {
  orbitalAttack: number
  scoutSuppression: number
  carrierDeploymentBonus: number
  destroyerBonus: number
  frigateScreening: number
}

export function getOrbitalShipRoles(fleet: Fleet, mods: TechModifiers): OrbitalShipRoles {
  const destroyerBonus = fleet.destroyer * 0.12
  const frigateScreening = Math.min(0.2, fleet.frigate * 0.015)
  const scoutSuppression = Math.min(0.18, fleet.scout * 0.03)
  const carrierDeploymentBonus = fleet.carrier * 0.06

  let orbitalAttack = 0
  for (const type of Object.keys(fleet) as ShipType[]) {
    const count = fleet[type]
    const perHull = SHIP_INFO[type].attackPower
    if (type === 'destroyer') orbitalAttack += count * perHull * 1.22
    else if (type === 'scout') orbitalAttack += count * perHull * 0.75
    else orbitalAttack += count * perHull
  }

  orbitalAttack = Math.floor(orbitalAttack * mods.fleetPowerMult * (1 + destroyerBonus))

  return {
    orbitalAttack,
    scoutSuppression,
    carrierDeploymentBonus,
    destroyerBonus,
    frigateScreening,
  }
}

export interface OrbitalEngagementResult {
  attackScore: number
  defenseScore: number
  marginRatio: number
  outcome: 'decisive' | 'contested' | 'costly' | 'repulsed'
  defenseSuppression: number
  deploymentMult: number
  legionDamageMult: number
  fleetLossRate: number
  chronicle: string
}

export function resolveOrbitalEngagement(
  fleet: Fleet,
  defenseRating: number,
  doctrine: OrbitalDoctrine,
  mods: TechModifiers
): OrbitalEngagementResult {
  const roles = getOrbitalShipRoles(fleet, mods)
  const doctrineInfo = ORBITAL_DOCTRINES.find((d) => d.id === doctrine) ?? ORBITAL_DOCTRINES[1]

  const attackBase = roles.orbitalAttack * doctrineInfo.attackMult
  const defenseBase = defenseRating * 0.92

  const attackScore = attackBase * (0.88 + Math.random() * 0.24)
  const defenseScore = defenseBase * (0.82 + Math.random() * 0.28)
  const marginRatio = attackScore / Math.max(1, defenseScore)

  let outcome: OrbitalEngagementResult['outcome'] = 'contested'
  let defenseSuppression = roles.scoutSuppression + doctrineInfo.suppressionBonus
  let deploymentMult = 1 + roles.carrierDeploymentBonus
  let legionDamageMult = 1
  let fleetLossRate = 0.12 * doctrineInfo.lossMult

  if (marginRatio >= 1.35) {
    outcome = 'decisive'
    defenseSuppression += 0.22
    deploymentMult += 0.08
    legionDamageMult = 1.12
    fleetLossRate = 0.08 * doctrineInfo.lossMult
  } else if (marginRatio >= 0.95) {
    outcome = 'contested'
    defenseSuppression += 0.12
    fleetLossRate = 0.14 * doctrineInfo.lossMult
  } else if (marginRatio >= 0.65) {
    outcome = 'costly'
    defenseSuppression += 0.05
    legionDamageMult = 0.92
    deploymentMult *= 0.94
    fleetLossRate = 0.22 * doctrineInfo.lossMult
  } else {
    outcome = 'repulsed'
    defenseSuppression = Math.max(0, defenseSuppression - 0.05)
    legionDamageMult = 0.85
    deploymentMult *= 0.88
    fleetLossRate = 0.32 * doctrineInfo.lossMult
  }

  defenseSuppression = Math.min(0.45, Math.max(0, defenseSuppression))
  fleetLossRate = Math.min(0.55, Math.max(0.04, fleetLossRate - roles.frigateScreening))

  const chronicle =
    outcome === 'decisive'
      ? 'Orbital aegis shattered. Legions descend through burning skies.'
      : outcome === 'contested'
        ? 'Orbital lanes contested; ground assault proceeds under hostile fire.'
        : outcome === 'costly'
          ? 'Pyrrhic void victory — the armada bleeds but the mandate holds.'
          : 'Orbital batteries repulse the vanguard; legions assault under heavy aegis.'

  return {
    attackScore: Math.round(attackScore),
    defenseScore: Math.round(defenseScore),
    marginRatio,
    outcome,
    defenseSuppression,
    deploymentMult,
    legionDamageMult,
    fleetLossRate,
    chronicle,
  }
}

export function getOrbitalFleetLosses(fleet: Fleet, lossRate: number): Partial<Fleet> {
  const losses: Partial<Fleet> = {}
  for (const type of Object.keys(fleet) as ShipType[]) {
    const count = fleet[type]
    if (count <= 0) continue
    const loss = Math.max(0, Math.floor(count * lossRate * (0.35 + Math.random() * 0.5)))
    if (loss > 0) losses[type] = loss
  }
  return losses
}

/** Display strength for UI bars (uses standard armada rating). */
export function getArmadaStrengthDisplay(fleet: Fleet, mods: TechModifiers): number {
  return getFleetPower(fleet, mods)
}
