import { distance } from './geometry'
import { applyCoverToDamage, hasLineOfSight } from './cover'
import type { BattleExplosion, BattleState, BattleUnit } from './types'

export const GRENADE_COOLDOWN = 10
export const GRENADE_RADIUS = 55
export const GRENADE_DAMAGE = 45
export const LANCE_VOLLEY_RADIUS = 72
export const LANCE_VOLLEY_DAMAGE = 38
export const LANCE_VOLLEY_COOLDOWN = 18
export const SUPPRESSIVE_FIRE_DURATION = 4.5
export const SUPPRESSIVE_FIRE_COOLDOWN = 22
export const VITAE_STIM_HEAL = 32
export const VITAE_STIM_COOLDOWN = 20
export const SUPPRESS_DURATION = 2.5
export const SUPPRESS_CHANCE = 0.35
export const SUPPRESSIVE_FIRE_CHANCE = 0.62

export const DEFAULT_SQUAD_COOLDOWNS = {
  suppressiveFire: 0,
  lanceVolley: 0,
  vitaeStim: 0,
}

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
      applySuppress(unit, unit.team === 'player' ? state.playerSuppressionMult : 1)
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

export function applySuppress(target: BattleUnit, durationMult = 1): void {
  target.suppressedTimer = Math.max(target.suppressedTimer, SUPPRESS_DURATION * durationMult)
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
  if (unit.suppressiveFireTimer > 0) interval *= 0.78
  return interval
}

function livingSelectedPlayerUnits(state: BattleState): BattleUnit[] {
  const selected = new Set(state.selectedUnitIds)
  return state.units.filter(
    (u) =>
      selected.has(u.id) &&
      u.team === 'player' &&
      u.state !== 'dead' &&
      u.state !== 'dying'
  )
}

export function activateSuppressiveFire(state: BattleState): BattleState {
  if (state.squadCooldowns.suppressiveFire > 0) return state
  const selected = livingSelectedPlayerUnits(state)
  if (selected.length === 0) return state

  const units = state.units.map((unit) => {
    if (!selected.some((s) => s.id === unit.id)) return unit
    return { ...unit, suppressiveFireTimer: SUPPRESSIVE_FIRE_DURATION }
  })

  return {
    ...state,
    units,
    squadCooldowns: {
      ...state.squadCooldowns,
      suppressiveFire: SUPPRESSIVE_FIRE_COOLDOWN,
    },
    activeAbility: 'none',
  }
}

export function throwLanceVolley(
  state: BattleState,
  x: number,
  y: number
): BattleState {
  if (state.squadCooldowns.lanceVolley > 0) return state

  const units = state.units.map((u) => ({ ...u }))
  for (const unit of units) {
    if (unit.state === 'dead' || unit.state === 'dying') continue
    const dist = distance(unit.x, unit.y, x, y)
    if (dist > LANCE_VOLLEY_RADIUS) continue

    const falloff = 1 - dist / LANCE_VOLLEY_RADIUS
    let damage = Math.floor(LANCE_VOLLEY_DAMAGE * falloff)
    if (unit.team === 'player') damage = Math.floor(damage * 0.2)

    unit.health -= Math.max(8, Math.floor(applyCoverToDamage(damage, unit) * 1.15))
    if (unit.health <= 0) {
      unit.health = 0
      unit.state = 'dying'
      unit.stateTimer = 0
      unit.moveTargetX = null
      unit.moveTargetY = null
    } else if (unit.team === 'enemy') {
      applySuppress(unit, state.playerSuppressionMult)
    }
  }

  const explosion: BattleExplosion = {
    id: `lance-${Date.now()}`,
    x,
    y,
    radius: LANCE_VOLLEY_RADIUS,
    life: 0.45,
    maxLife: 0.45,
    team: 'player',
  }

  return {
    ...state,
    units,
    explosions: [...state.explosions, explosion],
    squadCooldowns: {
      ...state.squadCooldowns,
      lanceVolley: LANCE_VOLLEY_COOLDOWN,
    },
    activeAbility: 'none',
  }
}

export function applyVitaeStim(state: BattleState): BattleState {
  if (state.squadCooldowns.vitaeStim > 0) return state
  const selected = livingSelectedPlayerUnits(state)
  if (selected.length === 0) return state

  const selectedIds = new Set(selected.map((u) => u.id))
  const units = state.units.map((unit) => {
    if (!selectedIds.has(unit.id)) return unit
    return {
      ...unit,
      health: Math.min(unit.maxHealth, unit.health + VITAE_STIM_HEAL),
      suppressedTimer: Math.max(0, unit.suppressedTimer - 1.2),
    }
  })

  return {
    ...state,
    units,
    squadCooldowns: {
      ...state.squadCooldowns,
      vitaeStim: VITAE_STIM_COOLDOWN,
    },
    activeAbility: 'none',
  }
}

export function tickSquadCooldowns(
  cooldowns: BattleState['squadCooldowns'],
  dt: number
): BattleState['squadCooldowns'] {
  return {
    suppressiveFire: Math.max(0, cooldowns.suppressiveFire - dt),
    lanceVolley: Math.max(0, cooldowns.lanceVolley - dt),
    vitaeStim: Math.max(0, cooldowns.vitaeStim - dt),
  }
}
