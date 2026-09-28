import { PLANET_TYPE_INFO } from './constants'
import { createEvent } from './engine'
import { LORE } from './lore'
import { TECHS, type TechBranch } from './research'
import type {
  ChronicleMandateId,
  FrontierChronicleMandateId,
  GameEvent,
  GameState,
  Resources,
  VictoryKind,
} from './types'

export type { ChronicleMandateId, VictoryKind }

export const MASTERY_MANDATE_COUNT = 3

export const DEFAULT_CHRONICLE_STATE = {
  completed: [] as ChronicleMandateId[],
  frontierCompleted: [] as FrontierChronicleMandateId[],
  bossesDefeated: 0,
}

export interface ChronicleMandateDef {
  id: ChronicleMandateId
  title: string
  description: string
  icon: string
  rewardMarks: number
  getProgress: (state: GameState) => { current: number; target: number }
}

function playerPlanets(state: GameState) {
  return state.planets.filter((p) => p.owner === 'player')
}

function farmingWorldCount(state: GameState): number {
  return playerPlanets(state).filter(
    (p) => PLANET_TYPE_INFO[p.type].specialization === 'farming'
  ).length
}

function researchedBranches(state: GameState): number {
  const branches = new Set<TechBranch>()
  for (const id of state.research.researched) {
    const tech = TECHS[id as keyof typeof TECHS]
    if (tech) branches.add(tech.branch)
  }
  return branches.size
}

export const CHRONICLE_MANDATES: ChronicleMandateDef[] = [
  {
    id: 'vitaeBelt',
    title: 'Vitae Belt Secured',
    description: 'Hold three throne-worlds devoted to sustenance agriculture.',
    icon: '🌾',
    rewardMarks: 35,
    getProgress: (s) => ({ current: farmingWorldCount(s), target: 3 }),
  },
  {
    id: 'noosphericTriad',
    title: 'Noospheric Triad',
    description: 'Prove mastery across Industry, Void Warfare, and Noospheric Sciences.',
    icon: '🧠',
    rewardMarks: 40,
    getProgress: (s) => ({ current: researchedBranches(s), target: 3 }),
  },
  {
    id: 'heliosThrone',
    title: 'Helios Megacity',
    description: `Raise ${LORE.homePlanetName} to two thousand souls under Throne law.`,
    icon: '🏛️',
    rewardMarks: 30,
    getProgress: (s) => {
      const home = s.planets.find((p) => p.id === 'terra-prime')
      return { current: home?.population ?? 0, target: 2000 }
    },
  },
  {
    id: 'voidDominance',
    title: 'Void Dominance',
    description: 'Field three Obelisk Destroyers and one Sovereign Carrier in the armada.',
    icon: '🛸',
    rewardMarks: 45,
    getProgress: (s) => {
      const destroyers = Math.min(3, s.fleet.destroyer)
      const carriers = Math.min(1, s.fleet.carrier)
      const combined = destroyers + carriers
      return { current: combined, target: 4 }
    },
  },
  {
    id: 'stellarReach',
    title: 'Stellar Reach',
    description: 'Annex five worlds to the Solar Ascendancy.',
    icon: '☀️',
    rewardMarks: 50,
    getProgress: (s) => ({ current: playerPlanets(s).length, target: 5 }),
  },
]

export function isMandateComplete(def: ChronicleMandateDef, state: GameState): boolean {
  const { current, target } = def.getProgress(state)
  return current >= target
}

export function getChronicleMandateViews(state: GameState) {
  return CHRONICLE_MANDATES.map((def) => {
    const { current, target } = def.getProgress(state)
    const done = state.chronicle.completed.includes(def.id) || current >= target
    return {
      ...def,
      current,
      target,
      done,
      percent: Math.min(100, Math.floor((current / Math.max(1, target)) * 100)),
    }
  })
}

export interface ChronicleSyncResult {
  chronicle: { completed: ChronicleMandateId[] }
  resources: Resources
  events: GameEvent[]
  gameWon: boolean
  victoryKind: VictoryKind | null
  victoryBannerDismissed?: boolean
}

export function syncChronicleMandates(state: GameState): ChronicleSyncResult {
  let chronicle = { ...state.chronicle, completed: [...state.chronicle.completed] }
  let resources = { ...state.resources }
  let events = [...state.events]
  let gameWon = state.gameWon
  let victoryKind = state.victoryKind

  for (const def of CHRONICLE_MANDATES) {
    if (chronicle.completed.includes(def.id)) continue
    if (!isMandateComplete(def, state)) continue

    chronicle.completed.push(def.id)
    resources = {
      ...resources,
      credits: resources.credits + def.rewardMarks,
    }
    events = [
      createEvent(
        'success',
        `Chronicle fulfilled: ${def.title}. +${def.rewardMarks} sovereign marks inscribed.`
      ),
      ...events.slice(0, 49),
    ]
  }

  let victoryBannerDismissed: boolean | undefined

  if (
    !gameWon &&
    chronicle.completed.length >= MASTERY_MANDATE_COUNT &&
    victoryKind !== 'mastery'
  ) {
    gameWon = true
    victoryKind = 'mastery'
    victoryBannerDismissed = false
    events = [
      createEvent('success', MASTERY_CHRONICLE),
      ...events.slice(0, 49),
    ]
  }

  return { chronicle, resources, events, gameWon, victoryKind, victoryBannerDismissed }
}

export const MASTERY_CHRONICLE =
  'Mandate of Mastery proclaimed. The Golden Age flourishes through innovation and dominion — ' +
  'and the cartographers stand ready to chart infinite void frontiers beyond this triumph.'
