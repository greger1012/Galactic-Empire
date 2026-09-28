import { createEvent } from './engine'
import type {
  FrontierChronicleMandateId,
  GameEvent,
  GameState,
  Resources,
} from './types'

export const DEFAULT_FRONTIER_CHRONICLE_COMPLETED: FrontierChronicleMandateId[] = []

export interface FrontierChronicleDef {
  id: FrontierChronicleMandateId
  title: string
  description: string
  icon: string
  rewardMarks: number
  getProgress: (state: GameState) => { current: number; target: number }
}

function proceduralHoldings(state: GameState): number {
  return state.planets.filter((p) => p.owner === 'player' && p.procedural).length
}

export const FRONTIER_CHRONICLES: FrontierChronicleDef[] = [
  {
    id: 'firstHorizon',
    title: 'First Horizon Charted',
    description: 'Push beyond the founding sector and chart Void Frontier 1.',
    icon: '🧭',
    rewardMarks: 40,
    getProgress: (s) => ({
      current: Math.min(s.frontier.wave, 1),
      target: 1,
    }),
  },
  {
    id: 'apexHunter',
    title: 'Apex Hunter',
    description: 'Shatter three Void Regent apex bastions across the frontier.',
    icon: '👑',
    rewardMarks: 55,
    getProgress: (s) => ({
      current: Math.min(s.chronicle.bossesDefeated, 3),
      target: 3,
    }),
  },
  {
    id: 'deepVoidMandate',
    title: 'Deep Void Mandate',
    description: 'Clear five full frontier waves — enter the mid-void expanse.',
    icon: '🕳️',
    rewardMarks: 70,
    getProgress: (s) => ({
      current: Math.min(s.frontier.wave, 5),
      target: 5,
    }),
  },
  {
    id: 'outerDominion',
    title: 'Outer Dominion',
    description: 'Hold three annexed procedural worlds under Throne law.',
    icon: '🌌',
    rewardMarks: 60,
    getProgress: (s) => ({
      current: Math.min(proceduralHoldings(s), 3),
      target: 3,
    }),
  },
]

export function getFrontierChronicleViews(state: GameState) {
  return FRONTIER_CHRONICLES.map((def) => {
    const { current, target } = def.getProgress(state)
    const done =
      state.chronicle.frontierCompleted.includes(def.id) || current >= target
    return {
      ...def,
      current,
      target,
      done,
      percent: Math.min(100, Math.floor((current / Math.max(1, target)) * 100)),
    }
  })
}

export interface FrontierChronicleSyncResult {
  chronicle: GameState['chronicle']
  resources: Resources
  events: GameEvent[]
}

export function syncFrontierChronicles(state: GameState): FrontierChronicleSyncResult {
  let chronicle = {
    ...state.chronicle,
    completed: [...state.chronicle.completed],
    frontierCompleted: [...state.chronicle.frontierCompleted],
    bossesDefeated: state.chronicle.bossesDefeated,
  }
  let resources = { ...state.resources }
  let events = [...state.events]

  for (const def of FRONTIER_CHRONICLES) {
    if (chronicle.frontierCompleted.includes(def.id)) continue
    const { current, target } = def.getProgress(state)
    if (current < target) continue

    chronicle.frontierCompleted.push(def.id)
    resources = {
      ...resources,
      credits: resources.credits + def.rewardMarks,
    }
    events = [
      createEvent(
        'success',
        `Void chronicle fulfilled: ${def.title}. +${def.rewardMarks} sovereign marks inscribed.`
      ),
      ...events.slice(0, 49),
    ]
  }

  return { chronicle, resources, events }
}

export function isFrontierChronicleUnlocked(state: GameState): boolean {
  return state.frontier.wave > 0 || state.chronicle.frontierCompleted.length > 0
}
