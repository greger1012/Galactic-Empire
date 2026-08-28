import { BUILDING_INFO, PLANET_TYPE_INFO } from '../game/constants'
import { getBuildingCost, getBuildingLevel } from '../game/engine'
import type { BuildingType } from '../game/types'
import { useGameStore } from '../store/gameStore'
import { useProductionRates } from '../store/gameStore'

export function PlanetPanel() {
  const planet = useGameStore((s) =>
    s.planets.find((p) => p.id === s.selectedPlanetId)
  )
  const resources = useGameStore((s) => s.resources)
  const upgradeBuilding = useGameStore((s) => s.upgradeBuilding)
  const rates = useProductionRates()

  if (!planet) return null

  const typeInfo = PLANET_TYPE_INFO[planet.type]
  const isPlayer = planet.owner === 'player'

  return (
    <section className="panel planet-panel">
      <div className="planet-header">
        <span className="planet-icon">{typeInfo.icon}</span>
        <div>
          <h2>{planet.name}</h2>
          <p className="planet-meta">
            {typeInfo.name} · {planet.owner === 'player' ? 'Your Territory' : 'Enemy World'}
            {planet.enemyFaction && ` · ${planet.enemyFaction}`}
          </p>
        </div>
      </div>

      <div className="planet-stats">
        <div className="stat">
          <span className="stat-label">Population</span>
          <span className="stat-value">
            {planet.population.toLocaleString()} / {planet.maxPopulation.toLocaleString()}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Defense</span>
          <span className="stat-value">{planet.defenseRating}</span>
        </div>
        {isPlayer && (
          <div className="stat">
            <span className="stat-label">Net Production</span>
            <span className="stat-value production-rates">
              <span className={rates.minerals >= 0 ? 'positive' : 'negative'}>
                ⛏️{rates.minerals >= 0 ? '+' : ''}
                {rates.minerals.toFixed(1)}
              </span>
              <span className={rates.energy >= 0 ? 'positive' : 'negative'}>
                ⚡{rates.energy >= 0 ? '+' : ''}
                {rates.energy.toFixed(1)}
              </span>
              <span className={rates.food >= 0 ? 'positive' : 'negative'}>
                🌾{rates.food >= 0 ? '+' : ''}
                {rates.food.toFixed(1)}
              </span>
            </span>
          </div>
        )}
      </div>

      {isPlayer && (
        <div className="buildings">
          <h3>Infrastructure</h3>
          <div className="building-grid">
            {(Object.keys(BUILDING_INFO) as BuildingType[]).map((type) => {
              const info = BUILDING_INFO[type]
              const level = getBuildingLevel(planet, type)
              const cost = getBuildingCost(type, level)
              const maxed = level >= info.maxLevel
              const affordable =
                resources.minerals >= cost.minerals &&
                resources.energy >= cost.energy &&
                resources.food >= cost.food &&
                resources.credits >= cost.credits

              return (
                <div key={type} className="building-card">
                  <div className="building-icon">{info.icon}</div>
                  <div className="building-info">
                    <h4>{info.name}</h4>
                    <p>{info.description}</p>
                    <span className="building-level">
                      Level {level}
                      {maxed ? ' (MAX)' : ` / ${info.maxLevel}`}
                    </span>
                  </div>
                  {!maxed && (
                    <button
                      className="btn btn-upgrade"
                      disabled={!affordable}
                      onClick={() => upgradeBuilding(planet.id, type)}
                    >
                      <span className="cost">
                        ⛏️{cost.minerals} ⚡{cost.energy}
                        {cost.food > 0 && ` 🌾${cost.food}`}
                        {cost.credits > 0 && ` 💰${cost.credits}`}
                      </span>
                      Upgrade
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
