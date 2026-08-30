import {
  applySuppress,
  canShootAt,
  getFireInterval,
  throwGrenade,
  SUPPRESS_CHANCE,
} from './abilities'
import {
  applyCoverToDamage,
  rollHit,
  updateUnitCoverLevels,
} from './cover'
import { updateEnemyAI } from './enemyAI'
import { distance, getUnitsInRect, isBlocked } from './geometry'
import type { BattleState, BattleStatus, BattleTracer, BattleUnit } from './types'

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

function applyDamage(
  attacker: BattleUnit,
  target: BattleUnit,
  tracers: BattleTracer[],
  tracerId: number,
  hit: boolean
): number {
  const blocked = !hit
  tracers.push({
    id: `tracer-${tracerId}`,
    fromX: attacker.x,
    fromY: attacker.y,
    toX: target.x,
    toY: target.y,
    team: attacker.team,
    life: 0.12,
    blocked,
  })

  if (hit) {
    const damage = applyCoverToDamage(attacker.damage, target)
    target.health -= damage
    if (attacker.team === 'player' && Math.random() < SUPPRESS_CHANCE) {
      applySuppress(target)
    }

    if (target.health <= 0 && target.state !== 'dying' && target.state !== 'dead') {
      target.health = 0
      target.state = 'dying'
      target.stateTimer = 0
      target.moveTargetX = null
      target.moveTargetY = null
    }
  }

  return tracerId + 1
}

function moveUnit(unit: BattleUnit, dt: number, covers: BattleState['covers']): void {
  if (unit.moveTargetX === null || unit.moveTargetY === null) return
  if (unit.holdPosition) return

  const dx = unit.moveTargetX - unit.x
  const dy = unit.moveTargetY - unit.y
  const dist = Math.hypot(dx, dy)

  if (dist < 4) {
    unit.moveTargetX = null
    unit.moveTargetY = null
    if (unit.state === 'moving') unit.state = 'idle'
    return
  }

  unit.state = 'moving'
  const step = unit.moveSpeed * dt * (unit.suppressedTimer > 0 ? 0.75 : 1)
  const nx = unit.x + (dx / dist) * step
  const ny = unit.y + (dy / dist) * step

  if (!isBlocked(nx, ny, covers)) {
    unit.x = nx
    unit.y = ny
    unit.facing = Math.atan2(dy, dx)
  } else {
    unit.moveTargetX = null
    unit.moveTargetY = null
    unit.state = 'idle'
  }
}

export function updateBattle(state: BattleState, dt: number): BattleState {
  if (state.status !== 'active' || state.paused) return state

  const units = state.units.map((u) => ({ ...u }))
  let tracers = state.tracers.map((t) => ({ ...t, life: t.life - dt })).filter((t) => t.life > 0)
  let explosions = state.explosions
    .map((e) => ({ ...e, life: e.life - dt }))
    .filter((e) => e.life > 0)
  let tracerId = Date.now()
  let nextState: BattleState = { ...state, units, tracers, explosions }

  updateUnitCoverLevels(units, state.covers)

  // Process pending grenades from previous frame
  const grenadesToThrow: { x: number; y: number; team: BattleUnit['team']; id: string }[] = []
  for (const unit of nextState.units) {
    if (unit.pendingGrenade && unit.grenadeCooldown <= 0) {
      grenadesToThrow.push({
        x: unit.pendingGrenade.x,
        y: unit.pendingGrenade.y,
        team: unit.team,
        id: unit.id,
      })
    }
  }
  for (const grenade of grenadesToThrow) {
    nextState = throwGrenade(nextState, grenade.x, grenade.y, grenade.team)
  }
  if (grenadesToThrow.length > 0) {
    nextState = {
      ...nextState,
      units: nextState.units.map((u) => ({ ...u, pendingGrenade: null })),
    }
  }

  for (const unit of nextState.units) {
    unit.animFrame += dt * 10
    unit.stateTimer += dt
    if (unit.suppressedTimer > 0) unit.suppressedTimer -= dt
    if (unit.grenadeCooldown > 0.1) unit.grenadeCooldown -= dt

    if (unit.state === 'dying') {
      if (unit.stateTimer > 0.9) unit.state = 'dead'
      continue
    }

    if (unit.state === 'dead') continue

    if (unit.team === 'enemy') {
      updateEnemyAI(unit, nextState.units, state.covers, state.width, state.height, state.elapsed)
    }

    moveUnit(unit, dt, state.covers)

    unit.fireCooldown -= dt

    const shootTarget =
      unit.shootTargetId !== null
        ? nextState.units.find((u) => u.id === unit.shootTargetId)
        : findNearestEnemy(unit, nextState.units)

    if (
      shootTarget &&
      shootTarget.state !== 'dead' &&
      shootTarget.state !== 'dying' &&
      canShootAt(unit, shootTarget, state.covers) &&
      unit.fireCooldown <= 0
    ) {
      unit.state = 'shooting'
      unit.stateTimer = 0
      unit.facing = Math.atan2(shootTarget.y - unit.y, shootTarget.x - unit.x)
      const hit = rollHit(unit, shootTarget, state.covers)
      tracerId = applyDamage(unit, shootTarget, tracers, tracerId, hit)
      unit.fireCooldown = getFireInterval(unit)
      unit.shootTargetId = shootTarget.id
    } else if (unit.state === 'shooting' && unit.stateTimer > 0.18) {
      unit.state = unit.moveTargetX !== null ? 'moving' : 'idle'
    }
  }

  const livingPlayer = nextState.units.filter(
    (u) => u.team === 'player' && u.state !== 'dead' && u.state !== 'dying'
  )
  const livingEnemy = nextState.units.filter(
    (u) => u.team === 'enemy' && u.state !== 'dead' && u.state !== 'dying'
  )

  let status: BattleStatus = state.status
  if (livingEnemy.length === 0) status = 'victory'
  if (livingPlayer.length === 0) status = 'defeat'

  return {
    ...nextState,
    tracers,
    status,
    elapsed: state.elapsed + dt,
  }
}

