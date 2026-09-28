import { LORE } from './lore'
import type { CombatTutorialState } from './types'

export type CombatBriefingId = 'orbitalDoctrine' | 'orbitalTactical' | 'groundAssault'

export interface CombatBriefingContent {
  id: CombatBriefingId
  title: string
  intro: string
  bullets: string[]
  confirmLabel: string
}

export const COMBAT_BRIEFINGS: Record<CombatBriefingId, CombatBriefingContent> = {
  orbitalDoctrine: {
    id: 'orbitalDoctrine',
    title: 'Orbital approach briefing',
    intro: `Before voidships close with the enemy, set your ${LORE.orbital.doctrineLabel.toLowerCase()}.`,
    bullets: [
      'Each doctrine shifts voidship losses and how strongly your legions fight after orbit is won.',
      'Compare armada projection to the world’s orbital aegis in the strength bars.',
      `Commit with “${LORE.orbital.commit}” to fight the tactical void duel, then deploy legions if the aegis falls.`,
    ],
    confirmLabel: 'Understood — choose doctrine',
  },
  orbitalTactical: {
    id: 'orbitalTactical',
    title: 'Void battle briefing',
    intro: 'Real-time void engagement. Your scouts and frigates answer to your orders.',
    bullets: [
      'Drag to box-select voidships · click open space to move the selection.',
      'Destroy the orbital aegis and its escorts — interceptors will fire back.',
      'Use Pause if you need time to reposition. Victory opens the ground assault.',
    ],
    confirmLabel: 'Engage',
  },
  groundAssault: {
    id: 'groundAssault',
    title: 'Ground assault briefing',
    intro: LORE.battle.assaultSubtitle,
    bullets: [
      'Drag on the field to select legionnaires · Shift+click adds to selection · click terrain to move.',
      'Cover matters: full cover blocks fire; partial cover reduces damage. Hover units for intel.',
      'Squad tools — Hold (H), Suppress (F), Grenade (G), Lance volley (L), Vitae stim (V). Space pauses. Full hotkeys are in the footer.',
    ],
    confirmLabel: 'Deploy legions',
  },
}

export const DEFAULT_COMBAT_TUTORIAL: CombatTutorialState = {
  orbitalDoctrine: false,
  orbitalTactical: false,
  groundAssault: false,
}

export function hasSeenCombatBriefing(
  state: CombatTutorialState,
  id: CombatBriefingId
): boolean {
  return state[id]
}
