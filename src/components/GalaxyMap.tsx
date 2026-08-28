import { ENEMY_FACTIONS, PLANET_TYPE_INFO } from '../game/constants'
import type { Planet } from '../game/types'
import { useFleetPower, useGameStore } from '../store/gameStore'

export function GalaxyMap() {
  const planets = useGameStore((s) => s.planets)
  const selectedPlanetId = useGameStore((s) => s.selectedPlanetId)
  const selectPlanet = useGameStore((s) => s.selectPlanet)
  const attackPlanet = useGameStore((s) => s.attackPlanet)
  const fleetPower = useFleetPower()

  const playerPlanets = planets.filter((p) => p.owner === 'player')
  const enemyPlanets = planets.filter((p) => p.owner === 'enemy')

  const selectedPlanet = planets.find((p) => p.id === selectedPlanetId)

  return (
    <section className="panel galaxy-panel">
      <h2>Galaxy Map</h2>
      <div className="galaxy-stats">
        <span className="player-count">Your Worlds: {playerPlanets.length}</span>
        <span className="enemy-count">Enemy Worlds: {enemyPlanets.length}</span>
      </div>

      <div className="galaxy-map">
        {planets.map((planet: Planet, index: number) => {
          const typeInfo = PLANET_TYPE_INFO[planet.type]
          const faction = ENEMY_FACTIONS.find((f) => f.id === planet.enemyFaction)
          const isSelected = planet.id === selectedPlanetId
          const angle = (index / planets.length) * Math.PI * 2
          const radius = planet.owner === 'player' ? 60 : 140
          const x = 50 + Math.cos(angle) * radius * 0.35
          const y = 50 + Math.sin(angle) * radius * 0.35

          return (
            <button
              key={planet.id}
              className={`planet-node ${planet.owner} ${isSelected ? 'selected' : ''}`}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                borderColor: faction?.color ?? (planet.owner === 'player' ? '#4ecdc4' : '#ff6b6b'),
              }}
              onClick={() => selectPlanet(planet.id)}
              title={`${planet.name} (${typeInfo.name})`}
            >
              <span className="node-icon">{typeInfo.icon}</span>
              <span className="node-name">{planet.name}</span>
            </button>
          )
        })}
        <div className="galaxy-center">☀️</div>
      </div>

      {selectedPlanet && (
        <div className="planet-actions">
          <h3>{selectedPlanet.name}</h3>
          <p>
            Defense: {selectedPlanet.defenseRating} · Your Fleet Power: {fleetPower}
          </p>
          {selectedPlanet.owner === 'enemy' && (
            <button
              className="btn btn-attack"
              disabled={fleetPower === 0}
              onClick={() => attackPlanet(selectedPlanet.id)}
            >
              ⚔️ Launch Invasion
            </button>
          )}
          {selectedPlanet.owner === 'player' && (
            <p className="friendly-note">This world is under your control.</p>
          )}
        </div>
      )}
    </section>
  )
}
