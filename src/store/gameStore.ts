import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { BUILDING_INFO, ENEMY_FACTIONS, PLANET_TYPE_INFO, SHIP_INFO, getPlanetMaxPopulation } from '../game/constants'
import {
  calculateConsumption,
  calculatePlanetDefense,
  calculateProduction,
  canAfford,
  createEvent,
  getBuildingCost,
  getBuildingLevel,
  getEffectiveMaxPopulation,
  getFleetPower,
  getMinimumPopulation,
  getPopulationGrowthModifier,
  getShipCost,
  getThroneNodeLevels,
  getTotalShips,
  subtractResources,
} from '../game/engine'
import { createInitialState } from '../game/initialState'
import { WIN_CHRONICLE } from '../game/lore'
import {
  TECHS,
  calculateResearchRate,
  canResearch,
  getTechModifiers,
  type TechId,
} from '../game/research'
import type { BuildingType, Fleet, GameState, ShipType } from '../game/types'
import { useBattleStore } from './battleStore'

interface GameActions {
  selectPlanet: (planetId: string) => void
  upgradeBuilding: (planetId: string, buildingType: BuildingType) => void
  buildShip: (shipType: ShipType) => void
  startResearch: (techId: TechId) => void
  initiateInvasion: (planetId: string) => void
  completeBattle: (planetId: string, survivalRatio: number) => void
  retreatBattle: (planetId: string) => void
  failBattle: (planetId: string) => void
  advanceTick: () => void
  resetGame: () => void
  setEmpireName: (name: string) => void
}

type GameStore = GameState & GameActions

const DEFAULT_RESEARCH: GameState['research'] = { researched: [], current: null, progress: 0 }

function applyFleetCasualties(fleet: Fleet, casualtyRate: number): Fleet {
  const result = { ...fleet }
  for (const type of Object.keys(result) as ShipType[]) {
    const loss = Math.floor(result[type] * casualtyRate)
    result[type] = Math.max(0, result[type] - loss)
  }
  return result
}

