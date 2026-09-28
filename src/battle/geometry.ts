import type { BattleCover, BattleUnit } from './types'

export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1)
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function isPointInRect(
  x: number,
  y: number,
  rect: { x: number; y: number; width: number; height: number },
  padding = 0
): boolean {
  return (
    x >= rect.x - padding &&
    x <= rect.x + rect.width + padding &&
    y >= rect.y - padding &&
    y <= rect.y + rect.height + padding
  )
}

export function rectsOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
  padding = 0
): boolean {
  return !(
    a.x + a.width + padding < b.x - padding ||
    b.x + b.width + padding < a.x - padding ||
    a.y + a.height + padding < b.y - padding ||
    b.y + b.height + padding < a.y - padding
  )
}

/** Liang-Barsky line segment vs axis-aligned rectangle */
export function segmentIntersectsRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rect: { x: number; y: number; width: number; height: number }
): boolean {
  const left = rect.x
  const right = rect.x + rect.width
  const top = rect.y
  const bottom = rect.y + rect.height

  const dx = x2 - x1
  const dy = y2 - y1
  let t0 = 0
  let t1 = 1

  const edges = [
    { p: -dx, q: x1 - left },
    { p: dx, q: right - x1 },
    { p: -dy, q: y1 - top },
    { p: dy, q: bottom - y1 },
  ]

  for (const { p, q } of edges) {
    if (p === 0) {
      if (q < 0) return false
    } else {
      const t = q / p
      if (p < 0) {
        if (t > t1) return false
        if (t > t0) t0 = t
      } else {
        if (t < t0) return false
        if (t < t1) t1 = t
      }
    }
  }

  return true
}

export function isBlocked(
  x: number,
  y: number,
  covers: BattleCover[],
  radius = 14
): boolean {
  return covers.some((c) =>
    isPointInRect(x, y, { x: c.x, y: c.y, width: c.width, height: c.height }, radius)
  )
}

export function getUnitsInRect(
  units: BattleUnit[],
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  team?: BattleUnit['team']
): BattleUnit[] {
  const minX = Math.min(x1, x2)
  const maxX = Math.max(x1, x2)
  const minY = Math.min(y1, y2)
  const maxY = Math.max(y1, y2)

  return units.filter((u) => {
    if (u.state === 'dead' || u.state === 'dying') return false
    if (team && u.team !== team) return false
    return u.x >= minX && u.x <= maxX && u.y >= minY && u.y <= maxY
  })
}
