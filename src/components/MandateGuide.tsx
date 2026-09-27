import {
  getMandateSteps,
  isMandateComplete,
  shouldShowMandateGuide,
} from '../game/mandateGuide'
import { LORE } from '../game/lore'
import { useGameStore } from '../store/gameStore'

export function MandateGuide() {
  const dismissed = useGameStore((s) => s.mandateGuide.dismissed)
  const steps = useGameStore((s) => getMandateSteps(s))
  const show = useGameStore((s) => shouldShowMandateGuide(s))
  const complete = useGameStore((s) => isMandateComplete(s))
  const dismiss = useGameStore((s) => s.dismissMandateGuide)

  if (!show && !complete) return null
  if (dismissed && !complete) return null

  const doneCount = steps.filter((s) => s.done).length

  return (
    <section className="panel mandate-guide-panel">
      <div className="mandate-guide-header">
        <h2>First Mandate Briefing</h2>
        {complete ? (
          <button type="button" className="btn btn-ghost btn-compact" onClick={dismiss}>
            Dismiss
          </button>
        ) : (
          <span className="mandate-progress">{doneCount} / {steps.length}</span>
        )}
      </div>

      {complete ? (
        <p className="mandate-complete">
          Core directives fulfilled. The Golden Age expands — pursue conquest, inquiry, and
          infrastructure as you see fit.
        </p>
      ) : (
        <p className="mandate-intro">
          Warden, complete these steps to secure your throne-mandate on {LORE.homePlanetName}.
        </p>
      )}

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
        <button type="button" className="btn btn-ghost btn-compact mandate-skip" onClick={dismiss}>
          Hide briefing (reopen from footer)
        </button>
      )}
    </section>
  )
}
