import { BUILDING_INFO } from './constants'
import { getBuildingLevel, getThroneNodeLevels, getTotalShips } from './engine'
import { LORE } from './lore'
import { BUILDING_LORE } from './names'
import { calculateResearchRate, getTechModifiers } from './research'
import type { GameState, MandateGuideState } from './types'

export type MandateStepId =
  | 'throneNode'
  | 'voidForge'
  | 'commissionShip'
  | 'firstAssault'
  | 'noosphericInquiry'

export interface MandateStep {
  id: MandateStepId
  title: string
  hint: string
  done: boolean
}

export type MandateFocus =
  | 'commandCenter'
  | 'shipyard'
  | 'fleet'
  | 'invasion'
  | 'research'
  | null

const INITIAL_SCOUT_COUNT = 2

export function getMandateSteps(state: GameState): MandateStep[] {
  const playerPlanets = state.planets.filter((p) => p.owner === 'player')
  const throneLevels = playerPlanets.reduce(
    (sum, p) => sum + getBuildingLevel(p, 'commandCenter'),
    0
  )
  const forgeLevels = playerPlanets.reduce(
    (sum, p) => sum + getBuildingLevel(p, 'shipyard'),
    0
  )
  const ships = getTotalShips(state.fleet)
  const researchActive =
    state.research.current !== null || state.research.researched.length > 0

  return [
    {
      id: 'throneNode',
      title: `Raise a ${BUILDING_LORE.commandCenter.name}`,
      hint: `Upgrade ${BUILDING_LORE.commandCenter.name} on any throne world. Each tier feeds the Noosphere (+insight per ${LORE.cycleLabel.toLowerCase()}).`,
      done: throneLevels >= 1,
    },
    {
      id: 'voidForge',
      title: `Construct a ${BUILDING_LORE.shipyard.name}`,
      hint: 'Orbital drydocks are required before the armada can commission new voidships.',
      done: forgeLevels >= 1,
    },
    {
      id: 'commissionShip',
      title: 'Commission a voidship',
      hint: `Use the Void Forge Commission panel to add hulls beyond your starting ${INITIAL_SCOUT_COUNT} Spectre Corvettes.`,
      done: ships > INITIAL_SCOUT_COUNT,
    },
    {
      id: 'firstAssault',
      title: 'Issue a Mandate of Conquest',
      hint: 'Select a contested world, fight the orbital aegis duel, then deploy legions to the surface.',
      done: state.mandateGuide.invasionIssued,
    },
    {
      id: 'noosphericInquiry',
      title: 'Begin Noospheric inquiry',
      hint: 'Choose any tier-one discipline in the research panel to direct imperial insight.',
      done: researchActive,
    },
  ]
}

export function isMandateComplete(state: GameState): boolean {
  return getMandateSteps(state).every((s) => s.done)
}

export function getMandateFocus(state: GameState): MandateFocus {
  if (state.mandateGuide.dismissed || isMandateComplete(state)) return null
  const steps = getMandateSteps(state)
  const next = steps.find((s) => !s.done)
  if (!next) return null
  switch (next.id) {
    case 'throneNode':
      return 'commandCenter'
    case 'voidForge':
      return 'shipyard'
    case 'commissionShip':
      return 'fleet'
    case 'firstAssault':
      return 'invasion'
    case 'noosphericInquiry':
      return 'research'
    default:
      return null
  }
}

export function getEmpireNoosphereSummary(state: GameState): {
  throneNodeTiers: number
  insightPerCycle: number
  buildingName: string
} {
  const mods = getTechModifiers(state.research.researched)
  const throneNodeTiers = getThroneNodeLevels(state.planets)
  return {
    throneNodeTiers,
    insightPerCycle: calculateResearchRate(throneNodeTiers, mods),
    buildingName: BUILDING_INFO.commandCenter.name,
  }
}

export const DEFAULT_MANDATE_GUIDE: MandateGuideState = {
  dismissed: false,
  invasionIssued: false,
}

export function shouldShowMandateGuide(state: GameState): boolean {
  if (state.mandateGuide.dismissed) return false
  return !isMandateComplete(state)
}
