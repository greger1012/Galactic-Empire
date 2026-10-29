import type { OrbitalTacticalState, VoidShipUnit, VoidTracer } from './types'

function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(bx - ax, by - ay)
}

function nearestEnemy(unit: VoidShipUnit, ships: VoidShipUnit[]): VoidShipUnit | null {
  let best: VoidShipUnit | null = null
  let bestD = Infinity
  for (const other of ships) {
    if (other.team === unit.team || other.health <= 0) continue
    const d = dist(unit.x, unit.y, other.x, other.y)
    if (d < bestD) {
      bestD = d
      best = other
    }
  }
  return best
}

function moveShip(unit: VoidShipUnit, dt: number): void {
  if (unit.moveTargetX === null || unit.moveTargetY === null) return
  const dx = unit.moveTargetX - unit.x
  const dy = unit.moveTargetY - unit.y
  const d = Math.hypot(dx, dy)
  if (d < 6) {
    unit.moveTargetX = null
    unit.moveTargetY = null
    return
  }
  const step = unit.moveSpeed * dt
  unit.x += (dx / d) * step
  unit.y += (dy / d) * step
}

function updateEnemyAI(unit: VoidShipUnit, ships: VoidShipUnit[], state: OrbitalTacticalState): void {
  const target = nearestEnemy(unit, ships)
  if (!target) {
    unit.moveTargetX = state.aegisX - 120
    unit.moveTargetY = state.aegisY
    return
  }
  const d = dist(unit.x, unit.y, target.x, target.y)
  if (d > unit.range * 0.75) {
    unit.moveTargetX = target.x - 40
    unit.moveTargetY = target.y + (unit.id.charCodeAt(2) % 5) * 8 - 16
  } else if (d < unit.range * 0.35) {
    unit.moveTargetX = unit.x + (unit.x - target.x) * 0.15
    unit.moveTargetY = unit.y + (unit.y - target.y) * 0.15
  } else {
    unit.moveTargetX = null
    unit.moveTargetY = null
    unit.shootTargetId = target.id
  }
}

function fireAtTarget(
  attacker: VoidShipUnit,
  target: VoidShipUnit,
  tracers: VoidTracer[],
  tracerId: number
): number {
  const hit = Math.random() < 0.78
  tracers.push({
    id: `vt-${tracerId}`,
    fromX: attacker.x,
    fromY: attacker.y,
    toX: target.x,
    toY: target.y,
    team: attacker.team,
    life: 0.1,
  })
  if (hit) target.health -= attacker.damage
  return tracerId + 1
}

function fireAtAegis(
  attacker: VoidShipUnit,
  state: OrbitalTacticalState,
  tracers: VoidTracer[],
  tracerId: number
): number {
  if (dist(attacker.x, attacker.y, state.aegisX, state.aegisY) > attacker.range) return tracerId
  tracers.push({
    id: `vt-${tracerId}`,
    fromX: attacker.x,
    fromY: attacker.y,
    toX: state.aegisX,
    toY: state.aegisY,
    team: 'player',
    life: 0.12,
  })
  if (Math.random() < 0.82) {
    state.aegisHp = Math.max(0, state.aegisHp - Math.floor(attacker.damage * 1.1))
  }
  return tracerId + 1
}

function aegisBattery(state: OrbitalTacticalState, dt: number, ships: VoidShipUnit[]): void {
  if (state.aegisHp <= 0) return
  const interval = 2.2
  const pulse = Math.floor(state.elapsed / interval)
  const prev = Math.floor((state.elapsed - dt) / interval)
  if (pulse === prev) return

  const players = ships.filter((s) => s.team === 'player' && s.health > 0)
  if (players.length === 0) return
  let nearest = players[0]
  let nd = dist(nearest.x, nearest.y, state.aegisX, state.aegisY)
  for (const p of players) {
    const d = dist(p.x, p.y, state.aegisX, state.aegisY)
    if (d < nd) {
      nd = d
      nearest = p
    }
  }
  if (nd > 320) return
  nearest.health -= 12 + Math.floor(state.aegisMaxHp / 80)
  state.tracers.push({
    id: `aegis-${Date.now()}`,
    fromX: state.aegisX,
    fromY: state.aegisY,
    toX: nearest.x,
    toY: nearest.y,
    team: 'enemy',
    life: 0.15,
  })
}

