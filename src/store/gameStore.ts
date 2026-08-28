import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { BUILDING_INFO, SHIP_INFO } from '../game/constants'
import {
  applyFleetLosses,
  calculateConsumption,
  calculatePlanetDefense,
  calculateProduction,
  canAfford,
  createEvent,
  getBuildingCost,
  getBuildingLevel,
  getFleetPower,
  getTotalShips,
  resolveCombat,
  subtractResources,
} from '../game/engine'
import { createInitialState } from '../game/initialState'
import type { BuildingType, GameState, ShipType } from '../game/types'

interface GameActions {
  selectPlanet: (planetId: string) => void
  upgradeBuilding: (planetId: string, buildingType: BuildingType) => void
  buildShip: (shipType: ShipType) => void
  attackPlanet: (planetId: string) => void
  advanceTick: () => void
  resetGame: () => void
  setEmpireName: (name: string) => void
}

type GameStore = GameState & GameActions

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

      attackPlanet: (planetId) => {
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

        const result = resolveCombat(state.fleet, target.defenseRating, target.name)
        const newFleet = applyFleetLosses(state.fleet, result.attackerLosses)

        let planets = state.planets
        let gameWon = state.gameWon

        if (result.victory) {
          planets = state.planets.map((p) =>
            p.id === planetId
              ? {
                  ...p,
                  owner: 'player' as const,
                  enemyFaction: undefined,
                  population: Math.floor(p.population * 0.5),
                  defenseRating: calculatePlanetDefense({
                    ...p,
                    owner: 'player',
                  }),
                }
              : p
          )
          const enemyRemaining = planets.filter((p) => p.owner === 'enemy').length
          if (enemyRemaining === 0) {
            gameWon = true
          }
        }

        const eventType = result.victory ? 'success' : 'danger'
        const events = [
          createEvent(eventType, result.message),
          ...state.events.slice(0, 49),
        ]

        if (gameWon) {
          events.unshift(
            createEvent(
              'success',
              '🎉 Victory! You have conquered the galaxy and unified all worlds under your empire!'
            )
          )
        }

        set({ fleet: newFleet, planets, events, gameWon })
      },

      advanceTick: () => {
        const state = get()
        if (state.gameWon || state.gameOver) return

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
          let population = p.population
          if (netProduction.food > 0 && p.population < p.maxPopulation) {
            population = Math.min(p.maxPopulation, p.population + 1)
          } else if (netProduction.food < 0 && p.population > 100) {
            population = Math.max(100, p.population - 1)
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
