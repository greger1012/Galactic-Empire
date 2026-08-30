import { BUILDING_INFO, ENEMY_FACTIONS, PLANET_SPECIALIZATION_LABELS, PLANET_TYPE_INFO } from '../game/constants'
import { getBuildingCost, getBuildingLevel } from '../game/engine'
import { LORE } from '../game/lore'
import { getPlanetEpithet } from '../game/names'
import type { BuildingType } from '../game/types'
import { useGameStore } from '../store/gameStore'
import { useProductionRates } from '../store/gameStore'

function formatBonus(value: number): string {
  const percent = Math.round(value * 100)
  if (percent === 100) return '100%'
  if (percent > 100) return `+${percent - 100}%`
  return `-${100 - percent}%`
}

export function PlanetPanel() {
  const planet = useGameStore((s) =>
    s.planets.find((p) => p.id === s.selectedPlanetId)
  )
  const resources = useGameStore((s) => s.resources)
  const upgradeBuilding = useGameStore((s) => s.upgradeBuilding)
  const rates = useProductionRates()

  if (!planet) return null

  const typeInfo = PLANET_TYPE_INFO[planet.type]
  const specInfo = PLANET_SPECIALIZATION_LABELS[typeInfo.specialization]
  const isPlayer = planet.owner === 'player'

  const faction = planet.enemyFaction
    ? ENEMY_FACTIONS.find((f) => f.id === planet.enemyFaction)
    : undefined
  const epithet = getPlanetEpithet(planet.id)

  return (
    <section className="panel planet-panel">
      <div className="planet-header">
        <span className="planet-icon">{typeInfo.icon}</span>
        <div>
          <h2>{planet.name}</h2>
          {epithet && <p className="planet-epithet">{epithet}</p>}
          <p className="planet-meta">
            {typeInfo.name} ·{' '}
            {planet.owner === 'player' ? LORE.ownership.player : LORE.ownership.enemy}
            {faction && ` · ${faction.shortName}`}
          </p>
          <span
            className="planet-specialization"
            style={{ borderColor: specInfo.color, color: specInfo.color }}
          >
            {specInfo.label}
          </span>
        </div>
      </div>

      <p className="planet-description">{typeInfo.description}</p>

      <div className="planet-traits">
        <div className="trait">
          <span className="trait-label">Survivability</span>
          <div className="trait-bar">
            <div
              className="trait-fill survivability"
              style={{ width: `${typeInfo.survivability * 100}%` }}
            />
          </div>
          <span className="trait-value">{Math.round(typeInfo.survivability * 100)}%</span>
        </div>
        <div className="trait-grid">
          <div className="trait-stat">
            <span>⛏️ Minerals</span>
            <span>{formatBonus(typeInfo.mineralBonus)}</span>
          </div>
          <div className="trait-stat">
            <span>⚡ Energy</span>
            <span>{formatBonus(typeInfo.energyBonus)}</span>
          </div>
          <div className="trait-stat">
            <span>🌾 Food</span>
            <span>{formatBonus(typeInfo.foodBonus)}</span>
          </div>
          <div className="trait-stat">
            <span>💰 Credits</span>
            <span>{formatBonus(typeInfo.creditBonus)}</span>
          </div>
        </div>
        {typeInfo.strategicBonus > 0 && (
          <div className="strategic-note">
            🎯 Strategic value: +{typeInfo.strategicBonus} defense · +
            {(typeInfo.strategicBonus / 5).toFixed(1)} credits/cycle from trade routes
          </div>
        )}
      </div>

      <div className="planet-stats">
        <div className="stat">
          <span className="stat-label">Population</span>
          <span className="stat-value">
            {planet.population.toLocaleString()} / {planet.maxPopulation.toLocaleString()}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Aegis Rating</span>
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
          <h3>{LORE.infrastructureTitle}</h3>
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
