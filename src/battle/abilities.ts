import { distance } from './geometry'
import { applyCoverToDamage, hasLineOfSight } from './cover'
import type { BattleExplosion, BattleState, BattleUnit } from './types'

export const GRENADE_COOLDOWN = 10
export const GRENADE_RADIUS = 55
export const GRENADE_DAMAGE = 45
export const SUPPRESS_DURATION = 2.5
export const SUPPRESS_CHANCE = 0.35

export function throwGrenade(
  state: BattleState,
  x: number,
  y: number,
  team: BattleUnit['team']
): BattleState {
  const units = state.units.map((u) => ({ ...u }))
  const living = units.filter(
    (u) => u.team === team && u.state !== 'dead' && u.state !== 'dying' && u.grenadeCooldown <= 0
  )

  if (living.length === 0) return state

  const thrower = living[0]
  thrower.grenadeCooldown = GRENADE_COOLDOWN
  thrower.state = 'shooting'
  thrower.stateTimer = 0
  thrower.facing = Math.atan2(y - thrower.y, x - thrower.x)

  for (const unit of units) {
    if (unit.state === 'dead' || unit.state === 'dying') continue
    const dist = distance(unit.x, unit.y, x, y)
    if (dist > GRENADE_RADIUS) continue

    const falloff = 1 - dist / GRENADE_RADIUS
    let damage = Math.floor(GRENADE_DAMAGE * falloff)
    if (unit.team === team) damage = Math.floor(damage * 0.25)

    unit.health -= applyCoverToDamage(damage, unit)
    if (unit.health <= 0) {
      unit.health = 0
      unit.state = 'dying'
      unit.stateTimer = 0
      unit.moveTargetX = null
      unit.moveTargetY = null
    } else if (unit.team !== team) {
      unit.suppressedTimer = Math.max(unit.suppressedTimer, SUPPRESS_DURATION)
    }
  }

  const explosion: BattleExplosion = {
    id: `nade-${Date.now()}`,
    x,
    y,
    radius: GRENADE_RADIUS,
    life: 0.5,
    maxLife: 0.5,
    team,
  }

  return {
    ...state,
    units,
    explosions: [...state.explosions, explosion],
    activeAbility: 'none',
  }
}

export function applySuppress(target: BattleUnit): void {
  target.suppressedTimer = Math.max(target.suppressedTimer, SUPPRESS_DURATION)
}

export function toggleHoldPosition(state: BattleState): BattleState {
  const selected = new Set(state.selectedUnitIds)
  const anyNotHolding = state.units.some(
    (u) => selected.has(u.id) && u.team === 'player' && !u.holdPosition
  )

  const units = state.units.map((unit) => {
    if (!selected.has(unit.id) || unit.team !== 'player') return unit
    if (unit.state === 'dead' || unit.state === 'dying') return unit
    const hold = anyNotHolding
    return {
      ...unit,
      holdPosition: hold,
      moveTargetX: hold ? null : unit.moveTargetX,
      moveTargetY: hold ? null : unit.moveTargetY,
    }
  })

  return { ...state, units }
}

export function canShootAt(
  attacker: BattleUnit,
  target: BattleUnit,
  covers: BattleState['covers']
): boolean {
  return (
    distance(attacker.x, attacker.y, target.x, target.y) <= attacker.range &&
    hasLineOfSight(attacker.x, attacker.y, target.x, target.y, covers)
  )
}

export function getFireInterval(unit: BattleUnit): number {
  let interval = unit.fireInterval
  if (unit.suppressedTimer > 0) interval *= 1.6
  if (unit.holdPosition) interval *= 0.85
  return interval
}
