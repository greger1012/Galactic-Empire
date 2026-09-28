import { MASTERY_MANDATE_COUNT, getChronicleMandateViews } from '../game/chronicleMandates'
import {
  getFrontierChronicleViews,
  isFrontierChronicleUnlocked,
} from '../game/frontierChronicles'
import { LORE } from '../game/lore'
import { useMemo } from 'react'
import { useGameStore } from '../store/gameStore'

export function ChroniclePanel() {
  const chronicle = useGameStore((s) => s.chronicle)
  const frontierWave = useGameStore((s) => s.frontier.wave)
  const planets = useGameStore((s) => s.planets)
  const fleet = useGameStore((s) => s.fleet)
  const research = useGameStore((s) => s.research)

  const views = useMemo(
    () => getChronicleMandateViews(useGameStore.getState()),
    [chronicle, frontierWave, planets, fleet, research]
  )
  const frontierViews = useMemo(
    () => getFrontierChronicleViews(useGameStore.getState()),
    [chronicle, frontierWave, planets, fleet, research]
  )
  const showFrontier = useMemo(
    () => isFrontierChronicleUnlocked(useGameStore.getState()),
    [chronicle, frontierWave]
  )
  const completed = chronicle.completed.length

  return (
    <section className="panel chronicle-panel">
      <h2>{LORE.chroniclePanelTitle}</h2>
      <p className="chronicle-subtitle">{LORE.chroniclePanelSubtitle}</p>
      <div className="chronicle-mastery-track">
        <span>Mandate of Mastery progress</span>
        <div className="chronicle-mastery-bar">
          <div
            className="chronicle-mastery-fill"
            style={{ width: `${(completed / MASTERY_MANDATE_COUNT) * 100}%` }}
          />
        </div>
        <span className="chronicle-mastery-count">
          {Math.min(completed, MASTERY_MANDATE_COUNT)} / {MASTERY_MANDATE_COUNT}
        </span>
      </div>

      <div className="chronicle-list">
        {views.map((mandate) => (
          <div
            key={mandate.id}
            className={`chronicle-card${mandate.done ? ' done' : ''}`}
          >
            <span className="chronicle-icon">{mandate.icon}</span>
            <div className="chronicle-body">
              <div className="chronicle-title-row">
                <strong>{mandate.title}</strong>
                {mandate.done ? (
                  <span className="chronicle-done">Fulfilled</span>
                ) : (
                  <span className="chronicle-progress">
                    {mandate.current} / {mandate.target}
                  </span>
                )}
              </div>
              <p>{mandate.description}</p>
              {!mandate.done && (
                <div className="chronicle-bar">
                  <div
                    className="chronicle-bar-fill"
                    style={{ width: `${mandate.percent}%` }}
                  />
                </div>
              )}
              <span className="chronicle-reward">Reward: {mandate.rewardMarks} sovereign marks</span>
            </div>
          </div>
        ))}
      </div>

      {showFrontier && (
        <>
          <h3 className="chronicle-frontier-heading">{LORE.frontierChronicleTitle}</h3>
          <p className="chronicle-subtitle">{LORE.frontierChronicleSubtitle}</p>
          <div className="chronicle-list chronicle-list-frontier">
            {frontierViews.map((mandate) => (
              <div
                key={mandate.id}
                className={`chronicle-card frontier${mandate.done ? ' done' : ''}`}
              >
                <span className="chronicle-icon">{mandate.icon}</span>
                <div className="chronicle-body">
                  <div className="chronicle-title-row">
                    <strong>{mandate.title}</strong>
                    {mandate.done ? (
                      <span className="chronicle-done">Fulfilled</span>
                    ) : (
                      <span className="chronicle-progress">
                        {mandate.current} / {mandate.target}
                      </span>
                    )}
                  </div>
                  <p>{mandate.description}</p>
                  {!mandate.done && (
                    <div className="chronicle-bar">
                      <div
                        className="chronicle-bar-fill frontier"
                        style={{ width: `${mandate.percent}%` }}
                      />
                    </div>
                  )}
                  <span className="chronicle-reward">
                    Reward: {mandate.rewardMarks} sovereign marks
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
