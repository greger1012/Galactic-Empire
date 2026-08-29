import type { BattleState, BattleStatus, BattleTracer, BattleUnit } from './types'

function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1)
}

function isBlocked(x: number, y: number, covers: BattleState['covers'], radius = 14): boolean {
  return covers.some(
    (c) => x > c.x - radius && x < c.x + c.width + radius && y > c.y - radius && y < c.y + c.height + radius
  )
}

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
  tracerId: number
): number {
  target.health -= attacker.damage
  tracers.push({
    id: `tracer-${tracerId}`,
    fromX: attacker.x,
    fromY: attacker.y,
    toX: target.x,
    toY: target.y,
    team: attacker.team,
    life: 0.12,
  })

  if (target.health <= 0 && target.state !== 'dying' && target.state !== 'dead') {
    target.health = 0
    target.state = 'dying'
    target.stateTimer = 0
    target.moveTargetX = null
    target.moveTargetY = null
  }

  return tracerId + 1
}

function moveUnit(unit: BattleUnit, dt: number, covers: BattleState['covers']): void {
  if (unit.moveTargetX === null || unit.moveTargetY === null) return

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
  const step = unit.moveSpeed * dt
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

function updateEnemyAI(unit: BattleUnit, units: BattleUnit[], covers: BattleState['covers']): void {
  const target = findNearestEnemy(unit, units)
  if (!target) return

  const dist = distance(unit.x, unit.y, target.x, target.y)

  if (dist > unit.range * 0.85) {
    const dx = target.x - unit.x
    const dy = target.y - unit.y
    const len = Math.hypot(dx, dy) || 1
    const approachDist = unit.range * 0.7
    unit.moveTargetX = target.x - (dx / len) * approachDist
    unit.moveTargetY = target.y - (dy / len) * approachDist

    if (isBlocked(unit.moveTargetX, unit.moveTargetY, covers)) {
      unit.moveTargetX = target.x
      unit.moveTargetY = target.y
    }
  } else {
    unit.moveTargetX = null
    unit.moveTargetY = null
    unit.facing = Math.atan2(target.y - unit.y, target.x - unit.x)
  }
}

export function updateBattle(state: BattleState, dt: number): BattleState {
  if (state.status !== 'active') return state

  const units = state.units.map((u) => ({ ...u }))
  let tracers = state.tracers.map((t) => ({ ...t, life: t.life - dt })).filter((t) => t.life > 0)
  let tracerId = Date.now()

  for (const unit of units) {
    unit.animFrame += dt * 10
    unit.stateTimer += dt

    if (unit.state === 'dying') {
      if (unit.stateTimer > 0.9) unit.state = 'dead'
      continue
    }

    if (unit.state === 'dead') continue

    if (unit.team === 'enemy') {
      updateEnemyAI(unit, units, state.covers)
    }

    moveUnit(unit, dt, state.covers)

    unit.fireCooldown -= dt

    const shootTarget =
      unit.shootTargetId !== null
        ? units.find((u) => u.id === unit.shootTargetId)
        : findNearestEnemy(unit, units)

    if (
      shootTarget &&
      shootTarget.state !== 'dead' &&
      shootTarget.state !== 'dying' &&
      distance(unit.x, unit.y, shootTarget.x, shootTarget.y) <= unit.range &&
      unit.fireCooldown <= 0
    ) {
      unit.state = 'shooting'
      unit.stateTimer = 0
      unit.facing = Math.atan2(shootTarget.y - unit.y, shootTarget.x - unit.x)
      tracerId = applyDamage(unit, shootTarget, tracers, tracerId)
      unit.fireCooldown = unit.fireInterval
      unit.shootTargetId = shootTarget.id
    } else if (unit.state === 'shooting' && unit.stateTimer > 0.18) {
      unit.state = unit.moveTargetX !== null ? 'moving' : 'idle'
    }
  }

  const livingPlayer = units.filter((u) => u.team === 'player' && u.state !== 'dead' && u.state !== 'dying')
  const livingEnemy = units.filter((u) => u.team === 'enemy' && u.state !== 'dead' && u.state !== 'dying')

  let status: BattleStatus = state.status
  if (livingEnemy.length === 0) status = 'victory'
  if (livingPlayer.length === 0) status = 'defeat'

  return {
    ...state,
    units,
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
  if (!state.selectedUnitId) return state

  const units = state.units.map((unit) => {
    if (unit.id !== state.selectedUnitId || unit.team !== 'player') return unit
    if (unit.state === 'dying' || unit.state === 'dead') return unit
    return {
      ...unit,
      moveTargetX: x,
      moveTargetY: y,
      shootTargetId: null,
    }
  })

  return { ...state, units }
}

export function selectUnit(state: BattleState, unitId: string | null): BattleState {
  return { ...state, selectedUnitId: unitId }
}

export function getSurvivalRatio(state: BattleState): number {
  const alive = state.units.filter(
    (u) => u.team === 'player' && u.state !== 'dead' && u.state !== 'dying'
  ).length
  return state.initialPlayerCount > 0 ? alive / state.initialPlayerCount : 0
}
