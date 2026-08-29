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
  getFleetPower,
  getMinimumPopulation,
  getPopulationGrowthModifier,
  getTotalShips,
  subtractResources,
} from '../game/engine'
import { createInitialState } from '../game/initialState'
import type { BuildingType, Fleet, GameState, ShipType } from '../game/types'
import { useBattleStore } from './battleStore'

interface GameActions {
  selectPlanet: (planetId: string) => void
  upgradeBuilding: (planetId: string, buildingType: BuildingType) => void
  buildShip: (shipType: ShipType) => void
  initiateInvasion: (planetId: string) => void
  completeBattle: (planetId: string, survivalRatio: number) => void
  retreatBattle: (planetId: string) => void
  failBattle: (planetId: string) => void
  advanceTick: () => void
  resetGame: () => void
  setEmpireName: (name: string) => void
}

type GameStore = GameState & GameActions

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
  planetId: string
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
      defenseRating: calculatePlanetDefense(conquered),
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

        const cost = getBuildingCost(buildingType, currentLevel)
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
          return { ...updated, defenseRating: calculatePlanetDefense(updated) }
        })

        set({
          resources: subtractResources(state.resources, cost),
          planets,
          events: [
            createEvent(
              'success',
              `Upgraded ${info.name} to level ${currentLevel + 1} on ${planet.name}`
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
              createEvent('warning', 'Build a Shipyard before constructing ships.'),
              ...state.events.slice(0, 49),
            ],
          })
          return
        }

        const cost = SHIP_INFO[shipType].cost
        if (!canAfford(state.resources, cost)) return

        set({
          resources: subtractResources(state.resources, cost),
          fleet: { ...state.fleet, [shipType]: state.fleet[shipType] + 1 },
          events: [
            createEvent('success', `Built a ${SHIP_INFO[shipType].name}`),
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
              createEvent('warning', 'You need ships to attack! Build a fleet first.'),
              ...state.events.slice(0, 49),
            ],
          })
          return
        }

        const faction = target.enemyFaction
          ? ENEMY_FACTIONS.find((f) => f.id === target.enemyFaction)
          : undefined

        useBattleStore.getState().startBattle(
          planetId,
          target.name,
          faction?.color ?? '#ff6b6b',
          getFleetPower(state.fleet),
          target.defenseRating
        )
      },

      completeBattle: (planetId, survivalRatio) => {
        const state = get()
        const target = state.planets.find((p) => p.id === planetId)
        if (!target) return

        const casualtyRate = Math.min(0.7, Math.max(0.1, 1 - survivalRatio * 0.85))
        const newFleet = applyFleetCasualties(state.fleet, casualtyRate)
        let planets = conquerPlanet(state.planets, planetId)
        let gameWon = state.gameWon

        const enemyRemaining = planets.filter((p) => p.owner === 'enemy').length
        if (enemyRemaining === 0) gameWon = true

        const events = [
          createEvent('success', `Victory! ${target.name} has been conquered!`),
          ...state.events.slice(0, 49),
        ]

        if (gameWon) {
          events.unshift(
            createEvent(
              'success',
              'Victory! You have conquered the galaxy and unified all worlds under your empire!'
            )
          )
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
            createEvent('warning', `Retreat from ${planetName}. Ground forces withdrawn.`),
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
            createEvent('danger', `Defeat at ${planetName}. Your assault force was annihilated.`),
            ...state.events.slice(0, 49),
          ],
        })
      },

      advanceTick: () => {
        const state = get()
        if (state.gameWon || state.gameOver) return
        if (useBattleStore.getState().battle?.active) return

        const production = calculateProduction(state.planets)
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
          const growthMod = getPopulationGrowthModifier(p, netProduction.food >= 0)
          let population = p.population

          if (growthMod > 0 && p.population < p.maxPopulation) {
            const growthChance = growthMod >= 1 ? 1 : growthMod >= 0.5 ? 0.5 : 0.25
            if (Math.random() < growthChance) {
              population = Math.min(p.maxPopulation, p.population + 1)
            }
          } else if (netProduction.food < 0 && p.population > minPop) {
            population = Math.max(minPop, p.population - 1)
          }

          return { ...p, population }
        })

        set({
          tickCount: state.tickCount + 1,
          resources,
          planets,
        })
      },

      resetGame: () => set(createInitialState()),

      setEmpireName: (name) => set({ empireName: name }),
    }),
    {
      name: 'galactic-empire-save',
      partialize: (state) => ({
        empireName: state.empireName,
        tickCount: state.tickCount,
        resources: state.resources,
        planets: state.planets,
        fleet: state.fleet,
        selectedPlanetId: state.selectedPlanetId,
        events: state.events,
        gameWon: state.gameWon,
        gameOver: state.gameOver,
      }),
    }
  )
)

export function useProductionRates() {
  const planets = useGameStore((s) => s.planets)
  const production = calculateProduction(planets)
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
  return getFleetPower(fleet)
}

export function useSelectedPlanet() {
  const planets = useGameStore((s) => s.planets)
  const selectedPlanetId = useGameStore((s) => s.selectedPlanetId)
  return planets.find((p) => p.id === selectedPlanetId)
}
