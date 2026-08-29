import { useEffect } from 'react'
import { TICK_INTERVAL_MS } from '../game/constants'
import { useBattleStore } from '../store/battleStore'
import { useGameStore } from '../store/gameStore'
import { BattleOverlay } from './BattleOverlay'
import { EventLog } from './EventLog'
import { FleetPanel } from './FleetPanel'
import { GalaxyMap } from './GalaxyMap'
import { PlanetPanel } from './PlanetPanel'
import { ResourceBar } from './ResourceBar'

export function Game() {
  const tickCount = useGameStore((s) => s.tickCount)
  const gameWon = useGameStore((s) => s.gameWon)
  const battleActive = useBattleStore((s) => s.battle?.active ?? false)

  useEffect(() => {
    if (battleActive) return
    const interval = setInterval(() => {
      useGameStore.getState().advanceTick()
    }, TICK_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [battleActive])

  return (
    <div className="game">
      <div className="stars" />
      <ResourceBar />

      {gameWon && (
        <div className="victory-banner">
          <h2>🏆 Galactic Victory!</h2>
          <p>You have united the galaxy under your rule.</p>
        </div>
      )}

      <main className="game-layout">
        <div className="left-column">
          <GalaxyMap />
          <EventLog />
        </div>
        <div className="right-column">
          <PlanetPanel />
          <FleetPanel />
        </div>
      </main>

      <footer className="game-footer">
        <p>Cycle {tickCount} · Resources update every second · Conquer all enemy worlds to win</p>
      </footer>

      <BattleOverlay />
    </div>
  )
}
