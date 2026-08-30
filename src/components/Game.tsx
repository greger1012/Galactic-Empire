import { useEffect } from 'react'
import { TICK_INTERVAL_MS } from '../game/constants'
import { LORE } from '../game/lore'
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
      <div className="scanlines" />
      <ResourceBar />

      {gameWon && (
        <div className="victory-banner">
          <h2>☀️ {LORE.victoryTitle}</h2>
          <p>{LORE.victoryMessage}</p>
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
        <p>
          {LORE.cycleLabel} {tickCount} · Noospheric feeds update each cycle · Reclaim all
          contested mandates to restore the Golden Age
        </p>
      </footer>

      <BattleOverlay />
    </div>
  )
}