export function getUnitAtPosition(
  state: BattleState,
  x: number,
  y: number
): BattleUnit | null {
  for (let i = state.units.length - 1; i >= 0; i--) {
    const unit = state.units[i]
    if (unit.state === 'dead') continue
    if (distance(unit.x, unit.y, x, y) < 18) return unit
  }
  return null
}

export function issueMoveOrder(state: BattleState, x: number, y: number): BattleState {
  const selected = state.selectedUnitIds
  if (selected.length === 0) return state

  const selectedUnits = state.units.filter((u) => selected.includes(u.id))
  const count = selectedUnits.length
  const angleStep = (Math.PI * 2) / Math.max(count, 1)
  const spread = Math.min(36, 12 + count * 4)

  const units = state.units.map((unit) => {
    if (!selected.includes(unit.id) || unit.team !== 'player') return unit
    if (unit.state === 'dying' || unit.state === 'dead') return unit

    const index = selectedUnits.findIndex((u) => u.id === unit.id)
    const angle = angleStep * index
    const offsetX = Math.cos(angle) * spread
    const offsetY = Math.sin(angle) * spread

    return {
      ...unit,
      holdPosition: false,
      moveTargetX: x + offsetX,
      moveTargetY: y + offsetY,
      shootTargetId: null,
    }
  })

  return { ...state, units, activeAbility: 'none' }
}

export function selectUnits(state: BattleState, unitIds: string[]): BattleState {
  return { ...state, selectedUnitIds: unitIds, activeAbility: 'none' }
}

export function addToSelection(state: BattleState, unitId: string): BattleState {
  if (state.selectedUnitIds.includes(unitId)) return state
  return { ...state, selectedUnitIds: [...state.selectedUnitIds, unitId] }
}

export function boxSelectUnits(state: BattleState, drag: BattleState['dragSelect']): BattleState {
  if (!drag) return { ...state, dragSelect: null }
  const units = getUnitsInRect(
    state.units,
    drag.startX,
    drag.startY,
    drag.endX,
    drag.endY,
    'player'
  )
  return {
    ...state,
    selectedUnitIds: units.map((u) => u.id),
    dragSelect: null,
    activeAbility: 'none',
  }
}

export function togglePause(state: BattleState): BattleState {
  return { ...state, paused: !state.paused }
}

export function setActiveAbility(
  state: BattleState,
  ability: BattleState['activeAbility']
): BattleState {
  return { ...state, activeAbility: ability }
}

export function getSurvivalRatio(state: BattleState): number {
  const alive = state.units.filter(
    (u) => u.team === 'player' && u.state !== 'dead' && u.state !== 'dying'
  ).length
  return state.initialPlayerCount > 0 ? alive / state.initialPlayerCount : 0
}

export { toggleHoldPosition, throwGrenade } from './abilities'
