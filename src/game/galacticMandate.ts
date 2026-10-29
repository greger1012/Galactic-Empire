import type { GameState } from './types'
import {
  FOUNDING_SYSTEM_ID,
  countEnemiesInSystem,
  getStarSystem,
  planetsInSystem,
} from './starSystems'

export type GalacticMandateStepId =
  | 'secureHeliosCorridor'
  | 'chartFirstHyperlane'
  | 'holdOuterSystem'

export interface GalacticMandateStep {
  id: GalacticMandateStepId
  title: string
  hint: string
  done: boolean
}

export function getChartedSystemCount(state: GameState): number {
  return (state.starSystems ?? []).filter((s) => s.charted).length
}

export function isFoundingSystemSecure(state: GameState): boolean {
  return countEnemiesInSystem(state.planets, FOUNDING_SYSTEM_ID) === 0
}

export function hasOuterThroneWorld(state: GameState): boolean {
  return state.planets.some(
    (p) => p.owner === 'player' && (p.systemId ?? FOUNDING_SYSTEM_ID) !== FOUNDING_SYSTEM_ID
  )
}

export function getGalacticMandateSteps(state: GameState): GalacticMandateStep[] {
  const foundingSecure = isFoundingSystemSecure(state)
  const charted = getChartedSystemCount(state)
  const founding = getStarSystem(state, FOUNDING_SYSTEM_ID)

  return [
    {
      id: 'secureHeliosCorridor',
      title: `Secure ${founding?.name ?? 'Helios Corridor'}`,
      hint:
        'In Stellar Cartograph → Star system, eliminate every contested world in the founding system. ' +
        'Cartographers will then survey hyperlanes to neighboring stars.',
      done: foundingSecure,
    },
    {
      id: 'chartFirstHyperlane',
      title: 'Chart your first hyperlane',
      hint:
        'Open Galactic chart to see sensor ghosts. When Helios Corridor is secure, adjacent stars chart automatically — ' +
        'select a newly charted star and issue mandates there.',
      done: charted >= 2,
    },
    {
      id: 'holdOuterSystem',
      title: 'Establish a throne world beyond the Iron Sun',
      hint:
        'Conquer at least one world in a charted outer star system to anchor the mandate beyond Helios Corridor.',
      done: hasOuterThroneWorld(state),
    },
  ]
}

export function isGalacticMandateComplete(state: GameState): boolean {
  return getGalacticMandateSteps(state).every((s) => s.done)
}

/** Show cartography briefing once the player has begun conquest or finished the opening mandate. */
export function shouldShowGalacticMandate(state: GameState): boolean {
  if (isGalacticMandateComplete(state)) return false
  return state.mandateGuide.invasionIssued || isFoundingSystemSecure(state)
}

export type GalacticMandateFocus = 'galacticChart' | 'invasion' | null

export function getGalacticMandateFocus(state: GameState): GalacticMandateFocus {
  if (isGalacticMandateComplete(state)) return null
  const steps = getGalacticMandateSteps(state)
  const next = steps.find((s) => !s.done)
  if (!next) return null
  if (next.id === 'secureHeliosCorridor') return 'invasion'
  return 'galacticChart'
}

export function getActiveStarSystemLabel(state: GameState): {
  name: string
  starLabel: string
  viewLabel: string
} {
  const system = getStarSystem(state, state.selectedSystemId)
  const viewLabel =
    state.stellarMapView === 'galaxy' ? 'Galactic chart' : 'Star system view'
  return {
    name: system?.name ?? 'Helios Corridor',
    starLabel: system?.starLabel ?? 'Iron Sun',
    viewLabel,
  }
}

export function getGalacticMapCallout(state: GameState): string | null {
  if (isGalacticMandateComplete(state)) return null
  const steps = getGalacticMandateSteps(state)
  const next = steps.find((s) => !s.done)
  if (!next) return null

  if (next.id === 'secureHeliosCorridor') {
    const remaining = countEnemiesInSystem(state.planets, FOUNDING_SYSTEM_ID)
    return `${remaining} contested world${remaining === 1 ? '' : 's'} remain in Helios Corridor — clear them to unlock hyperlane surveys.`
  }
  if (next.id === 'chartFirstHyperlane') {
    return 'Hyperlanes are open. Select a newly charted star on the Galactic chart, then switch to Star system to assault its mandates.'
  }
  return 'Expand the mandate: conquer a world in an outer star system.'
}

export function getFoundingEnemyCount(state: GameState): number {
  return countEnemiesInSystem(state.planets, FOUNDING_SYSTEM_ID)
}

export function getSystemSummaryForPlanet(state: GameState, systemId: string | undefined) {
  const id = systemId ?? FOUNDING_SYSTEM_ID
  const system = getStarSystem(state, id)
  const worlds = planetsInSystem(state.planets, id)
  const contested = worlds.filter((p) => p.owner === 'enemy').length
  const throne = worlds.filter((p) => p.owner === 'player').length
  return { system, contested, throne, total: worlds.length }
}
