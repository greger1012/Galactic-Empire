import { FACTION_PULSE_INTERVAL } from '../game/factionPulse'
import { LORE } from '../game/lore'
import { getDeepVoidTierLabel } from '../game/deepVoid'
import { useGameStore } from '../store/gameStore'

export function FactionPulseIndicator() {
  const tickCount = useGameStore((s) => s.tickCount)
  const frontierWave = useGameStore((s) => s.frontier.wave)
  const mod = tickCount % FACTION_PULSE_INTERVAL
  const cyclesUntilPulse = mod === 0 ? FACTION_PULSE_INTERVAL : FACTION_PULSE_INTERVAL - mod

  return (
    <p className="faction-pulse-indicator">
      Rival pulse in <strong>{cyclesUntilPulse}</strong> {LORE.cycleLabel.toLowerCase()}
      {cyclesUntilPulse === 1 ? '' : 's'}
      {frontierWave > 2 && (
        <>
          {' '}
          · {getDeepVoidTierLabel(frontierWave)} pressure on raids
        </>
      )}
    </p>
  )
}
