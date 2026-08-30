import { create } from 'zustand'
import {
  addToSelection,
  boxSelectUnits,
  getUnitAtPosition,
  issueMoveOrder,
  selectUnits,
  setActiveAbility,
  throwGrenade,
  toggleHoldPosition,
  togglePause,
  updateBattle,
} from '../battle/battleLogic'
import { createBattle } from '../battle/spawnBattle'
import type { BattleState } from '../battle/types'

interface BattleStore {
  battle: BattleState | null
  isDragging: boolean
  startBattle: (
    planetId: string,
    planetName: string,
    enemyColor: string,
    fleetPower: number,
    defenseRating: number
  ) => void
  update: (dt: number) => void
  handleMouseDown: (x: number, y: number, shiftKey: boolean) => void
  handleMouseMove: (x: number, y: number) => void
  handleMouseUp: (x: number, y: number, shiftKey: boolean) => void
  handleCanvasClick: (x: number, y: number) => void
  togglePause: () => void
  toggleHold: () => void
  activateGrenade: () => void
  endBattle: () => void
}

const DRAG_THRESHOLD = 8

export const useBattleStore = create<BattleStore>((set, get) => ({
  battle: null,
  isDragging: false,

  startBattle: (planetId, planetName, enemyColor, fleetPower, defenseRating) => {
    set({
      battle: createBattle(planetId, planetName, enemyColor, fleetPower, defenseRating),
      isDragging: false,
    })
  },

  update: (dt) => {
    const { battle } = get()
    if (!battle || battle.status !== 'active') return
    set({ battle: updateBattle(battle, dt) })
  },

  handleMouseDown: (x, y, shiftKey) => {
    const { battle } = get()
    if (!battle || battle.status !== 'active' || battle.paused) return

    const clicked = getUnitAtPosition(battle, x, y)
    if (clicked?.team === 'player') {
      if (shiftKey) {
        set({ battle: addToSelection(battle, clicked.id) })
      } else {
        set({ battle: selectUnits(battle, [clicked.id]) })
      }
      set({ isDragging: false })
      return
    }

    set({
      isDragging: true,
      battle: {
        ...battle,
        dragSelect: { startX: x, startY: y, endX: x, endY: y },
        selectedUnitIds: shiftKey ? battle.selectedUnitIds : [],
      },
    })
  },

  handleMouseMove: (x, y) => {
    const { battle, isDragging } = get()
    if (!battle?.dragSelect || !isDragging) return

    set({
      battle: {
        ...battle,
        dragSelect: { ...battle.dragSelect, endX: x, endY: y },
      },
    })
  },

  handleMouseUp: (x, y, shiftKey) => {
    const { battle, isDragging } = get()
    if (!battle) return

    if (!isDragging || !battle.dragSelect) {
      set({ isDragging: false })
      return
    }

    const drag = battle.dragSelect
    const dragDist = Math.hypot(drag.endX - drag.startX, drag.endY - drag.startY)

    if (dragDist >= DRAG_THRESHOLD) {
      let next = boxSelectUnits(battle, { ...drag, endX: x, endY: y })
      if (shiftKey) {
        const merged = new Set([...battle.selectedUnitIds, ...next.selectedUnitIds])
        next = { ...next, selectedUnitIds: [...merged] }
      }
      set({ battle: next, isDragging: false })
      return
    }

    // Small drag = click on ground
    set({ isDragging: false, battle: { ...battle, dragSelect: null } })
    get().handleCanvasClick(x, y)
  },

  handleCanvasClick: (x, y) => {
    const { battle } = get()
    if (!battle || battle.status !== 'active' || battle.paused) return

    if (battle.activeAbility === 'grenade') {
      set({ battle: throwGrenade(battle, x, y, 'player') })
      return
    }

    if (battle.selectedUnitIds.length > 0) {
      set({ battle: issueMoveOrder(battle, x, y) })
    }
  },

  togglePause: () => {
    const { battle } = get()
    if (!battle) return
    set({ battle: togglePause(battle) })
  },

  toggleHold: () => {
    const { battle } = get()
    if (!battle || battle.selectedUnitIds.length === 0) return
    set({ battle: toggleHoldPosition(battle) })
  },

  activateGrenade: () => {
    const { battle } = get()
    if (!battle || battle.selectedUnitIds.length === 0) return
    const ability = battle.activeAbility === 'grenade' ? 'none' : 'grenade'
    set({ battle: setActiveAbility(battle, ability) })
  },

  endBattle: () => set({ battle: null, isDragging: false }),
}))
