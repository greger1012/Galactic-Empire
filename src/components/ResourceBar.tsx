import { useMemo } from 'react'
import { LORE } from '../game/lore'
import { getActiveStarSystemLabel } from '../game/galacticMandate'
import type { ResourceType } from '../game/types'
import { useGameStore } from '../store/gameStore'

const RESOURCE_ICONS: Record<ResourceType, string> = {
  minerals: '⛏️',
  energy: '⚡',
  food: '🌾',
  credits: '⚜️',
}

export function ResourceBar() {
  const resources = useGameStore((s) => s.resources)
  const tickCount = useGameStore((s) => s.tickCount)
  const empireName = useGameStore((s) => s.empireName)
  const resetGame = useGameStore((s) => s.resetGame)
  const selectedSystemId = useGameStore((s) => s.selectedSystemId)
  const stellarMapView = useGameStore((s) => s.stellarMapView)
  const starSystems = useGameStore((s) => s.starSystems)
  const activeSystem = useMemo(
    () => getActiveStarSystemLabel(useGameStore.getState()),
    [selectedSystemId, stellarMapView, starSystems]
  )

  return (
    <header className="resource-bar" data-tutorial-id="resource-bar">
      <div className="empire-info">
        <span className="empire-mandate">{LORE.empireTitle}</span>
        <h1 className="empire-name">{empireName}</h1>
        <span className="tick-counter">
          {LORE.cycleLabel} {tickCount} · {LORE.gameSubtitle}
        </span>
        <span className="active-system-context" title="Stellar cartograph focus">
          📍 {activeSystem.name} · {activeSystem.starLabel} · {activeSystem.viewLabel}
        </span>
      </div>
      <div className="resources">
        {(Object.keys(resources) as ResourceType[]).map((key) => (
          <div
            key={key}
            className="resource-item"
            title={LORE.resourceDescriptions[key]}
          >
            <span className="resource-icon">{RESOURCE_ICONS[key]}</span>
            <span className="resource-label">{LORE.resourceLabels[key]}</span>
            <span className="resource-value">{Math.floor(resources[key])}</span>
          </div>
        ))}
      </div>
      <button className="btn btn-ghost" onClick={resetGame} title="Begin a new mandate">
        New Mandate
      </button>
    </header>
  )
}
