import { ORBITAL_DOCTRINES } from '../battle/orbitalEngagement'
import { useMemo } from 'react'
import type { ConquestDossier } from '../game/conquestAssessment'
import { buildConquestDossier } from '../game/conquestAssessment'
import { useFleetPower, useGameStore, useTechModifiers } from '../store/gameStore'

const THREAT_CLASS: Record<ConquestDossier['threatTier'], string> = {
  favorable: 'threat-favorable',
  contested: 'threat-contested',
  punishing: 'threat-punishing',
  dire: 'threat-dire',
  apex: 'threat-apex',
}

export function ConquestDossierPanel({ planetId }: { planetId: string }) {
  const planets = useGameStore((s) => s.planets)
  const starSystems = useGameStore((s) => s.starSystems)
  const fleet = useGameStore((s) => s.fleet)
  const mods = useTechModifiers()
  const fleetPower = useFleetPower()

  const dossier = useMemo(
    () => buildConquestDossier(useGameStore.getState(), planetId, fleet, mods),
    [planetId, planets, starSystems, fleet, mods, fleetPower]
  )

  if (!dossier) return null

  const doctrineName =
    ORBITAL_DOCTRINES.find((d) => d.id === dossier.recommendedDoctrine)?.name ??
    dossier.recommendedDoctrine

  return (
    <div className={`conquest-dossier ${THREAT_CLASS[dossier.threatTier]}`}>
      <div className="conquest-dossier-header">
        <span className="conquest-threat-label">{dossier.threatLabel}</span>
        <span className="conquest-void-tier">{dossier.voidTierLabel}</span>
      </div>
      <p className="conquest-threat-summary">{dossier.threatSummary}</p>

      <dl className="conquest-stats">
        <div>
          <dt>Orbital aegis</dt>
          <dd>
            {dossier.baseAegis}
            {dossier.garrisonBonus > 0 && (
              <span className="conquest-garrison">
                {' '}
                +{dossier.garrisonBonus} garrison
              </span>
            )}{' '}
            = <strong>{dossier.effectiveAegis}</strong>
          </dd>
        </div>
        <div>
          <dt>Void projection</dt>
          <dd>
            {dossier.armadaProjection} <span className="conquest-muted">(armada {dossier.fleetPower})</span>
          </dd>
        </div>
        <div>
          <dt>Legion estimate</dt>
          <dd>
            {dossier.playerLegions} throne legions vs ~{dossier.hostileLegions}{' '}
            {dossier.hostileRoster}
          </dd>
        </div>
        <div>
          <dt>Biome</dt>
          <dd>
            {dossier.biomeLabel} — {dossier.biomeHint}
          </dd>
        </div>
        {dossier.siblingContested > 0 && (
          <div>
            <dt>System web</dt>
            <dd>
              {dossier.siblingContested} other contested world
              {dossier.siblingContested === 1 ? '' : 's'} stiffen local garrisons
              {dossier.factionName ? ` (${dossier.factionName})` : ''}.
            </dd>
          </div>
        )}
        <div>
          <dt>Suggested doctrine</dt>
          <dd>
            <strong>{doctrineName}</strong> — {dossier.doctrineReason}
          </dd>
        </div>
      </dl>
    </div>
  )
}
