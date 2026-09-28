import { useEffect, useRef } from 'react'
import { CombatBriefingCard } from './CombatBriefingCard'
import { COMBAT_BRIEFINGS, hasSeenCombatBriefing } from '../game/combatTutorial'
import { useGameStore } from '../store/gameStore'
import {
  addVoidSelection,
  boxSelectVoidShips,
  getVoidShipAt,
  issueVoidMoveOrder,
  selectVoidShips,
  updateOrbitalTactical,
} from '../battle/orbitalTactical/logic'
import { canvasToOrbitalCoords, renderOrbitalTactical } from '../battle/orbitalTactical/renderer'
import type { OrbitalTacticalState } from '../battle/orbitalTactical/types'
import { LORE } from '../game/lore'
import { useBattleStore } from '../store/battleStore'

const DRAG_THRESHOLD = 8

interface Props {
  tactical: OrbitalTacticalState
  onFinished: () => void
}

export function OrbitalTacticalBattle({ tactical, onFinished }: Props) {
  const combatTutorial = useGameStore((s) => s.combatTutorial)
  const dismissCombatBriefing = useGameStore((s) => s.dismissCombatBriefing)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const finishedRef = useRef(false)
  const dragRef = useRef(false)
  const lastTimeRef = useRef(0)
  const briefingPauseRef = useRef(false)

  const tacticalBriefing = COMBAT_BRIEFINGS.orbitalTactical
  const showTacticalBriefing =
    tactical.status === 'active' &&
    !hasSeenCombatBriefing(combatTutorial, 'orbitalTactical')

  const setTactical = (next: OrbitalTacticalState) => {
    useBattleStore.getState().setOrbitalTactical(next)
  }

  useEffect(() => {
    if (tactical.status === 'active') return
    if (finishedRef.current) return
    finishedRef.current = true
    const timer = setTimeout(onFinished, 1200)
    return () => clearTimeout(timer)
  }, [tactical.status, onFinished])

  useEffect(() => {
    if (!showTacticalBriefing || briefingPauseRef.current) return
    briefingPauseRef.current = true
    if (!tactical.paused) {
      setTactical({ ...tactical, paused: true })
    }
  }, [showTacticalBriefing, tactical])

  useEffect(() => {
    let frameId: number
    const loop = (time: number) => {
      const dt = Math.min(0.05, (time - lastTimeRef.current) / 1000)
      lastTimeRef.current = time
      const orbital = useBattleStore.getState().orbital
      const current = orbital?.tactical
      if (current?.status === 'active' && dt > 0) {
        setTactical(updateOrbitalTactical(current, dt))
      }
      frameId = requestAnimationFrame(loop)
    }
    lastTimeRef.current = performance.now()
    frameId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frameId)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let frameId: number
    const draw = () => {
      const t = useBattleStore.getState().orbital?.tactical
      if (t) renderOrbitalTactical(ctx, t)
      frameId = requestAnimationFrame(draw)
    }
    frameId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frameId)
  }, [])

  const getCoords = (clientX: number, clientY: number) =>
    canvasToOrbitalCoords(canvasRef.current!, clientX, clientY, tactical.width, tactical.height)

  const handleMouseDown = (e: React.MouseEvent) => {
    const orbital = useBattleStore.getState().orbital
    const t = orbital?.tactical
    if (!t || t.status !== 'active' || t.paused) return
    const { x, y } = getCoords(e.clientX, e.clientY)
    const hit = getVoidShipAt(t, x, y)
    if (hit?.team === 'player') {
      setTactical(e.shiftKey ? addVoidSelection(t, hit.id) : selectVoidShips(t, [hit.id]))
      dragRef.current = false
      return
    }
    dragRef.current = true
    setTactical({ ...t, dragSelect: { startX: x, startY: y, endX: x, endY: y } })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const t = useBattleStore.getState().orbital?.tactical
    if (!t?.dragSelect || !dragRef.current) return
    const { x, y } = getCoords(e.clientX, e.clientY)
    setTactical({ ...t, dragSelect: { ...t.dragSelect, endX: x, endY: y } })
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    const t = useBattleStore.getState().orbital?.tactical
    if (!t) return
    if (!t.dragSelect || !dragRef.current) {
      dragRef.current = false
      return
    }
    const { x, y } = getCoords(e.clientX, e.clientY)
    const drag = t.dragSelect
    const dist = Math.hypot(drag.endX - drag.startX, drag.endY - drag.startY)
    if (dist >= DRAG_THRESHOLD) {
      setTactical(boxSelectVoidShips(t, { ...drag, endX: x, endY: y }))
    } else {
      setTactical(issueVoidMoveOrder({ ...t, dragSelect: null }, x, y))
    }
    dragRef.current = false
  }

  const playersAlive = tactical.ships.filter((s) => s.team === 'player' && s.health > 0).length
  const enemiesAlive = tactical.ships.filter((s) => s.team === 'enemy' && s.health > 0).length

  const confirmTacticalBriefing = () => {
    dismissCombatBriefing('orbitalTactical')
    const current = useBattleStore.getState().orbital?.tactical
    if (current?.paused) {
      setTactical({ ...current, paused: false })
    }
  }

  return (
    <div className="orbital-tactical">
      {showTacticalBriefing && (
        <CombatBriefingCard
          title={tacticalBriefing.title}
          intro={tacticalBriefing.intro}
          bullets={tacticalBriefing.bullets}
          confirmLabel={tacticalBriefing.confirmLabel}
          onConfirm={confirmTacticalBriefing}
        />
      )}
      <div className="orbital-tactical-hud">
        <span>Armada wings: {playersAlive}</span>
        <span style={{ color: tactical.enemyColor }}>Hostile interceptors: {enemiesAlive}</span>
        <span>
          Aegis: {Math.ceil(tactical.aegisHp)} / {tactical.aegisMaxHp}
        </span>
        <button
          type="button"
          className="btn btn-ability"
          onClick={() => setTactical({ ...tactical, paused: !tactical.paused })}
        >
          {tactical.paused ? 'Resume' : 'Pause'}
        </button>
      </div>
      <p className="orbital-tactical-hint">
        Drag to select voidships · Click to move · Destroy the orbital aegis (and its escorts) to
        open the ground assault
      </p>
      <canvas
        ref={canvasRef}
        className="orbital-tactical-canvas"
        width={tactical.width}
        height={tactical.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={(e) => e.preventDefault()}
      />
      {tactical.status === 'victory' && (
        <div className="orbital-tactical-result victory">Orbital aegis breached</div>
      )}
      {tactical.status === 'defeat' && (
        <div className="orbital-tactical-result defeat">{LORE.battle.defeat}</div>
      )}
    </div>
  )
}
