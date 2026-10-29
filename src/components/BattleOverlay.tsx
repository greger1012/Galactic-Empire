import { useEffect, useRef, useState } from 'react'
import type { BattleState } from '../battle/types'
import { BattleUnitTooltip } from './BattleUnitTooltip'
import { CombatBriefingCard } from './CombatBriefingCard'
import { COMBAT_BRIEFINGS, hasSeenCombatBriefing } from '../game/combatTutorial'
import { LORE } from '../game/lore'
import { getSurvivalRatio } from '../battle/battleLogic'
import { BIOMES } from '../battle/biomes'
import { canvasToBattleCoords, renderBattle } from '../battle/battleRenderer'
import { useBattleStore } from '../store/battleStore'
import { useGameStore } from '../store/gameStore'

export function BattleOverlay() {
  const battleActive = useBattleStore((s) => s.battle?.active === true)
  if (!battleActive) return null
  return <BattleOverlayActive />
}

function BattleOverlayActive() {
  const battle = useBattleStore((s) => s.battle) as BattleState
  const update = useBattleStore((s) => s.update)
  const handleMouseDown = useBattleStore((s) => s.handleMouseDown)
  const handlePointerMove = useBattleStore((s) => s.handlePointerMove)
  const clearHover = useBattleStore((s) => s.clearHover)
  const handleMouseUp = useBattleStore((s) => s.handleMouseUp)
  const togglePause = useBattleStore((s) => s.togglePause)
  const toggleHold = useBattleStore((s) => s.toggleHold)
  const activateGrenade = useBattleStore((s) => s.activateGrenade)
  const activateSuppressiveFire = useBattleStore((s) => s.activateSuppressiveFire)
  const activateLanceVolley = useBattleStore((s) => s.activateLanceVolley)
  const activateVitaeStim = useBattleStore((s) => s.activateVitaeStim)
  const retreatBattle = useGameStore((s) => s.retreatBattle)
  const combatTutorial = useGameStore((s) => s.combatTutorial)
  const dismissCombatBriefing = useGameStore((s) => s.dismissCombatBriefing)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const groundBriefingPauseRef = useRef(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const lastTimeRef = useRef(0)
  const completedRef = useRef(false)
  const [pointer, setPointer] = useState({ x: 0, y: 0 })

  useEffect(() => {
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
  }, [update])

  useEffect(() => {
    if (battle.status === 'active' || completedRef.current) return

    completedRef.current = true
    const survivalRatio = getSurvivalRatio(battle)
    const game = useGameStore.getState()

    if (battle.status === 'victory') {
      game.completeBattle(battle.planetId, survivalRatio)
    } else {
      game.failBattle(battle.planetId)
    }

    const timer = setTimeout(() => {
      useBattleStore.getState().endBattle()
      completedRef.current = false
    }, 2200)

    return () => clearTimeout(timer)
  }, [battle.status, battle.planetId])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let frameId: number
    const draw = () => {
      const current = useBattleStore.getState().battle
      if (!current?.active) return
      renderBattle(ctx, current)
      frameId = requestAnimationFrame(draw)
    }

    frameId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frameId)
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        togglePause()
      }
      if (e.key === 'h' || e.key === 'H') toggleHold()
      if (e.key === 'g' || e.key === 'G') activateGrenade()
      if (e.key === 'f' || e.key === 'F') activateSuppressiveFire()
      if (e.key === 'l' || e.key === 'L') activateLanceVolley()
      if (e.key === 'v' || e.key === 'V') activateVitaeStim()
      if (e.key === 'Escape') {
        const b = useBattleStore.getState().battle
        if (b?.activeAbility === 'grenade' || b?.activeAbility === 'lanceVolley') {
          useBattleStore.setState({
            battle: b ? { ...b, activeAbility: 'none' } : null,
          })
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    togglePause,
    toggleHold,
    activateGrenade,
    activateSuppressiveFire,
    activateLanceVolley,
    activateVitaeStim,
  ])

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

  const biome = BIOMES[battle.planetType]
  const selectedCount = battle.selectedUnitIds.length
  const hoveredUnit = battle.hoveredUnitId
    ? battle.units.find((u) => u.id === battle.hoveredUnitId)
    : undefined

  const cd = battle.squadCooldowns
  const suppressReady = selectedCount > 0 && cd.suppressiveFire <= 0
  const lanceReady = cd.lanceVolley <= 0
  const vitaeReady = selectedCount > 0 && cd.vitaeStim <= 0

  const groundBriefing = COMBAT_BRIEFINGS.groundAssault
  const showGroundBriefing =
    battle.status === 'active' &&
    !hasSeenCombatBriefing(combatTutorial, 'groundAssault')

  useEffect(() => {
    if (!showGroundBriefing || groundBriefingPauseRef.current) return
    groundBriefingPauseRef.current = true
    if (!battle.paused) togglePause()
  }, [showGroundBriefing, battle.paused, togglePause])

  const confirmGroundBriefing = () => {
    dismissCombatBriefing('groundAssault')
    const current = useBattleStore.getState().battle
    if (current?.paused) togglePause()
  }

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
            {battle.orbitalChronicle && (
              <p className="battle-orbital-chronicle">{battle.orbitalChronicle}</p>
            )}
            <p className="battle-biome">
              <span className="battle-biome-name">{biome.name}</span>
              <span className="battle-biome-tagline"> · {biome.tagline}</span>
              {biome.hazardLabel && (
                <span className="battle-biome-hazard"> · {biome.hazardLabel}</span>
              )}
            </p>
          </div>
          <div className="battle-hud">
            <span className="hud-player">{LORE.battle.legionLabel}: {playerAlive}</span>
            <span className="hud-enemy" style={{ color: battle.enemyColor }}>
              {LORE.battle.hostilesLabel}: {enemyAlive}
            </span>
            <span className="hud-roster" style={{ color: battle.enemyColor }}>
              {battle.hostileRosterName}
            </span>
            {battle.isFrontierBoss && <span className="hud-apex">👑 Apex Bastion</span>}
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
                  className="btn btn-ability"
                  onClick={activateSuppressiveFire}
                  disabled={!suppressReady}
                  title="Suppressive Fire (F) — faster fire, pins hostiles"
                >
                  🎯 Suppress{cd.suppressiveFire > 0 ? ` ${Math.ceil(cd.suppressiveFire)}s` : ''}
                </button>
                <button
                  className={`btn btn-ability ${battle.activeAbility === 'lanceVolley' ? 'active' : ''}`}
                  onClick={activateLanceVolley}
                  disabled={!lanceReady}
                  title="Lance Volley (L) — click to strike an area"
                >
                  ⚡ Lance{cd.lanceVolley > 0 ? ` ${Math.ceil(cd.lanceVolley)}s` : ''}
                </button>
                <button
                  className="btn btn-ability"
                  onClick={activateVitaeStim}
                  disabled={!vitaeReady}
                  title="Vitae Stim (V) — heal selected legionnaires"
                >
                  💉 Stim{cd.vitaeStim > 0 ? ` ${Math.ceil(cd.vitaeStim)}s` : ''}
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

        <div className="battle-canvas-wrap" ref={wrapRef}>
          {showGroundBriefing && (
            <CombatBriefingCard
              title={groundBriefing.title}
              intro={groundBriefing.intro}
              bullets={groundBriefing.bullets}
              confirmLabel={groundBriefing.confirmLabel}
              onConfirm={confirmGroundBriefing}
            />
          )}
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
              const wrap = wrapRef.current
              if (wrap) {
                const rect = wrap.getBoundingClientRect()
                setPointer({ x: e.clientX - rect.left, y: e.clientY - rect.top })
              }
              const c = getCoords(e.clientX, e.clientY)
              handlePointerMove(c.x, c.y)
            }}
            onMouseUp={(e) => {
              const c = getCoords(e.clientX, e.clientY)
              handleMouseUp(c.x, c.y, e.shiftKey)
            }}
            onMouseLeave={() => clearHover()}
            onContextMenu={(e) => e.preventDefault()}
          />

          {hoveredUnit && hoveredUnit.state !== 'dead' && hoveredUnit.state !== 'dying' && (
            <BattleUnitTooltip
              unit={hoveredUnit}
              x={pointer.x}
              y={pointer.y}
              wrapWidth={wrapRef.current?.clientWidth ?? battle.width}
              wrapHeight={wrapRef.current?.clientHeight ?? battle.height}
            />
          )}

          {battle.activeAbility === 'grenade' && (
            <div className="ability-hint">Click to throw grenade · Esc to cancel</div>
          )}
          {battle.activeAbility === 'lanceVolley' && (
            <div className="ability-hint">Click to call lance volley · Esc to cancel</div>
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
            Drag to select squad · Shift+click to add · Hover units for intel ·
            Full cover blocks shots · Half/Full cover reduces damage
          </p>
          <p className="battle-hotkeys">
            Space: Pause · H: Hold · G: Grenade · F: Suppress · L: Lance volley · V: Vitae stim
          </p>
        </footer>
      </div>
    </div>
  )
}
