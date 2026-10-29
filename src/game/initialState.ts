import { ENEMY_PLANETS, createEnemyPlanet, getPlanetMaxPopulation } from './constants'
import { DEFAULT_CHRONICLE_STATE } from './chronicleMandates'
import { DEFAULT_FRONTIER } from './frontierGeneration'
import { DEFAULT_MANDATE_GUIDE } from './mandateGuide'
import { LORE, OPENING_CHRONICLE } from './lore'
import { PLANET_LORE_NAMES } from './names'
import { FOUNDING_SYSTEM_ID, createInitialStarSystems } from './starSystems'
import type { GameState } from './types'

export function createInitialState(): GameState {
  const homePlanet = {
    id: 'terra-prime',
    name: PLANET_LORE_NAMES['terra-prime'].name,
    type: 'terran' as const,
    owner: 'player' as const,
    systemId: FOUNDING_SYSTEM_ID,
    population: 1000,
    maxPopulation: getPlanetMaxPopulation('terran', 5000),
    buildings: [
      { type: 'extractionHub' as const, level: 1 },
      { type: 'solarArray' as const, level: 1 },
      { type: 'hydroponics' as const, level: 1 },
    ],
    defenseRating: 15,
  }

  const enemyPlanets = ENEMY_PLANETS.map((template) =>
    createEnemyPlanet({ ...template, systemId: FOUNDING_SYSTEM_ID })
  )

  return {
    empireName: LORE.empireDefaultName,
    tickCount: 0,
    resources: {
      minerals: 100,
      energy: 50,
      food: 30,
      credits: 10,
    },
    planets: [homePlanet, ...enemyPlanets],
    fleet: {
      scout: 2,
      frigate: 0,
      destroyer: 0,
      carrier: 0,
    },
    selectedPlanetId: 'terra-prime',
    events: [
      {
        id: 'evt-0',
        timestamp: Date.now(),
        type: 'info',
        message: OPENING_CHRONICLE,
      },
    ],
    research: {
      researched: [],
      current: null,
      progress: 0,
    },
    mandateGuide: { ...DEFAULT_MANDATE_GUIDE },
    chronicle: {
      completed: [...DEFAULT_CHRONICLE_STATE.completed],
      frontierCompleted: [...DEFAULT_CHRONICLE_STATE.frontierCompleted],
      bossesDefeated: DEFAULT_CHRONICLE_STATE.bossesDefeated,
    },
    victoryKind: null,
    gameWon: false,
    gameOver: false,
    frontier: { ...DEFAULT_FRONTIER },
    starSystems: createInitialStarSystems(),
    selectedSystemId: FOUNDING_SYSTEM_ID,
    stellarMapView: 'galaxy',
    victoryBannerDismissed: false,
  }
}
