import { ENEMY_FACTIONS, PLANET_TYPE_INFO, getPlanetTypeSummary } from '../game/constants'
import { LORE } from '../game/lore'
import { getDeepVoidTierLabel } from '../game/deepVoid'
import { getPlanetMapPosition } from '../game/frontierGeneration'
import { getPlanetEpithet } from '../game/names'
import type { Planet } from '../game/types'
import { getMandateFocus } from '../game/mandateGuide'
import { useFleetPower, useGameStore } from '../store/gameStore'

export function GalaxyMap() {
  const planets = useGameStore((s) => s.planets)
  const selectedPlanetId = useGameStore((s) => s.selectedPlanetId)
  const selectPlanet = useGameStore((s) => s.selectPlanet)
  const initiateInvasion = useGameStore((s) => s.initiateInvasion)
  const fleetPower = useFleetPower()
  const mandateFocus = useGameStore((s) => getMandateFocus(s))

  const playerPlanets = planets.filter((p) => p.owner === 'player')
  const enemyPlanets = planets.filter((p) => p.owner === 'enemy')
  const frontierWave = useGameStore((s) => s.frontier.wave)

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
        {frontierWave > 0 && (
          <span className="frontier-count">Void Frontier: {frontierWave}</span>
        )}
      </div>

      <div className="galaxy-map">
        {planets.map((planet: Planet) => {
          const typeInfo = PLANET_TYPE_INFO[planet.type]
          const faction = ENEMY_FACTIONS.find((f) => f.id === planet.enemyFaction)
          const isSelected = planet.id === selectedPlanetId
          const { x, y } = getPlanetMapPosition(planet)

          return (
            <button
              key={planet.id}
              className={`planet-node ${planet.owner}${planet.isFrontierBoss ? ' frontier-boss' : ''} ${isSelected ? 'selected' : ''}`}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                borderColor:
                  faction?.color ?? (planet.owner === 'player' ? '#c9a227' : '#c44b4b'),
              }}
              onClick={() => selectPlanet(planet.id)}
              title={`${planet.name}${planet.isFrontierBoss ? ' (Apex Bastion)' : ''} — ${getPlanetTypeSummary(planet.type)}${planet.frontierWave ? ` · ${getDeepVoidTierLabel(planet.frontierWave)}` : ''}`}
            >
              <span className="node-icon">
                {planet.isFrontierBoss ? '👑' : typeInfo.icon}
              </span>
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
          {getPlanetEpithet(selectedPlanet.id, selectedPlanet.epithet) && (
            <p className="planet-epithet">
              {getPlanetEpithet(selectedPlanet.id, selectedPlanet.epithet)}
            </p>
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
              className={`btn btn-attack${mandateFocus === 'invasion' ? ' mandate-focus' : ''}${selectedPlanet.isFrontierBoss ? ' boss-assault' : ''}`}
              disabled={fleetPower === 0}
              onClick={() => initiateInvasion(selectedPlanet.id)}
            >
              {selectedPlanet.isFrontierBoss
                ? '👑 Shatter Apex Bastion'
                : '⚔️ Issue Mandate of Conquest'}
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
