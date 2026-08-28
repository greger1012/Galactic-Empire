import type { ResourceType } from '../game/types'
import { useGameStore } from '../store/gameStore'

const RESOURCE_ICONS: Record<ResourceType, string> = {
  minerals: '⛏️',
  energy: '⚡',
  food: '🌾',
  credits: '💰',
}

const RESOURCE_LABELS: Record<ResourceType, string> = {
  minerals: 'Minerals',
  energy: 'Energy',
  food: 'Food',
  credits: 'Credits',
}

export function ResourceBar() {
  const resources = useGameStore((s) => s.resources)
  const tickCount = useGameStore((s) => s.tickCount)
  const empireName = useGameStore((s) => s.empireName)
  const resetGame = useGameStore((s) => s.resetGame)

  return (
    <header className="resource-bar">
      <div className="empire-info">
        <h1 className="empire-name">{empireName}</h1>
        <span className="tick-counter">Cycle {tickCount}</span>
      </div>
      <div className="resources">
        {(Object.keys(resources) as ResourceType[]).map((key) => (
          <div key={key} className="resource-item">
            <span className="resource-icon">{RESOURCE_ICONS[key]}</span>
            <span className="resource-label">{RESOURCE_LABELS[key]}</span>
            <span className="resource-value">{Math.floor(resources[key])}</span>
          </div>
        ))}
      </div>
      <button className="btn btn-ghost" onClick={resetGame} title="Start new game">
        New Game
      </button>
    </header>
  )
}
