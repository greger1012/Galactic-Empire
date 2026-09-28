import { LORE } from './lore'
import type { TutorialState } from './types'

export type TutorialStepId =
  | 'welcome'
  | 'mandateCycles'
  | 'throneWorld'
  | 'voidArmada'
  | 'stellarCartograph'
  | 'firstMandate'
  | 'ready'

export interface TutorialStep {
  id: TutorialStepId
  title: string
  body: string
  /** Matches `data-tutorial-id` on a panel for spotlight */
  highlight?: string
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Warden of the Iron Sun',
    body:
      `You command the ${LORE.empireDefaultName} from ${LORE.homePlanetName}. ` +
      'This briefing walks the throne-interface in a few minutes. You can replay it anytime from the footer.',
  },
  {
    id: 'mandateCycles',
    title: 'Mandate cycles & resources',
    highlight: 'resource-bar',
    body:
      `Time advances in ${LORE.cycleLabel.toLowerCase()}s while you play. Watch Adamant, Lumin, Sustenance, and Sovereign Marks ` +
      'at the top — buildings on your worlds produce them each cycle. Hover a resource for its meaning.',
  },
  {
    id: 'throneWorld',
    title: 'Develop your throne world',
    highlight: 'planet-panel',
    body:
      'The planetary panel lists structures you can raise or upgrade. Start with a Throne Node (command center) for Noospheric insight, ' +
      'then orbital drydocks when you are ready to expand the void armada. Costs are paid from your imperial stockpile.',
  },
  {
    id: 'voidArmada',
    title: 'Armada & inquiry',
    highlight: 'fleet-research',
    body:
      'Commission voidships in the Void Forge panel. Direct Noospheric inquiry in the research panel — insight flows from Throne Node tiers and tech.',
  },
  {
    id: 'stellarCartograph',
    title: 'Stellar Cartograph',
    highlight: 'galaxy-panel',
    body:
      'The cartograph shows contested worlds around the Iron Sun. Drag to pan and scroll to zoom. Select a world, then issue a Mandate of Conquest when your armada is ready.',
  },
  {
    id: 'firstMandate',
    title: 'First Mandate Briefing',
    highlight: 'mandate-guide',
    body:
      'The checklist below tracks your opening objectives: infrastructure, a voidship beyond your scouts, your first assault, and research. ' +
      'Highlighted panels match the current objective.',
  },
  {
    id: 'ready',
    title: 'The mandate is yours',
    body:
      'Rival factions pulse every 15 cycles. Chronicle mandates reward long victories; after the founding sector, procedural void frontiers await. ' +
      'Begin when you are ready — the First Mandate Briefing will guide your next clicks.',
  },
]

export const DEFAULT_TUTORIAL: TutorialState = {
  completed: false,
  stepIndex: 0,
}

export function getTutorialStep(state: TutorialState): TutorialStep {
  const index = Math.min(Math.max(0, state.stepIndex), TUTORIAL_STEPS.length - 1)
  return TUTORIAL_STEPS[index]
}

export function shouldPauseTicksForTutorial(state: TutorialState): boolean {
  return !state.completed
}
