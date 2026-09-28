import { SHIP_INFO } from '../game/constants'
import {
  ORBITAL_DOCTRINES,
  getArmadaStrengthDisplay,
  getOrbitalShipRoles,
} from '../battle/orbitalEngagement'
import { LORE } from '../game/lore'
import type { ShipType } from '../game/types'
import { OrbitalTacticalBattle } from './OrbitalTacticalBattle'
import { useBattleStore } from '../store/battleStore'
import { useFleetPower, useGameStore, useTechModifiers } from '../store/gameStore'

export function OrbitalOverlay() {
  const orbitalActive = useBattleStore((s) => s.orbital?.active === true)
  if (!orbitalActive) return null
  return <OrbitalOverlayActive />
}

function OrbitalOverlayActive() {
  const orbital = useBattleStore((s) => s.orbital)!
  const setDoctrine = useBattleStore((s) => s.setOrbitalDoctrine)
  const commit = useBattleStore((s) => s.commitOrbitalAssault)
  const finishTactical = useBattleStore((s) => s.finishOrbitalTactical)
  const deploy = useBattleStore((s) => s.proceedToGroundAssault)
  const cancel = useBattleStore((s) => s.cancelOrbital)

  const fleet = useGameStore((s) => s.fleet)
  const mods = useTechModifiers()
  const fleetPower = useFleetPower()

  const setup = orbital.pendingSetup
  const roles = getOrbitalShipRoles(fleet, mods)
  const armadaDisplay = getArmadaStrengthDisplay(fleet, mods)
  const maxBar = Math.max(armadaDisplay, orbital.originalDefenseRating, 1)
  const result = orbital.result

  return (
    <div className="battle-overlay orbital-overlay">
      <div className="battle-frame orbital-frame">
        <header className="battle-header">
          <div>
            <h2>{LORE.orbital.title} — {setup.planetName}</h2>
            <p className="battle-subtitle">{LORE.orbital.subtitle}</p>
          </div>
        </header>

        <div className="orbital-body">
          {orbital.phase === 'tactical' && orbital.tactical && (
            <OrbitalTacticalBattle tactical={orbital.tactical} onFinished={finishTactical} />
          )}

          {orbital.phase !== 'tactical' && (
          <>
          <div className="orbital-bars">
            <div className="orbital-bar-row">
              <span>{LORE.orbital.armadaStrength}</span>
              <div className="orbital-bar track">
                <div
                  className="orbital-bar fill armada"
                  style={{ width: `${(armadaDisplay / maxBar) * 100}%` }}
                />
              </div>
              <span className="orbital-bar-value">{armadaDisplay}</span>
            </div>
            <div className="orbital-bar-row">
              <span>{LORE.orbital.orbitalAegis}</span>
              <div className="orbital-bar track">
                <div
                  className="orbital-bar fill aegis"
                  style={{
                    width: `${(orbital.originalDefenseRating / maxBar) * 100}%`,
                  }}
                />
              </div>
              <span className="orbital-bar-value">{orbital.originalDefenseRating}</span>
            </div>
          </div>

          <div className="orbital-roles">
            <h3>{LORE.orbital.shipRolesTitle}</h3>
            <ul>
              <li>
                <strong>Obelisk Destroyers</strong> — +12% orbital battery weight each (
                {fleet.destroyer} hulls)
              </li>
              <li>
                <strong>Spectre Corvettes</strong> — scout aegis weak points (up to +18%
                erosion; +{Math.round(roles.scoutSuppression * 100)}% now)
              </li>
              <li>
                <strong>Sovereign Carriers</strong> — +6% legion deployment per hull (
                {fleet.carrier} carriers)
              </li>
              <li>
                <strong>Lance Frigates</strong> — screening reduces voidship losses (up to 20%)
              </li>
            </ul>
            <p className="orbital-fleet-line">
              Armada rating: {fleetPower} · Void projection: {roles.orbitalAttack}
            </p>
            <div className="orbital-ship-counts">
              {(Object.keys(fleet) as ShipType[]).map((type) => (
                <span key={type}>
                  {SHIP_INFO[type].icon} {SHIP_INFO[type].name}: {fleet[type]}
                </span>
              ))}
            </div>
          </div>

          {orbital.phase === 'doctrine' && (
            <div className="orbital-doctrine">
              <h3>{LORE.orbital.doctrineLabel}</h3>
              <div className="doctrine-grid">
                {ORBITAL_DOCTRINES.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    className={`doctrine-card${orbital.doctrine === doc.id ? ' selected' : ''}`}
                    onClick={() => setDoctrine(doc.id)}
                  >
                    <strong>{doc.name}</strong>
                    <p>{doc.tagline}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {orbital.phase === 'results' && result && (
            <div className={`orbital-result outcome-${result.outcome}`}>
              <h3>
                {result.outcome === 'decisive'
                  ? 'Decisive Void Victory'
                  : result.outcome === 'repulsed'
                    ? 'Orbital Repulse'
                    : result.outcome === 'costly'
                      ? 'Costly Orbital Victory'
                      : 'Contested Orbital Lanes'}
              </h3>
              <p>{result.chronicle}</p>
              <ul>
                <li>
                  Exchange: {result.attackScore} armada projection vs {result.defenseScore}{' '}
                  aegis
                </li>
                <li>Aegis erosion for ground phase: {Math.round(result.defenseSuppression * 100)}%</li>
                <li>Legion deployment multiplier: ×{result.deploymentMult.toFixed(2)}</li>
                <li>Legion striking power: ×{result.legionDamageMult.toFixed(2)}</li>
              </ul>
            </div>
          )}
          </>
          )}
        </div>

        <footer className="orbital-actions">
          {orbital.phase === 'doctrine' && (
            <>
              <button type="button" className="btn btn-retreat" onClick={cancel}>
                {LORE.orbital.abort}
              </button>
              <button type="button" className="btn btn-attack" onClick={commit}>
                {LORE.orbital.commit}
              </button>
            </>
          )}
          {orbital.phase === 'results' && (
            <button type="button" className="btn btn-attack" onClick={deploy}>
              {LORE.orbital.deployLegions}
            </button>
          )}
        </footer>
      </div>
    </div>
  )
}
