interface CombatBriefingCardProps {
  title: string
  intro: string
  bullets: string[]
  confirmLabel: string
  onConfirm: () => void
}

export function CombatBriefingCard({
  title,
  intro,
  bullets,
  confirmLabel,
  onConfirm,
}: CombatBriefingCardProps) {
  return (
    <div className="combat-briefing-layer" role="dialog" aria-modal="true" aria-labelledby="combat-briefing-title">
      <div className="combat-briefing-card panel">
        <p className="combat-briefing-tag">First engagement primer</p>
        <h3 id="combat-briefing-title">{title}</h3>
        <p className="combat-briefing-intro">{intro}</p>
        <ul className="combat-briefing-list">
          {bullets.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <button type="button" className="btn btn-primary combat-briefing-confirm" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </div>
  )
}
