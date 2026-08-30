import { useEffect, useRef } from 'react'
import { LORE } from '../game/lore'
import { getSurvivalRatio } from '../battle/battleLogic'
import { canvasToBattleCoords, renderBattle } from '../battle/battleRenderer'
import { useBattleStore } from '../store/battleStore'
import { useGameStore } from '../store/gameStore'

export function BattleOverlay() {
  const battle = useBattleStore((s) => s.battle)
  const update = useBattleStore((s) => s.update)
  const handleMouseDown = useBattleStore((s) => s.handleMouseDown)
  const handleMouseMove = useBattleStore((s) => s.handleMouseMove)
  const handleMouseUp = useBattleStore((s) => s.handleMouseUp)
  const togglePause = useBattleStore((s) => s.togglePause)
  const toggleHold = useBattleStore((s) => s.toggleHold)
  const activateGrenade = useBattleStore((s) => s.activateGrenade)
  const endBattle = useBattleStore((s) => s.endBattle)
  const completeBattle = useGameStore((s) => s.completeBattle)
  const failBattle = useGameStore((s) => s.failBattle)
  const retreatBattle = useGameStore((s) => s.retreatBattle)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lastTimeRef = useRef(0)
  const completedRef = useRef(false)

  useEffect(() => {
    if (!battle?.active) return

    let frameId: number
    const loop = (time: number) => {
      const dt = Math.min(0.05, (time - lastTimeRef.current) / 1000)
      lastTimeRef.current = time
      if (dt > 0) update(dt)
      frameId = requestAnimationFrame(loop)
    }

    lastTimeRef.current = performance.now()
    frameId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frameId)
  }, [battle?.active, update])

  useEffect(() => {
    if (!battle || battle.status === 'active' || completedRef.current) return

    completedRef.current = true
    const survivalRatio = getSurvivalRatio(battle)

    if (battle.status === 'victory') {
      completeBattle(battle.planetId, survivalRatio)
    } else {
      failBattle(battle.planetId)
    }

    const timer = setTimeout(() => {
      endBattle()
      completedRef.current = false
    }, 2200)

    return () => clearTimeout(timer)
  }, [battle, completeBattle, failBattle, endBattle])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !battle?.active) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let frameId: number
    const draw = () => {
      const current = useBattleStore.getState().battle
      if (!current) return
      renderBattle(ctx, current)
      frameId = requestAnimationFrame(draw)
    }

    frameId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frameId)
  }, [battle?.active])

  useEffect(() => {
    if (!battle?.active) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        togglePause()
      }
      if (e.key === 'h' || e.key === 'H') toggleHold()
      if (e.key === 'g' || e.key === 'G') activateGrenade()
      if (e.key === 'Escape') {
        const b = useBattleStore.getState().battle
        if (b?.activeAbility === 'grenade') {
          useBattleStore.setState({
            battle: b ? { ...b, activeAbility: 'none' } : null,
          })
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [battle?.active, togglePause, toggleHold, activateGrenade])

  if (!battle?.active) return null

  const playerAlive = battle.units.filter(
    (u) => u.team === 'player' && u.state !== 'dead' && u.state !== 'dying'
  ).length
  const enemyAlive = battle.units.filter(
    (u) => u.team === 'enemy' && u.state !== 'dead' && u.state !== 'dying'
  ).length

  const getCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current!
    return canvasToBattleCoords(canvas, clientX, clientY, battle.width, battle.height)
  }

  const selectedCount = battle.selectedUnitIds.length
  const grenadeReady = battle.units.some(
    (u) =>
      battle.selectedUnitIds.includes(u.id) &&
      u.grenadeCooldown <= 0 &&
      u.state !== 'dead' &&
      u.state !== 'dying'
  )

  return (
    <div className="battle-overlay">
      <div className="battle-frame">
        <header className="battle-header">
          <div>
            <h2>{LORE.battle.assaultTitle} — {battle.planetName}</h2>
            <p className="battle-subtitle">{LORE.battle.assaultSubtitle}</p>
          </div>
          <div className="battle-hud">
            <span className="hud-player">{LORE.battle.legionLabel}: {playerAlive}</span>
            <span className="hud-enemy" style={{ color: battle.enemyColor }}>
              {LORE.battle.hostilesLabel}: {enemyAlive}
            </span>
            {selectedCount > 0 && (
              <span className="hud-selected">Selected: {selectedCount}</span>
            )}
            {battle.status === 'active' && (
              <>
                <button
                  className={`btn btn-ability ${battle.paused ? 'active' : ''}`}
                  onClick={togglePause}
                  title="Pause (Space)"
                >
                  {battle.paused ? '▶ Resume' : '⏸ Pause'}
                </button>
                <button
                  className="btn btn-ability"
                  onClick={toggleHold}
                  disabled={selectedCount === 0}
                  title="Hold Position (H)"
                >
                  🛡 Hold
                </button>
                <button
                  className={`btn btn-ability ${battle.activeAbility === 'grenade' ? 'active' : ''}`}
                  onClick={activateGrenade}
                  disabled={selectedCount === 0 || !grenadeReady}
                  title="Frag Grenade (G)"
                >
                  💣 Grenade
                </button>
                <button
                  className="btn btn-retreat"
                  onClick={() => retreatBattle(battle.planetId)}
                >
                  Retreat
                </button>
              </>
            )}
          </div>
        </header>

        <div className="battle-canvas-wrap">
          <canvas
            ref={canvasRef}
            width={battle.width}
            height={battle.height}
            className="battle-canvas"
            onMouseDown={(e) => {
              const c = getCoords(e.clientX, e.clientY)
              handleMouseDown(c.x, c.y, e.shiftKey)
            }}
            onMouseMove={(e) => {
              const c = getCoords(e.clientX, e.clientY)
              handleMouseMove(c.x, c.y)
            }}
            onMouseUp={(e) => {
              const c = getCoords(e.clientX, e.clientY)
              handleMouseUp(c.x, c.y, e.shiftKey)
            }}
            onContextMenu={(e) => e.preventDefault()}
          />

          {battle.activeAbility === 'grenade' && (
            <div className="ability-hint">Click to throw grenade · Esc to cancel</div>
          )}

          {battle.status === 'victory' && (
            <div className="battle-result victory">
              <h3>{LORE.battle.victory}</h3>
              <p>{LORE.battle.victoryMessage}</p>
            </div>
          )}
          {battle.status === 'defeat' && (
            <div className="battle-result defeat">
              <h3>{LORE.battle.defeat}</h3>
              <p>{LORE.battle.defeatMessage}</p>
            </div>
          )}
        </div>

        <footer className="battle-footer">
          <p>
            Drag to select squad · Shift+click to add · Click field to advance ·
            Full cover blocks shots · Half/Full cover reduces damage
          </p>
          <p className="battle-hotkeys">
            Space: Pause · H: Hold position · G: Grenade
          </p>
        </footer>
      </div>
    </div>
  )
}