export function updateOrbitalTactical(state: OrbitalTacticalState, dt: number): OrbitalTacticalState {
  if (state.status !== 'active' || state.paused) return state

  const ships = state.ships.map((s) => ({ ...s }))
  let tracers = state.tracers.map((t) => ({ ...t, life: t.life - dt })).filter((t) => t.life > 0)
  let tracerId = Date.now()
  const next: OrbitalTacticalState = { ...state, ships, tracers, elapsed: state.elapsed + dt }

  aegisBattery(next, dt, ships)

  for (const unit of ships) {
    if (unit.health <= 0) continue

    if (unit.team === 'enemy') updateEnemyAI(unit, ships, next)

    moveShip(unit, dt)
    unit.fireCooldown -= dt

    let target = unit.shootTargetId ? ships.find((s) => s.id === unit.shootTargetId) : null
    if (!target || target.health <= 0) target = nearestEnemy(unit, ships)

    if (target && dist(unit.x, unit.y, target.x, target.y) <= unit.range && unit.fireCooldown <= 0) {
      tracerId = fireAtTarget(unit, target, tracers, tracerId)
      unit.fireCooldown = unit.fireInterval
      unit.shootTargetId = target.id
    } else if (unit.team === 'player' && next.aegisHp > 0 && unit.fireCooldown <= 0) {
      const enemiesAlive = ships.some((s) => s.team === 'enemy' && s.health > 0)
      if (!enemiesAlive || dist(unit.x, unit.y, next.aegisX, next.aegisY) <= unit.range) {
        tracerId = fireAtAegis(unit, next, tracers, tracerId)
        unit.fireCooldown = unit.fireInterval * 1.05
      }
    }
  }

  next.tracers = tracers
  next.ships = ships

  const playersAlive = ships.filter((s) => s.team === 'player' && s.health > 0).length
  if (playersAlive === 0) next.status = 'defeat'
  else if (next.aegisHp <= 0) {
    next.status = 'victory'
  }

  return next
}

export function getVoidShipAt(state: OrbitalTacticalState, x: number, y: number): VoidShipUnit | null {
  for (let i = state.ships.length - 1; i >= 0; i--) {
    const s = state.ships[i]
    if (s.health <= 0) continue
    if (dist(s.x, s.y, x, y) < 22) return s
  }
  return null
}

export function issueVoidMoveOrder(state: OrbitalTacticalState, x: number, y: number): OrbitalTacticalState {
  const selected = new Set(state.selectedUnitIds)
  const ships = state.ships.map((unit) => {
    if (!selected.has(unit.id) || unit.team !== 'player' || unit.health <= 0) return unit
    const angle = Math.atan2(y - unit.y, x - unit.x)
    const offset = (unit.id.charCodeAt(2) % 5) * 14
    return {
      ...unit,
      moveTargetX: x + Math.cos(angle + Math.PI / 2) * offset,
      moveTargetY: y + Math.sin(angle + Math.PI / 2) * offset,
      shootTargetId: null,
    }
  })
  return { ...state, ships }
}

export function selectVoidShips(state: OrbitalTacticalState, ids: string[]): OrbitalTacticalState {
  return { ...state, selectedUnitIds: ids }
}

export function addVoidSelection(state: OrbitalTacticalState, id: string): OrbitalTacticalState {
  if (state.selectedUnitIds.includes(id)) return state
  return { ...state, selectedUnitIds: [...state.selectedUnitIds, id] }
}

export function boxSelectVoidShips(
  state: OrbitalTacticalState,
  box: { startX: number; startY: number; endX: number; endY: number }
): OrbitalTacticalState {
  const minX = Math.min(box.startX, box.endX)
  const maxX = Math.max(box.startX, box.endX)
  const minY = Math.min(box.startY, box.endY)
  const maxY = Math.max(box.startY, box.endY)
  const ids = state.ships
    .filter(
      (s) =>
        s.team === 'player' &&
        s.health > 0 &&
        s.x >= minX &&
        s.x <= maxX &&
        s.y >= minY &&
        s.y <= maxY
    )
    .map((s) => s.id)
  return { ...state, selectedUnitIds: ids, dragSelect: null }
}

export function getOrbitalTacticalSurvivalRatio(state: OrbitalTacticalState): number {
  const alive = state.ships.filter((s) => s.team === 'player' && s.health > 0).length
  return state.initialPlayerCount > 0 ? alive / state.initialPlayerCount : 0
}

export function getAegisDamageRatio(state: OrbitalTacticalState): number {
  return 1 - state.aegisHp / Math.max(1, state.aegisMaxHp)
}
