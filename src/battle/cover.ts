import { distance, isPointInRect, segmentIntersectsRect } from './geometry'
import type { BattleCover, BattleUnit, CoverLevel } from './types'

const COVER_DAMAGE_REDUCTION: Record<CoverLevel, number> = {
  none: 0,
  half: 0.3,
  full: 0.55,
}

const COVER_ACCURACY_PENALTY: Record<CoverLevel, number> = {
  none: 0,
  half: 0.15,
  full: 0.35,
}

export function hasLineOfSight(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  covers: BattleCover[]
): boolean {
  for (const cover of covers) {
    if (cover.level !== 'full') continue
    if (segmentIntersectsRect(fromX, fromY, toX, toY, cover)) {
      return false
    }
  }
  return true
}

export function getUnitCoverLevel(unit: BattleUnit, covers: BattleCover[]): CoverLevel {
  let best: CoverLevel = 'none'

  for (const cover of covers) {
    if (
      isPointInRect(unit.x, unit.y, {
        x: cover.x,
        y: cover.y,
        width: cover.width,
        height: cover.height,
      }, 10)
    ) {
      if (cover.level === 'full') return 'full'
      if (cover.level === 'half') best = 'half'
    }

    // Adjacent to cover (within 20px of edge)
    const nearRect = {
      x: cover.x - 20,
      y: cover.y - 20,
      width: cover.width + 40,
      height: cover.height + 40,
    }
    if (
      cover.level === 'half' &&
      isPointInRect(unit.x, unit.y, nearRect, 0) &&
      !isPointInRect(unit.x, unit.y, cover, 0)
    ) {
      best = 'half'
    }
  }

  return best
}

export function updateUnitCoverLevels(units: BattleUnit[], covers: BattleCover[]): void {
  for (const unit of units) {
    if (unit.state === 'dead' || unit.state === 'dying') continue
    unit.coverLevel = getUnitCoverLevel(unit, covers)
  }
}

export function getCoverDamageReduction(level: CoverLevel): number {
  return COVER_DAMAGE_REDUCTION[level]
}

export function getCoverAccuracyPenalty(level: CoverLevel): number {
  return COVER_ACCURACY_PENALTY[level]
}

export function findCoverPosition(
  unit: BattleUnit,
  threat: BattleUnit,
  covers: BattleCover[],
  fieldWidth: number,
  fieldHeight: number
): { x: number; y: number } | null {
  let best: { x: number; y: number; score: number } | null = null

  for (const cover of covers) {
    const positions = [
      { x: cover.x - 18, y: cover.y + cover.height / 2 },
      { x: cover.x + cover.width + 18, y: cover.y + cover.height / 2 },
      { x: cover.x + cover.width / 2, y: cover.y - 18 },
      { x: cover.x + cover.width / 2, y: cover.y + cover.height + 18 },
    ]

    for (const pos of positions) {
      if (pos.x < 30 || pos.y < 30 || pos.x > fieldWidth - 30 || pos.y > fieldHeight - 30) {
        continue
      }

      const distToThreat = distance(pos.x, pos.y, threat.x, threat.y)
      const distToUnit = distance(pos.x, pos.y, unit.x, unit.y)
      const losBlocked = !hasLineOfSight(threat.x, threat.y, pos.x, pos.y, covers)
      const coverBonus = cover.level === 'full' ? 2 : 1

      const score = (losBlocked ? 3 : 0) * coverBonus - distToUnit * 0.01 - distToThreat * 0.005

      if (!best || score > best.score) {
        best = { ...pos, score }
      }
    }
  }

  return best ? { x: best.x, y: best.y } : null
}

export function applyCoverToDamage(baseDamage: number, target: BattleUnit): number {
  const reduction = getCoverDamageReduction(target.coverLevel)
  return Math.max(1, Math.floor(baseDamage * (1 - reduction)))
}

export function rollHit(attacker: BattleUnit, target: BattleUnit, covers: BattleCover[]): boolean {
  if (!hasLineOfSight(attacker.x, attacker.y, target.x, target.y, covers)) {
    return false
  }

  let accuracy = 0.82
  if (attacker.holdPosition) accuracy += 0.08
  if (attacker.suppressedTimer > 0) accuracy -= 0.2
  if (attacker.state === 'moving') accuracy -= 0.12
  accuracy -= getCoverAccuracyPenalty(target.coverLevel)
  if (target.suppressedTimer > 0) accuracy += 0.1

  return Math.random() < clampAccuracy(accuracy)
}

function clampAccuracy(value: number): number {
  return Math.max(0.15, Math.min(0.95, value))
}
