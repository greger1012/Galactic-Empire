import { getEmpireNoosphereSummary } from '../game/mandateGuide'
import { LORE } from '../game/lore'
import { useGameStore } from '../store/gameStore'

/** Empire-wide Noospheric stats for throne-world panels. */
export function EmpireNoosphereStrip() {
  const summary = useGameStore((s) => getEmpireNoosphereSummary(s))

  return (
    <div className="noosphere-strip">
      <h3>Noospheric Feed</h3>
      <div className="noosphere-stats">
        <div>
          <span className="noosphere-label">{summary.buildingName} tiers (empire)</span>
          <span className="noosphere-value">{summary.throneNodeTiers}</span>
        </div>
        <div>
          <span className="noosphere-label">Insight per {LORE.cycleLabel.toLowerCase()}</span>
          <span className="noosphere-value">{summary.insightPerCycle.toFixed(1)}</span>
        </div>
      </div>
      <p className="noosphere-hint">
        Raise {summary.buildingName} on throne worlds to accelerate Noospheric research.
      </p>
    </div>
  )
}
