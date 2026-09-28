import { useEffect } from 'react'
import { TUTORIAL_STEPS, getTutorialStep } from '../game/tutorial'
import { useBattleStore } from '../store/battleStore'
import { useGameStore } from '../store/gameStore'

export function TutorialOverlay() {
  const tutorial = useGameStore((s) => s.tutorial)
  const advanceTutorial = useGameStore((s) => s.advanceTutorial)
  const retreatTutorial = useGameStore((s) => s.retreatTutorial)
  const completeTutorial = useGameStore((s) => s.completeTutorial)
  const skipTutorial = useGameStore((s) => s.skipTutorial)
  const battleActive = useBattleStore((s) => s.battle?.active ?? false)
  const orbitalActive = useBattleStore((s) => s.orbital?.active ?? false)
  const combatOpen = battleActive || orbitalActive

  const step = getTutorialStep(tutorial)
  const stepNumber = tutorial.stepIndex + 1
  const isLast = tutorial.stepIndex >= TUTORIAL_STEPS.length - 1

  useEffect(() => {
    if (tutorial.completed) return

    document.querySelectorAll('[data-tutorial-id].tutorial-spotlight').forEach((el) => {
      el.classList.remove('tutorial-spotlight')
    })

    if (step.highlight) {
      document
        .querySelector(`[data-tutorial-id="${step.highlight}"]`)
        ?.classList.add('tutorial-spotlight')
    }

    return () => {
      document.querySelectorAll('[data-tutorial-id].tutorial-spotlight').forEach((el) => {
        el.classList.remove('tutorial-spotlight')
      })
    }
  }, [step.highlight, tutorial.completed, tutorial.stepIndex])

  if (tutorial.completed || combatOpen) return null

  return (
    <div
      className={`tutorial-overlay${step.highlight ? ' tutorial-overlay--spotlight' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-title"
    >
      <div className="tutorial-backdrop" aria-hidden="true" />
      <div className="tutorial-dialog panel">
        <div className="tutorial-dialog-header">
          <span className="tutorial-step-label">
            Warden tutorial · {stepNumber} / {TUTORIAL_STEPS.length}
          </span>
          <button type="button" className="btn btn-ghost btn-compact" onClick={skipTutorial}>
            Skip
          </button>
        </div>
        <h2 id="tutorial-title">{step.title}</h2>
        <p className="tutorial-body">{step.body}</p>
        <div className="tutorial-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={retreatTutorial}
            disabled={tutorial.stepIndex === 0}
          >
            Back
          </button>
          {isLast ? (
            <button type="button" className="btn btn-primary" onClick={completeTutorial}>
              Begin the mandate
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={advanceTutorial}>
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
