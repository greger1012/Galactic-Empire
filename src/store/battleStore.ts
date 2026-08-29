import { create } from 'zustand'
import {
  getUnitAtPosition,
  issueMoveOrder,
  selectUnit,
  updateBattle,
} from '../battle/battleLogic'
import { createBattle } from '../battle/spawnBattle'
import type { BattleState } from '../battle/types'

interface BattleStore {
  battle: BattleState | null
  startBattle: (
    planetId: string,
    planetName: string,
    enemyColor: string,
    fleetPower: number,
    defenseRating: number
  ) => void
  update: (dt: number) => void
  handleClick: (x: number, y: number) => void
  endBattle: () => void
}

export const useBattleStore = create<BattleStore>((set, get) => ({
  battle: null,

  startBattle: (planetId, planetName, enemyColor, fleetPower, defenseRating) => {
    set({
      battle: createBattle(planetId, planetName, enemyColor, fleetPower, defenseRating),
    })
  },

  update: (dt) => {
    const { battle } = get()
    if (!battle || battle.status !== 'active') return
    set({ battle: updateBattle(battle, dt) })
  },

  handleClick: (x, y) => {
    const { battle } = get()
    if (!battle || battle.status !== 'active') return

    const clicked = getUnitAtPosition(battle, x, y)
    if (clicked?.team === 'player') {
      set({ battle: selectUnit(battle, clicked.id) })
      return
    }

    if (battle.selectedUnitId) {
      set({ battle: issueMoveOrder(battle, x, y) })
    }
  },

  endBattle: () => set({ battle: null }),
}))
