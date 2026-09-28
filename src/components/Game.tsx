import { useEffect } from 'react'
import { TICK_INTERVAL_MS } from '../game/constants'
import { LORE } from '../game/lore'
import { useBattleStore } from '../store/battleStore'
import { useGameStore } from '../store/gameStore'
import { EventLog } from './EventLog'
import { FleetPanel } from './FleetPanel'
import { GalaxyMap } from './GalaxyMap'
import { PlanetPanel } from './PlanetPanel'
import { ChroniclePanel } from './ChroniclePanel'
import { MandateGuide } from './MandateGuide'
import { ResearchPanel } from './ResearchPanel'
import { FactionPulseIndicator } from './FactionPulseIndicator'
import { ResourceBar } from './ResourceBar'
import { BattleOverlay } from './BattleOverlay'
import { OrbitalOverlay } from './OrbitalOverlay'
import { TutorialOverlay } from './TutorialOverlay'

export function Game() {
  const tickCount = useGameStore((s) => s.tickCount)
  const gameWon = useGameStore((s) => s.gameWon)
  const victoryKind = useGameStore((s) => s.victoryKind)
  const victoryBannerDismissed = useGameStore((s) => s.victoryBannerDismissed)
  const dismissVictoryBanner = useGameStore((s) => s.dismissVictoryBanner)
  const frontierWave = useGameStore((s) => s.frontier.wave)
  const battleActive = useBattleStore((s) => s.battle?.active ?? false)
  const orbitalActive = useBattleStore((s) => s.orbital?.active ?? false)
  const orbitalTactical = useBattleStore((s) => s.orbital?.phase === 'tactical')
  const invasionPaused = battleActive || orbitalActive || orbitalTactical
  const reopenMandateGuide = useGameStore((s) => s.reopenMandateGuide)
  const mandateDismissed = useGameStore((s) => s.mandateGuide.dismissed)
  const tutorialCompleted = useGameStore((s) => s.tutorial.completed)
  const reopenTutorial = useGameStore((s) => s.reopenTutorial)
  const resetCombatBriefings = useGameStore((s) => s.resetCombatBriefings)

  useEffect(() => {
    if (invasionPaused || !tutorialCompleted) return
    const interval = setInterval(() => {
      useGameStore.getState().advanceTick()
    }, TICK_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [invasionPaused, tutorialCompleted])

  return (
    <div className="game">
      <div className="stars" />
      <div className="scanlines" />
      <ResourceBar />
      <FactionPulseIndicator />
      {gameWon && !victoryBannerDismissed && (
        <div className="victory-banner">
          <h2>
            ☀️{' '}
            {victoryKind === 'mastery' ? LORE.masteryVictoryTitle : LORE.victoryTitle}
          </h2>
          <p>
            {victoryKind === 'mastery' ? LORE.masteryVictoryMessage : LORE.victoryMessage}
          </p>
          <p className="victory-continue">{LORE.victoryContinueMessage}</p>
          <button type="button" className="btn btn-secondary victory-dismiss" onClick={dismissVictoryBanner}>
            Continue the Endless Mandate
          </button>
        </div>
      )}

      <main className="game-layout">
        <div className="left-column">
          <MandateGuide />
          <ChroniclePanel />
          <GalaxyMap />
          <EventLog />
        </div>
        <div className="right-column">
          <PlanetPanel />
          <div data-tutorial-id="fleet-research" className="fleet-research-stack">
            <FleetPanel />
            <ResearchPanel />
          </div>
        </div>
      </main>

      <footer className="game-footer">
        <p>
          {LORE.cycleLabel} {tickCount}
          {frontierWave > 0 ? ` · Void Frontier ${frontierWave}` : ''} · Rival mandates stir every
          15 cycles · Clear each sector to chart the next procedural void
          {mandateDismissed && (
            <>
              {' '}
              ·{' '}
              <button type="button" className="footer-link" onClick={reopenMandateGuide}>
                Reopen mandate briefing
              </button>
            </>
          )}
          {tutorialCompleted && (
            <>
              {' '}
              ·{' '}
              <button type="button" className="footer-link" onClick={reopenTutorial}>
                Replay warden tutorial
              </button>
            </>
          )}
          {' '}
          ·{' '}
          <button type="button" className="footer-link" onClick={resetCombatBriefings}>
            Replay combat primers
          </button>
        </p>
      </footer>

      <TutorialOverlay />
      <OrbitalOverlay />
      <BattleOverlay />
    </div>
  )
}
