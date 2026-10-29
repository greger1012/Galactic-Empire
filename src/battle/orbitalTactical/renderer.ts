import type { OrbitalTacticalState } from './types'

export function renderOrbitalTactical(ctx: CanvasRenderingContext2D, state: OrbitalTacticalState): void {
  const { width, height } = state

  const grad = ctx.createLinearGradient(0, 0, width, 0)
  grad.addColorStop(0, '#0a0e18')
  grad.addColorStop(0.55, '#12182a')
  grad.addColorStop(1, '#1a1020')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, width, height)

  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.08 + (i % 5) * 0.03})`
    ctx.fillRect((i * 97) % width, (i * 53) % height, 1, 1)
  }

  const aegisPct = state.aegisHp / Math.max(1, state.aegisMaxHp)
  ctx.beginPath()
  ctx.arc(state.aegisX, state.aegisY, 42, 0, Math.PI * 2)
  ctx.fillStyle = `rgba(196, 75, 75, ${0.25 + aegisPct * 0.35})`
  ctx.fill()
  ctx.strokeStyle = state.enemyColor
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.fillStyle = '#e8c4c4'
  ctx.font = '11px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Orbital Aegis', state.aegisX, state.aegisY - 52)
  ctx.fillText(`${Math.ceil(state.aegisHp)}`, state.aegisX, state.aegisY + 4)

  for (const t of state.tracers) {
    ctx.strokeStyle = t.team === 'player' ? '#6ec4d8' : '#ff8a8a'
    ctx.globalAlpha = Math.min(1, t.life * 8)
    ctx.beginPath()
    ctx.moveTo(t.fromX, t.fromY)
    ctx.lineTo(t.toX, t.toY)
    ctx.stroke()
    ctx.globalAlpha = 1
  }

  for (const ship of state.ships) {
    if (ship.health <= 0) continue
    const selected = state.selectedUnitIds.includes(ship.id)
    ctx.font = '22px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(ship.icon, ship.x, ship.y + 8)
    if (selected) {
      ctx.strokeStyle = '#c9a227'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(ship.x, ship.y, 20, 0, Math.PI * 2)
      ctx.stroke()
    }
    const hp = ship.health / ship.maxHealth
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(ship.x - 18, ship.y + 14, 36, 4)
    ctx.fillStyle = ship.team === 'player' ? '#4ecdc4' : '#ff6b6b'
    ctx.fillRect(ship.x - 18, ship.y + 14, 36 * hp, 4)
  }

  if (state.dragSelect) {
    const { startX, startY, endX, endY } = state.dragSelect
    ctx.strokeStyle = 'rgba(201, 162, 39, 0.8)'
    ctx.setLineDash([4, 4])
    ctx.strokeRect(
      Math.min(startX, endX),
      Math.min(startY, endY),
      Math.abs(endX - startX),
      Math.abs(endY - startY)
    )
    ctx.setLineDash([])
  }

  if (state.paused) {
    ctx.fillStyle = 'rgba(0,0,0,0.4)'
    ctx.fillRect(0, 0, width, height)
    ctx.fillStyle = '#c9a227'
    ctx.font = 'bold 24px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('PAUSED', width / 2, height / 2)
  }
}

export function canvasToOrbitalCoords(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
  width: number,
  height: number
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect()
  const scaleX = width / rect.width
  const scaleY = height / rect.height
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  }
}
