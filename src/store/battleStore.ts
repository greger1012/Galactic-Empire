import { create } from 'zustand'
import {
  activateSuppressiveFire,
  applyVitaeStim,
  throwLanceVolley,
} from '../battle/abilities'
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
import {
  getOrbitalFleetLosses,
  type OrbitalDoctrine,
} from '../battle/orbitalEngagement'
import { resolveOrbitalFromTactical } from '../battle/orbitalTactical/resolveFromTactical'
import { createOrbitalTacticalBattle } from '../battle/orbitalTactical/spawn'
import type { OrbitalTacticalState } from '../battle/orbitalTactical/types'
import { createBattle, type BattleSetup } from '../battle/spawnBattle'
import type { BattleState } from '../battle/types'
import { getFleetPower, getTotalShips } from '../game/engine'
import { getTechModifiers } from '../game/research'
import { useGameStore } from './gameStore'

export interface OrbitalPhaseState {
  active: true
  phase: 'doctrine' | 'tactical' | 'results'
  pendingSetup: BattleSetup
  originalDefenseRating: number
  doctrine: OrbitalDoctrine
  tactical: OrbitalTacticalState | null
  result: ReturnType<typeof resolveOrbitalFromTactical> | null
}

interface BattleStore {
  battle: BattleState | null
  orbital: OrbitalPhaseState | null
  isDragging: boolean
  startOrbital: (setup: BattleSetup, originalDefenseRating: number) => void
  setOrbitalDoctrine: (doctrine: OrbitalDoctrine) => void
  commitOrbitalAssault: () => void
  finishOrbitalTactical: () => void
  setOrbitalTactical: (tactical: OrbitalTacticalState) => void
  proceedToGroundAssault: () => void
  cancelOrbital: () => void
  startBattle: (setup: BattleSetup) => void
  update: (dt: number) => void
  handleMouseDown: (x: number, y: number, shiftKey: boolean) => void
  handlePointerMove: (x: number, y: number) => void
  clearHover: () => void
  handleMouseUp: (x: number, y: number, shiftKey: boolean) => void
  handleCanvasClick: (x: number, y: number) => void
  togglePause: () => void
  toggleHold: () => void
  activateGrenade: () => void
  activateSuppressiveFire: () => void
  activateLanceVolley: () => void
  activateVitaeStim: () => void
  endBattle: () => void
}

const DRAG_THRESHOLD = 8

export const useBattleStore = create<BattleStore>((set, get) => ({
  battle: null,
  orbital: null,
  isDragging: false,

  startOrbital: (setup, originalDefenseRating) => {
    set({
      orbital: {
        active: true,
        phase: 'doctrine',
        pendingSetup: setup,
        originalDefenseRating,
        doctrine: 'balanced',
        tactical: null,
        result: null,
      },
      battle: null,
      isDragging: false,
    })
  },

  setOrbitalDoctrine: (doctrine) => {
    const { orbital } = get()
    if (!orbital) return
    set({ orbital: { ...orbital, doctrine } })
  },

  commitOrbitalAssault: () => {
    const { orbital } = get()
    if (!orbital || orbital.phase !== 'doctrine') return

    const game = useGameStore.getState()
    const mods = getTechModifiers(game.research.researched)
    const setup = orbital.pendingSetup
    const tactical = createOrbitalTacticalBattle(
      setup.planetName,
      orbital.originalDefenseRating,
      game.fleet,
      orbital.doctrine,
      mods,
      setup.enemyColor
    )

    set({
      orbital: {
        ...orbital,
        phase: 'tactical',
        tactical,
      },
    })
  },

  setOrbitalTactical: (tactical) => {
    const { orbital } = get()
    if (!orbital) return
    set({ orbital: { ...orbital, tactical } })
  },

  finishOrbitalTactical: () => {
    const { orbital } = get()
    if (!orbital?.tactical) return

    const game = useGameStore.getState()
    const mods = getTechModifiers(game.research.researched)
    const result = resolveOrbitalFromTactical(
      orbital.tactical,
      orbital.originalDefenseRating,
      game.fleet,
      mods
    )
    const losses = getOrbitalFleetLosses(game.fleet, result.fleetLossRate)
    game.applyOrbitalEngagementResult(losses, result, orbital.pendingSetup.planetName)

    const fleetAfter = useGameStore.getState().fleet
    if (getTotalShips(fleetAfter) === 0) {
      useGameStore.getState().cancelOrbitalApproachAfterAnnihilation(orbital.pendingSetup.planetName)
      set({ orbital: null })
      return
    }

    set({
      orbital: {
        ...orbital,
        phase: 'results',
        tactical: null,
        result,
      },
    })
  },

  proceedToGroundAssault: () => {
    const { orbital } = get()
    if (!orbital?.result) return

    const game = useGameStore.getState()
    if (getTotalShips(game.fleet) === 0) {
      game.cancelOrbitalApproachAfterAnnihilation(orbital.pendingSetup.planetName)
      set({ orbital: null })
      return
    }
    const mods = getTechModifiers(game.research.researched)
    const result = orbital.result
    const setup = orbital.pendingSetup
    const groundDefense = Math.max(
      8,
      Math.floor(orbital.originalDefenseRating * (1 - result.defenseSuppression))
    )

    set({
      battle: createBattle({
        ...setup,
        fleetPower: getFleetPower(game.fleet, mods),
        defenseRating: groundDefense,
        deploymentMult: result.deploymentMult,
        legionDamageMult: result.legionDamageMult,
        orbitalChronicle: result.chronicle,
      }),
      orbital: null,
      isDragging: false,
    })
  },

  cancelOrbital: () => {
    useGameStore.getState().cancelOrbitalApproach()
    set({ orbital: null, isDragging: false })
  },

  startBattle: (setup) => {
    set({ battle: createBattle(setup), isDragging: false, orbital: null })
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

  handlePointerMove: (x, y) => {
    const { battle, isDragging } = get()
    if (!battle) return

    if (isDragging && battle.dragSelect) {
      set({
        battle: {
          ...battle,
          dragSelect: { ...battle.dragSelect, endX: x, endY: y },
        },
      })
      return
    }

    const hit = getUnitAtPosition(battle, x, y)
    const hoveredId =
      hit && hit.state !== 'dead' && hit.state !== 'dying' ? hit.id : null
    if (hoveredId !== battle.hoveredUnitId) {
      set({ battle: { ...battle, hoveredUnitId: hoveredId } })
    }
  },

  clearHover: () => {
    const { battle } = get()
    if (!battle?.hoveredUnitId) return
    set({ battle: { ...battle, hoveredUnitId: null } })
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

    if (battle.activeAbility === 'lanceVolley') {
      set({ battle: throwLanceVolley(battle, x, y) })
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

  activateSuppressiveFire: () => {
    const { battle } = get()
    if (!battle || battle.selectedUnitIds.length === 0) return
    set({ battle: activateSuppressiveFire(battle) })
  },

  activateLanceVolley: () => {
    const { battle } = get()
    if (!battle || battle.squadCooldowns.lanceVolley > 0) return
    const ability = battle.activeAbility === 'lanceVolley' ? 'none' : 'lanceVolley'
    set({ battle: setActiveAbility(battle, ability) })
  },

  activateVitaeStim: () => {
    const { battle } = get()
    if (!battle || battle.selectedUnitIds.length === 0) return
    set({ battle: applyVitaeStim(battle) })
  },

  endBattle: () => set({ battle: null, isDragging: false }),
}))
