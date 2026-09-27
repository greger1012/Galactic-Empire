import { distance } from './geometry'
import { findCoverPosition, hasLineOfSight } from './cover'
import type { FactionAITuning } from './factionAI'
import type { BattleCover, BattleUnit } from './types'

function findNearestEnemy(unit: BattleUnit, units: BattleUnit[]): BattleUnit | null {
  let nearest: BattleUnit | null = null
  let nearestDist = Infinity

  for (const other of units) {
    if (other.team === unit.team || other.state === 'dead' || other.state === 'dying') continue
    const dist = distance(unit.x, unit.y, other.x, other.y)
    if (dist < nearestDist) {
      nearestDist = dist
      nearest = other
    }
  }

  return nearest
}

function findWeakestEnemy(unit: BattleUnit, units: BattleUnit[], range: number): BattleUnit | null {
  let target: BattleUnit | null = null
  let lowestHealth = Infinity

  for (const other of units) {
    if (other.team === unit.team || other.state === 'dead' || other.state === 'dying') continue
    if (distance(unit.x, unit.y, other.x, other.y) > range) continue
    if (other.health < lowestHealth) {
      lowestHealth = other.health
      target = other
    }
  }

  return target
}

function findFlankPosition(
  unit: BattleUnit,
  target: BattleUnit,
  allies: BattleUnit[],
  fieldWidth: number,
  fieldHeight: number
): { x: number; y: number } {
  const angleToTarget = Math.atan2(target.y - unit.y, target.x - unit.x)
  const flankAngles = [angleToTarget + Math.PI / 2, angleToTarget - Math.PI / 2]
  const dist = unit.range * 0.75

  let best = { x: target.x, y: target.y }
  let bestScore = -Infinity

  for (const angle of flankAngles) {
    const x = clamp(target.x + Math.cos(angle) * dist, 40, fieldWidth - 40)
    const y = clamp(target.y + Math.sin(angle) * dist, 40, fieldHeight - 40)
    const allyOverlap = allies.filter(
      (a) => a.id !== unit.id && distance(a.x, a.y, x, y) < 30
    ).length
    const score = -allyOverlap * 2 - distance(unit.x, unit.y, x, y) * 0.02
    if (score > bestScore) {
      bestScore = score
      best = { x, y }
    }
  }

  return best
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

export function updateEnemyAI(
  unit: BattleUnit,
  units: BattleUnit[],
  covers: BattleCover[],
  fieldWidth: number,
  fieldHeight: number,
  elapsed: number,
  tuning: FactionAITuning
): void {
  if (unit.holdPosition) return

  const enemies = units.filter((u) => u.team === 'player' && u.state !== 'dead' && u.state !== 'dying')
  if (enemies.length === 0) return

  const allies = units.filter((u) => u.team === 'enemy' && u.state !== 'dead' && u.state !== 'dying')

  const healthRatio = unit.health / unit.maxHealth
  const underPressure = healthRatio < (0.45 / tuning.coverSeekMult)

  let target = findWeakestEnemy(unit, units, unit.range * 1.2) ?? findNearestEnemy(unit, units)
  if (!target) return

  const dist = distance(unit.x, unit.y, target.x, target.y)
  const hasLOS = hasLineOfSight(unit.x, unit.y, target.x, target.y, covers)

  // Seek cover when wounded
  if (underPressure && unit.coverLevel === 'none') {
    const coverPos = findCoverPosition(unit, target, covers, fieldWidth, fieldHeight)
    if (coverPos) {
      unit.moveTargetX = coverPos.x
      unit.moveTargetY = coverPos.y
      return
    }
  }

  // Occasional grenade
  const grenadeRoll = 0.004 * tuning.grenadeChanceMult
  if (
    unit.grenadeCooldown <= 0 &&
    dist < 200 &&
    dist > 80 &&
    enemies.filter((e) => distance(e.x, e.y, target.x, target.y) < 60).length >= 2 &&
    Math.random() < grenadeRoll
  ) {
    unit.pendingGrenade = { x: target.x, y: target.y }
    unit.moveTargetX = null
    unit.moveTargetY = null
    return
  }

  const flankChance = Math.min(0.85, 0.3 * tuning.flankAggression)
  const rangeThreshold = unit.range * (0.9 * tuning.rangeHoldMult)

  if (!hasLOS || dist > rangeThreshold) {
    if (tuning.advanceAggression > 1.1 && dist > unit.range && Math.random() < 0.35) {
      unit.moveTargetX = target.x - 50
      unit.moveTargetY = target.y
    } else {
      const flank = findFlankPosition(unit, target, allies, fieldWidth, fieldHeight)
      const blend = tuning.flankAggression
      unit.moveTargetX = unit.x + (flank.x - unit.x) * blend
      unit.moveTargetY = unit.y + (flank.y - unit.y) * blend
    }
  } else if (dist < unit.range * 0.4 && unit.coverLevel === 'none' && Math.random() < flankChance) {
    // Back off slightly to maintain range
    const dx = unit.x - target.x
    const dy = unit.y - target.y
    const len = Math.hypot(dx, dy) || 1
    unit.moveTargetX = unit.x + (dx / len) * 40
    unit.moveTargetY = unit.y + (dy / len) * 40
  } else {
    unit.moveTargetX = null
    unit.moveTargetY = null
    unit.facing = Math.atan2(target.y - unit.y, target.x - unit.x)
    unit.shootTargetId = target.id
  }

  // Suppress idle jitter early battle
  if (elapsed < 1 && dist > unit.range) {
    const advance = 60 * tuning.advanceAggression
    unit.moveTargetX = target.x - advance
    unit.moveTargetY = target.y
  }
}
