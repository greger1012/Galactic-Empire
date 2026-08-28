import { SHIP_INFO } from '../game/constants'
import type { ShipType } from '../game/types'
import { useFleetPower, useGameStore } from '../store/gameStore'

export function FleetPanel() {
  const fleet = useGameStore((s) => s.fleet)
  const resources = useGameStore((s) => s.resources)
  const buildShip = useGameStore((s) => s.buildShip)
  const fleetPower = useFleetPower()

  const totalShips = (Object.values(fleet) as number[]).reduce((a, b) => a + b, 0)

  return (
    <section className="panel fleet-panel">
      <h2>Fleet Command</h2>
      <div className="fleet-summary">
        <span>Total Ships: {totalShips}</span>
        <span>Combat Power: {fleetPower}</span>
      </div>

      <div className="fleet-inventory">
        <h3>Current Fleet</h3>
        <div className="ship-counts">
          {(Object.keys(fleet) as ShipType[]).map((type) => (
            <div key={type} className="ship-count">
              <span>{SHIP_INFO[type].icon}</span>
              <span>{SHIP_INFO[type].name}</span>
              <span className="count">{fleet[type]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="shipyard">
        <h3>Construct Ships</h3>
        <div className="ship-grid">
          {(Object.keys(SHIP_INFO) as ShipType[]).map((type) => {
            const info = SHIP_INFO[type]
            const affordable =
              resources.minerals >= info.cost.minerals &&
              resources.energy >= info.cost.energy &&
              resources.food >= info.cost.food &&
              resources.credits >= info.cost.credits

            return (
              <div key={type} className="ship-card">
                <span className="ship-icon">{info.icon}</span>
                <div className="ship-info">
                  <h4>{info.name}</h4>
                  <p>{info.description}</p>
                  <span className="ship-power">Power: {info.attackPower}</span>
                </div>
                <button
                  className="btn btn-build"
                  disabled={!affordable}
                  onClick={() => buildShip(type)}
                >
                  <span className="cost">
                    ⛏️{info.cost.minerals} ⚡{info.cost.energy}
                    {info.cost.credits > 0 && ` 💰${info.cost.credits}`}
                  </span>
                  Build
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