function conquerPlanet(
  planets: GameState['planets'],
  planetId: string,
  mods: ReturnType<typeof getTechModifiers>
): GameState['planets'] {
  return planets.map((p) => {
    if (p.id !== planetId) return p
    const conquered = {
      ...p,
      owner: 'player' as const,
      enemyFaction: undefined,
      population: Math.max(
        getMinimumPopulation(p),
        Math.floor(p.population * (0.35 + PLANET_TYPE_INFO[p.type].survivability * 0.25))
      ),
      maxPopulation: getPlanetMaxPopulation(p.type, Math.max(p.maxPopulation, 3000)),
    }
    return {
      ...conquered,
      defenseRating: calculatePlanetDefense(conquered, mods),
    }
  })
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...createInitialState(),

      selectPlanet: (planetId) => set({ selectedPlanetId: planetId }),

      upgradeBuilding: (planetId, buildingType) => {
        const state = get()
        const planet = state.planets.find((p) => p.id === planetId)
        if (!planet || planet.owner !== 'player') return

        const currentLevel = getBuildingLevel(planet, buildingType)
        const info = BUILDING_INFO[buildingType]
        if (currentLevel >= info.maxLevel) return

        const mods = getTechModifiers(state.research.researched)
        const cost = getBuildingCost(buildingType, currentLevel, mods)
        if (!canAfford(state.resources, cost)) return

        const planets = state.planets.map((p) => {
          if (p.id !== planetId) return p
          const existing = p.buildings.find((b) => b.type === buildingType)
          const buildings = existing
            ? p.buildings.map((b) =>
                b.type === buildingType ? { ...b, level: b.level + 1 } : b
              )
            : [...p.buildings, { type: buildingType, level: 1 }]
          const updated = { ...p, buildings }
          return { ...updated, defenseRating: calculatePlanetDefense(updated, mods) }
        })

        set({
          resources: subtractResources(state.resources, cost),
          planets,
          events: [
            createEvent(
              'success',
              `Infrastructure upgraded: ${info.name} now at tier ${currentLevel + 1} on ${planet.name}.`
            ),
            ...state.events.slice(0, 49),
          ],
        })
      },

      buildShip: (shipType) => {
        const state = get()
        const shipyards = state.planets
          .filter((p) => p.owner === 'player')
          .reduce((sum, p) => sum + getBuildingLevel(p, 'shipyard'), 0)

        if (shipyards === 0) {
          set({
            events: [
              createEvent(
                'warning',
                'No Void Forge Annexe detected. Construct one before commissioning voidships.'
              ),
              ...state.events.slice(0, 49),
            ],
          })
          return
        }

        const cost = getShipCost(shipType, getTechModifiers(state.research.researched))
        if (!canAfford(state.resources, cost)) return

        set({
          resources: subtractResources(state.resources, cost),
          fleet: { ...state.fleet, [shipType]: state.fleet[shipType] + 1 },
          events: [
            createEvent('success', `${SHIP_INFO[shipType].name} commissioned into the armada.`),
            ...state.events.slice(0, 49),
          ],
        })
      },

      startResearch: (techId) => {
        const state = get()
        const tech = TECHS[techId]
        if (!tech || !canResearch(tech, state.research.researched)) return
        if (state.research.current === techId) return

        set({
          research: { ...state.research, current: techId, progress: 0 },
          events: [
            createEvent('info', `Noospheric inquiry begun: ${tech.name}.`),
            ...state.events.slice(0, 49),
          ],
        })
      },

      initiateInvasion: (planetId) => {
        const state = get()
        const target = state.planets.find((p) => p.id === planetId)
        if (!target || target.owner !== 'enemy') return

        const totalShips = getTotalShips(state.fleet)
        if (totalShips === 0) {
          set({
            events: [
              createEvent(
                'warning',
                'The void armada stands empty. Commission voidships before issuing a mandate of conquest.'
              ),
              ...state.events.slice(0, 49),
            ],
          })
          return
        }

        const faction = target.enemyFaction
          ? ENEMY_FACTIONS.find((f) => f.id === target.enemyFaction)
          : undefined

        const mods = getTechModifiers(state.research.researched)
        useBattleStore.getState().startBattle({
          planetId,
          planetName: target.name,
          planetType: target.type,
          enemyColor: faction?.color ?? '#ff6b6b',
          fleetPower: getFleetPower(state.fleet, mods),
          defenseRating: target.defenseRating,
          mods,
        })
      },

      completeBattle: (planetId, survivalRatio) => {
        const state = get()
        const target = state.planets.find((p) => p.id === planetId)
        if (!target) return

        const casualtyRate = Math.min(0.7, Math.max(0.1, 1 - survivalRatio * 0.85))
        const newFleet = applyFleetCasualties(state.fleet, casualtyRate)
        const planets = conquerPlanet(
          state.planets,
          planetId,
          getTechModifiers(state.research.researched)
        )
        let gameWon = state.gameWon

        const enemyRemaining = planets.filter((p) => p.owner === 'enemy').length
        if (enemyRemaining === 0) gameWon = true

        const events = [
          createEvent(
            'success',
            `Mandate secured. ${target.name} now acknowledges Throne law.`
          ),
          ...state.events.slice(0, 49),
        ]

        if (gameWon) {
          events.unshift(createEvent('success', WIN_CHRONICLE))
        }

        set({ fleet: newFleet, planets, events, gameWon })
      },

      retreatBattle: (planetId) => {
        const state = get()
        const target = state.planets.find((p) => p.id === planetId)
        const planetName = target?.name ?? 'the planet'

        const newFleet = applyFleetCasualties(state.fleet, 0.35)
        useBattleStore.getState().endBattle()

        set({
          fleet: newFleet,
          events: [
            createEvent(
              'warning',
              `Strategic withdrawal from ${planetName}. Ground legions recalled to the void.`
            ),
            ...state.events.slice(0, 49),
          ],
        })
      },

      failBattle: (planetId) => {
        const state = get()
        const target = state.planets.find((p) => p.id === planetId)
        const planetName = target?.name ?? 'the planet'

        const newFleet = applyFleetCasualties(state.fleet, 0.75)

        set({
          fleet: newFleet,
          events: [
            createEvent(
              'danger',
              `Mandate broken at ${planetName}. The assault cadre has been annihilated.`
            ),
            ...state.events.slice(0, 49),
          ],
        })
      },

      advanceTick: () => {
        const state = get()
        if (state.gameWon || state.gameOver) return
        if (useBattleStore.getState().battle?.active) return

        const mods = getTechModifiers(state.research.researched)
        const production = calculateProduction(state.planets, mods)
        const consumption = calculateConsumption(state.planets)

        const netProduction = {
          minerals: production.minerals - consumption.minerals,
          energy: production.energy - consumption.energy,
          food: production.food - consumption.food,
          credits: production.credits - consumption.credits,
        }

        const resources = {
          minerals: Math.max(0, state.resources.minerals + netProduction.minerals),
          energy: Math.max(0, state.resources.energy + netProduction.energy),
          food: Math.max(0, state.resources.food + netProduction.food),
          credits: Math.max(0, state.resources.credits + netProduction.credits),
        }

        const planets = state.planets.map((p) => {
          if (p.owner !== 'player') return p

          const minPop = getMinimumPopulation(p)
          const maxPop = getEffectiveMaxPopulation(p, mods)
          const growthMod = getPopulationGrowthModifier(p, netProduction.food >= 0)
          let population = p.population

          if (growthMod > 0 && p.population < maxPop) {
            const growthChance = growthMod >= 1 ? 1 : growthMod >= 0.5 ? 0.5 : 0.25
            if (Math.random() < growthChance) {
              population = Math.min(maxPop, p.population + 1)
            }
          } else if (netProduction.food < 0 && p.population > minPop) {
            population = Math.max(minPop, p.population - 1)
          }

          return { ...p, population }
        })

        let research = state.research
        let events = state.events
        if (research.current) {
          const tech = TECHS[research.current as TechId]
          const rate = calculateResearchRate(getThroneNodeLevels(state.planets), mods)
          const progress = research.progress + rate

          if (tech && progress >= tech.cost) {
            const researched = [...research.researched, tech.id]
            const newMods = getTechModifiers(researched)
            research = { researched, current: null, progress: 0 }
            events = [
              createEvent('success', `Breakthrough: ${tech.name}. ${tech.effect}.`),
              ...events.slice(0, 49),
            ]
            if (newMods.defenseMult !== mods.defenseMult) {
              for (let i = 0; i < planets.length; i++) {
                if (planets[i].owner === 'player') {
                  planets[i] = {
                    ...planets[i],
                    defenseRating: calculatePlanetDefense(planets[i], newMods),
                  }
                }
              }
            }
          } else {
            research = { ...research, progress }
          }
        }

        set({
          tickCount: state.tickCount + 1,
          resources,
          planets,
          research,
          events,
        })
      },

      resetGame: () => set(createInitialState()),

      setEmpireName: (name) => set({ empireName: name }),
    }),
    {
      name: 'galactic-empire-save-v2',
      partialize: (state) => ({
        empireName: state.empireName,
        tickCount: state.tickCount,
        resources: state.resources,
        planets: state.planets,
        fleet: state.fleet,
        selectedPlanetId: state.selectedPlanetId,
        events: state.events,
        research: state.research,
        gameWon: state.gameWon,
        gameOver: state.gameOver,
      }),
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<GameState>
        return {
          ...current,
          ...saved,
          research: saved.research ?? DEFAULT_RESEARCH,
        }
      },
    }
  )
)

export function useTechModifiers() {
  const researched = useGameStore((s) => s.research.researched)
  return getTechModifiers(researched)
}

export function useProductionRates() {
  const planets = useGameStore((s) => s.planets)
  const mods = useTechModifiers()
  const production = calculateProduction(planets, mods)
  const consumption = calculateConsumption(planets)
  return {
    minerals: production.minerals - consumption.minerals,
    energy: production.energy - consumption.energy,
    food: production.food - consumption.food,
    credits: production.credits - consumption.credits,
  }
}

export function useFleetPower() {
  const fleet = useGameStore((s) => s.fleet)
  const mods = useTechModifiers()
  return getFleetPower(fleet, mods)
}

export function useResearchRate() {
  const planets = useGameStore((s) => s.planets)
  const mods = useTechModifiers()
  return calculateResearchRate(getThroneNodeLevels(planets), mods)
}

export function useSelectedPlanet() {
  const planets = useGameStore((s) => s.planets)
  const selectedPlanetId = useGameStore((s) => s.selectedPlanetId)
  return planets.find((p) => p.id === selectedPlanetId)
}
