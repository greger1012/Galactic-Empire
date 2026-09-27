import {
  TECH_BRANCH_LABELS,
  TECH_LIST,
  TECHS,
  canResearch,
  type TechBranch,
  type TechId,
} from '../game/research'
import { getEmpireNoosphereSummary, getMandateFocus } from '../game/mandateGuide'
import { useGameStore, useResearchRate } from '../store/gameStore'

const BRANCHES: TechBranch[] = ['economy', 'military', 'science']

export function ResearchPanel() {
  const research = useGameStore((s) => s.research)
  const startResearch = useGameStore((s) => s.startResearch)
  const rate = useResearchRate()
  const noosphere = useGameStore((s) => getEmpireNoosphereSummary(s))
  const mandateFocus = useGameStore((s) => getMandateFocus(s))

  const current = research.current ? TECHS[research.current as TechId] : null
  const progressPct = current ? Math.min(100, (research.progress / current.cost) * 100) : 0
  const cyclesLeft = current
    ? Math.max(0, Math.ceil((current.cost - research.progress) / rate))
    : 0

  return (
    <section className={`panel research-panel${mandateFocus === 'research' ? ' mandate-focus' : ''}`}>
      <h2>Noospheric Research</h2>
      <p className="research-empire-rate">
        Empire: {noosphere.throneNodeTiers} throne-node tiers · {noosphere.insightPerCycle.toFixed(1)}{' '}
        insight / cycle
      </p>

      <div className="research-status">
        {current ? (
          <>
            <div className="research-current">
              <span className="research-icon">{current.icon}</span>
              <div>
                <strong>{current.name}</strong>
                <p>{current.description}</p>
              </div>
            </div>
            <div className="research-bar">
              <div className="research-bar-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="research-meta">
              <span>
                {Math.floor(research.progress)} / {current.cost} insight
              </span>
              <span>~{cyclesLeft} cycles remaining</span>
            </div>
          </>
        ) : (
          <p className="research-idle">
            No inquiry in progress. Select a discipline below to direct the Noosphere.
          </p>
        )}
        <div className="research-rate">
          Insight per cycle: <strong>{rate.toFixed(1)}</strong>
          <span className="research-hint"> · raised by Noospheric Throne Node tiers</span>
        </div>
      </div>

      <div className="tech-branches">
        {BRANCHES.map((branch) => {
          const info = TECH_BRANCH_LABELS[branch]
          const techs = TECH_LIST.filter((t) => t.branch === branch).sort(
            (a, b) => a.tier - b.tier
          )
          return (
            <div key={branch} className="tech-branch">
              <h3 style={{ color: info.color }}>{info.label}</h3>
              <div className="tech-list">
                {techs.map((tech) => {
                  const done = research.researched.includes(tech.id)
                  const active = research.current === tech.id
                  const available = canResearch(tech, research.researched)
                  const missing = tech.requires.filter(
                    (r) => !research.researched.includes(r)
                  )
                  const className = [
                    'tech-card',
                    done ? 'done' : '',
                    active ? 'active' : '',
                    !done && !available ? 'locked' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')

                  return (
                    <button
                      key={tech.id}
                      className={className}
                      disabled={done || active || !available}
                      onClick={() => startResearch(tech.id)}
                      style={{ borderColor: done || active ? info.color : undefined }}
                      title={
                        missing.length > 0
                          ? `Requires: ${missing.map((m) => TECHS[m].name).join(', ')}`
                          : tech.description
                      }
                    >
                      <span className="tech-icon">{tech.icon}</span>
                      <div className="tech-body">
                        <div className="tech-title">
                          <span>{tech.name}</span>
                          <span className="tech-tier">T{tech.tier}</span>
                        </div>
                        <p className="tech-effect">{tech.effect}</p>
                        {missing.length > 0 && (
                          <p className="tech-requires">
                            Requires {missing.map((m) => TECHS[m].name).join(', ')}
                          </p>
                        )}
                      </div>
                      <span className="tech-cost">
                        {done ? 'Known' : active ? 'Researching' : `${tech.cost} insight`}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
