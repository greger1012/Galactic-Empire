import { distance } from './geometry'
import { findCoverPosition, hasLineOfSight } from './cover'
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
  elapsed: number
): void {
  if (unit.holdPosition) return

  const enemies = units.filter((u) => u.team === 'player' && u.state !== 'dead' && u.state !== 'dying')
  if (enemies.length === 0) return

  const allies = units.filter((u) => u.team === 'enemy' && u.state !== 'dead' && u.state !== 'dying')

  const healthRatio = unit.health / unit.maxHealth
  const underPressure = healthRatio < 0.45

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
  if (
    unit.grenadeCooldown <= 0 &&
    dist < 200 &&
    dist > 80 &&
    enemies.filter((e) => distance(e.x, e.y, target.x, target.y) < 60).length >= 2 &&
    Math.random() < 0.004
  ) {
    unit.pendingGrenade = { x: target.x, y: target.y }
    unit.moveTargetX = null
    unit.moveTargetY = null
    return
  }

  if (!hasLOS || dist > unit.range * 0.9) {
    // Flank instead of charging straight
    const flank = findFlankPosition(unit, target, allies, fieldWidth, fieldHeight)
    unit.moveTargetX = flank.x
    unit.moveTargetY = flank.y
  } else if (dist < unit.range * 0.4 && unit.coverLevel === 'none' && Math.random() < 0.3) {
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
    unit.moveTargetX = target.x - 60
    unit.moveTargetY = target.y
  }
}
