import { useMemo } from 'react'
import {
  getGalacticMandateSteps,
  isGalacticMandateComplete,
  shouldShowGalacticMandate,
} from '../game/galacticMandate'
import { LORE } from '../game/lore'
import { useGameStore } from '../store/gameStore'

export function GalacticMandatePanel() {
  const planets = useGameStore((s) => s.planets)
  const starSystems = useGameStore((s) => s.starSystems)
  const invasionIssued = useGameStore((s) => s.mandateGuide.invasionIssued)
  const setStellarMapView = useGameStore((s) => s.setStellarMapView)

  const show = useMemo(
    () => shouldShowGalacticMandate(useGameStore.getState()),
    [planets, starSystems, invasionIssued]
  )
  const complete = useMemo(
    () => isGalacticMandateComplete(useGameStore.getState()),
    [planets, starSystems]
  )
  const steps = useMemo(
    () => getGalacticMandateSteps(useGameStore.getState()),
    [planets, starSystems]
  )

  if (!show && !complete) return null

  const doneCount = steps.filter((s) => s.done).length

  return (
    <section className="panel galactic-mandate-panel" data-tutorial-id="galactic-mandate">
      <div className="mandate-guide-header">
        <h2>Imperial Cartography</h2>
        {!complete && (
          <span className="mandate-progress">
            {doneCount} / {steps.length}
          </span>
        )}
      </div>

      <p className="mandate-intro">{LORE.galacticChartHint}</p>

      <ol className="mandate-steps">
        {steps.map((step) => (
          <li key={step.id} className={step.done ? 'done' : 'active'}>
            <span className="mandate-step-check">{step.done ? '✓' : '○'}</span>
            <div>
              <strong>{step.title}</strong>
              {!step.done && <p>{step.hint}</p>}
            </div>
          </li>
        ))}
      </ol>

      {!complete && (
        <button
          type="button"
          className="btn btn-ghost btn-compact"
          onClick={() => setStellarMapView('galaxy')}
        >
          Open galactic chart
        </button>
      )}

      {complete && (
        <p className="mandate-complete">
          The arm is charting under Throne law. Push deeper systems and void frontiers as rival mandates stir.
        </p>
      )}
    </section>
  )
}
