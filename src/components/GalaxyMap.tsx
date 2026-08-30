import { ENEMY_FACTIONS, PLANET_TYPE_INFO, getPlanetTypeSummary } from '../game/constants'
import { LORE } from '../game/lore'
import { getPlanetEpithet } from '../game/names'
import type { Planet } from '../game/types'
import { useFleetPower, useGameStore } from '../store/gameStore'

export function GalaxyMap() {
  const planets = useGameStore((s) => s.planets)
  const selectedPlanetId = useGameStore((s) => s.selectedPlanetId)
  const selectPlanet = useGameStore((s) => s.selectPlanet)
  const initiateInvasion = useGameStore((s) => s.initiateInvasion)
  const fleetPower = useFleetPower()

  const playerPlanets = planets.filter((p) => p.owner === 'player')
  const enemyPlanets = planets.filter((p) => p.owner === 'enemy')

  const selectedPlanet = planets.find((p) => p.id === selectedPlanetId)
  const selectedFaction = selectedPlanet?.enemyFaction
    ? ENEMY_FACTIONS.find((f) => f.id === selectedPlanet.enemyFaction)
    : undefined

  return (
    <section className="panel galaxy-panel">
      <h2>{LORE.galaxyMapTitle}</h2>
      <div className="galaxy-stats">
        <span className="player-count">Throne Worlds: {playerPlanets.length}</span>
        <span className="enemy-count">Contested: {enemyPlanets.length}</span>
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
                borderColor:
                  faction?.color ?? (planet.owner === 'player' ? '#c9a227' : '#c44b4b'),
              }}
              onClick={() => selectPlanet(planet.id)}
              title={`${planet.name} — ${getPlanetTypeSummary(planet.type)}`}
            >
              <span className="node-icon">{typeInfo.icon}</span>
              <span className="node-name">{planet.name}</span>
            </button>
          )
        })}
        <div className="galaxy-center" title="The Iron Sun">
          ☀️
        </div>
      </div>

      {selectedPlanet && (
        <div className="planet-actions">
          <h3>{selectedPlanet.name}</h3>
          {getPlanetEpithet(selectedPlanet.id) && (
            <p className="planet-epithet">{getPlanetEpithet(selectedPlanet.id)}</p>
          )}
          {selectedFaction && (
            <p className="faction-lore">
              <strong>{selectedFaction.name}</strong> — "{selectedFaction.motto}"
            </p>
          )}
          <p>
            {getPlanetTypeSummary(selectedPlanet.type)} · Aegis Rating:{' '}
            {selectedPlanet.defenseRating} · Void Armada Strength: {fleetPower}
          </p>
          {selectedPlanet.owner === 'enemy' && (
            <button
              className="btn btn-attack"
              disabled={fleetPower === 0}
              onClick={() => initiateInvasion(selectedPlanet.id)}
            >
              ⚔️ Issue Mandate of Conquest
            </button>
          )}
          {selectedPlanet.owner === 'player' && (
            <p className="friendly-note">This world acknowledges the Throne Mandate.</p>
          )}
        </div>
      )}
    </section>
  )
}
