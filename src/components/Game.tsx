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
import { MandateGuide } from './MandateGuide'
import { ResearchPanel } from './ResearchPanel'
import { ResourceBar } from './ResourceBar'

export function Game() {
  const tickCount = useGameStore((s) => s.tickCount)
  const gameWon = useGameStore((s) => s.gameWon)
  const battleActive = useBattleStore((s) => s.battle?.active ?? false)
  const reopenMandateGuide = useGameStore((s) => s.reopenMandateGuide)
  const mandateDismissed = useGameStore((s) => s.mandateGuide.dismissed)

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
          <MandateGuide />
          <GalaxyMap />
          <EventLog />
        </div>
        <div className="right-column">
          <PlanetPanel />
          <FleetPanel />
          <ResearchPanel />
        </div>
      </main>

      <footer className="game-footer">
        <p>
          {LORE.cycleLabel} {tickCount} · Rival mandates stir every 15 cycles · Reclaim all
          contested worlds to extend the Golden Age
          {mandateDismissed && (
            <>
              {' '}
              ·{' '}
              <button type="button" className="footer-link" onClick={reopenMandateGuide}>
                Reopen mandate briefing
              </button>
            </>
          )}
        </p>
      </footer>

      <BattleOverlay />
    </div>
  )
}
