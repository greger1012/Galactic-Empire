import { getUnitTooltipInfo } from '../battle/unitMeta'
import type { BattleUnit } from '../battle/types'

interface BattleUnitTooltipProps {
  unit: BattleUnit
  x: number
  y: number
  wrapWidth: number
  wrapHeight: number
}

export function BattleUnitTooltip({ unit, x, y, wrapWidth, wrapHeight }: BattleUnitTooltipProps) {
  const info = getUnitTooltipInfo(unit)
  const tooltipW = 200
  const tooltipH = 72
  const pad = 12
  let left = x + 14
  let top = y - tooltipH - 8
  if (left + tooltipW > wrapWidth - pad) left = x - tooltipW - 14
  if (top < pad) top = y + 16
  if (top + tooltipH > wrapHeight - pad) top = wrapHeight - tooltipH - pad

  return (
    <div
      className={`battle-unit-tooltip ${unit.team === 'player' ? 'player' : 'enemy'}`}
      style={{ left, top, width: tooltipW }}
      role="tooltip"
    >
      <span className="battle-unit-tooltip-faction">{info.teamLabel}</span>
      <strong className="battle-unit-tooltip-title">{info.title}</strong>
      <span className="battle-unit-tooltip-sub">{info.subtitle}</span>
      <span className="battle-unit-tooltip-detail">{info.detail}</span>
    </div>
  )
}
