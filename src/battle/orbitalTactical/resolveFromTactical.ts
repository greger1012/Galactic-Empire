import type { Fleet } from '../../game/types'
import type { TechModifiers } from '../../game/research'
import {
  ORBITAL_DOCTRINES,
  type OrbitalEngagementResult,
} from '../orbitalEngagement'
import type { OrbitalTacticalState } from './types'
import { getAegisDamageRatio, getOrbitalTacticalSurvivalRatio } from './logic'

export function resolveOrbitalFromTactical(
  tactical: OrbitalTacticalState,
  defenseRating: number,
  fleet: Fleet,
  mods: TechModifiers
): OrbitalEngagementResult {
  const doctrine = tactical.doctrine
  const doctrineInfo = ORBITAL_DOCTRINES.find((d) => d.id === doctrine) ?? ORBITAL_DOCTRINES[1]
  const survival = getOrbitalTacticalSurvivalRatio(tactical)
  const aegisDamage = getAegisDamageRatio(tactical)
  const won = tactical.status === 'victory'

  const attackScore = Math.round(
    defenseRating * (0.5 + aegisDamage * 0.9) * doctrineInfo.attackMult * mods.fleetPowerMult
  )
  const defenseScore = Math.round(defenseRating * (1 - aegisDamage * 0.75))
  const marginRatio = attackScore / Math.max(1, defenseScore)

  let outcome: OrbitalEngagementResult['outcome'] = 'contested'
  let defenseSuppression = Math.min(0.5, aegisDamage * 0.85 + (won ? 0.12 : 0))
  let deploymentMult = 1
  let legionDamageMult = 1
  let fleetLossRate = 0.14 * doctrineInfo.lossMult

  if (!won) {
    outcome = 'repulsed'
    defenseSuppression = Math.max(0.05, aegisDamage * 0.4)
    legionDamageMult = 0.82
    deploymentMult = 0.86
    fleetLossRate = 0.35 * doctrineInfo.lossMult
  } else if (survival >= 0.75 && aegisDamage >= 0.85) {
    outcome = 'decisive'
    defenseSuppression = Math.min(0.48, defenseSuppression + 0.15)
    deploymentMult = 1.1
    legionDamageMult = 1.1
    fleetLossRate = 0.07 * doctrineInfo.lossMult
  } else if (survival >= 0.45) {
    outcome = 'contested'
    fleetLossRate = 0.12 * doctrineInfo.lossMult
  } else {
    outcome = 'costly'
    legionDamageMult = 0.9
    fleetLossRate = 0.22 * doctrineInfo.lossMult
  }

  fleetLossRate = Math.min(0.5, Math.max(0.05, fleetLossRate * (1.4 - survival)))

  const chronicle = won
    ? outcome === 'decisive'
      ? 'Void duel won. Orbital aegis shattered — legions descend through burning skies.'
      : 'Orbital lanes secured after a sharp void engagement. Ground assault authorized.'
    : 'The armada is driven back from orbital space. Legions assault under withering aegis fire.'

  void fleet

  return {
    attackScore,
    defenseScore,
    marginRatio,
    outcome,
    defenseSuppression,
    deploymentMult,
    legionDamageMult,
    fleetLossRate,
    chronicle,
  }
}
