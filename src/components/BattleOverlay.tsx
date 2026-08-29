import { useEffect, useRef } from 'react'
import { getSurvivalRatio } from '../battle/battleLogic'
import { canvasToBattleCoords, renderBattle } from '../battle/battleRenderer'
import { useBattleStore } from '../store/battleStore'
import { useGameStore } from '../store/gameStore'

export function BattleOverlay() {
  const battle = useBattleStore((s) => s.battle)
  const update = useBattleStore((s) => s.update)
  const handleClick = useBattleStore((s) => s.handleClick)
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

  if (!battle?.active) return null

  const playerAlive = battle.units.filter(
    (u) => u.team === 'player' && u.state !== 'dead' && u.state !== 'dying'
  ).length
  const enemyAlive = battle.units.filter(
    (u) => u.team === 'enemy' && u.state !== 'dead' && u.state !== 'dying'
  ).length

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || battle.status !== 'active') return
    const coords = canvasToBattleCoords(
      canvas,
      e.clientX,
      e.clientY,
      battle.width,
      battle.height
    )
    handleClick(coords.x, coords.y)
  }

  return (
    <div className="battle-overlay">
      <div className="battle-frame">
        <header className="battle-header">
          <div>
            <h2>Ground Assault — {battle.planetName}</h2>
            <p className="battle-subtitle">
              Archaeotech legions deploy against planetary defenders
            </p>
          </div>
          <div className="battle-hud">
            <span className="hud-player">Legion: {playerAlive}</span>
            <span className="hud-enemy" style={{ color: battle.enemyColor }}>
              Hostiles: {enemyAlive}
            </span>
            {battle.status === 'active' && (
              <button
                className="btn btn-retreat"
                onClick={() => retreatBattle(battle.planetId)}
              >
                Retreat
              </button>
            )}
          </div>
        </header>

        <div className="battle-canvas-wrap">
          <canvas
            ref={canvasRef}
            width={battle.width}
            height={battle.height}
            className="battle-canvas"
            onClick={onCanvasClick}
          />

          {battle.status === 'victory' && (
            <div className="battle-result victory">
              <h3>Victory</h3>
              <p>The world falls to your legions.</p>
            </div>
          )}
          {battle.status === 'defeat' && (
            <div className="battle-result defeat">
              <h3>Defeat</h3>
              <p>Your assault force has been annihilated.</p>
            </div>
          )}
        </div>

        <footer className="battle-footer">
          <p>
            Click a legionnaire to select · Click the field to advance · Units auto-fire at
            range
          </p>
        </footer>
      </div>
    </div>
  )
}
