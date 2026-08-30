import type { BattleState, BattleUnit } from './types'

const TEAM_COLORS = {
  player: {
    armor: '#3d4f63',
    trim: '#c9a227',
    visor: '#6ec4d8',
    gun: '#8b9bb4',
  },
  enemy: {
    armor: '#4a3038',
    trim: '#8b3a3a',
    visor: '#ff6b4a',
    gun: '#6b5058',
  },
}

function drawCover(ctx: CanvasRenderingContext2D, cover: BattleState['covers'][0]): void {
  const isFull = cover.level === 'full'
  ctx.fillStyle = isFull ? '#1a2230' : '#1e2836'
  ctx.strokeStyle = isFull ? '#4a6078' : '#3d4f63'
  ctx.lineWidth = 2
  ctx.fillRect(cover.x, cover.y, cover.width, cover.height)
  ctx.strokeRect(cover.x, cover.y, cover.width, cover.height)

  ctx.strokeStyle = isFull ? 'rgba(201, 162, 39, 0.5)' : 'rgba(201, 162, 39, 0.25)'
  ctx.beginPath()
  ctx.moveTo(cover.x + 6, cover.y + 6)
  ctx.lineTo(cover.x + cover.width - 6, cover.y + cover.height - 6)
  ctx.stroke()

  ctx.fillStyle = isFull ? 'rgba(78, 205, 196, 0.15)' : 'rgba(78, 205, 196, 0.08)'
  ctx.font = '9px sans-serif'
  ctx.fillText(isFull ? 'FULL' : 'HALF', cover.x + 4, cover.y + cover.height - 4)
}

function drawTopDownSoldier(ctx: CanvasRenderingContext2D, unit: BattleUnit): void {
  if (unit.state === 'dead') return

  const colors = TEAM_COLORS[unit.team]
  const dying = unit.state === 'dying'
  const alpha = dying ? Math.max(0, 1 - unit.stateTimer) : 1

  ctx.save()
  ctx.translate(unit.x, unit.y)
  ctx.rotate(unit.facing)
  ctx.globalAlpha = alpha

  const walkBob =
    unit.state === 'moving' ? Math.sin(unit.animFrame * 2) * 1.5 : 0
  const shootRecoil = unit.state === 'shooting' ? -2 : 0

  ctx.fillStyle = 'rgba(0,0,0,0.35)'
  ctx.beginPath()
  ctx.ellipse(2, 4, 11, 7, 0, 0, Math.PI * 2)
  ctx.fill()

  const legSwing = unit.state === 'moving' ? Math.sin(unit.animFrame * 2) * 4 : 0
  ctx.fillStyle = '#2a3544'
  ctx.fillRect(-4 + legSwing, 4 + walkBob, 4, 8)
  ctx.fillRect(0 - legSwing, 4 + walkBob, 4, 8)

  ctx.fillStyle = colors.armor
  ctx.strokeStyle = colors.trim
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(-9, -6 + walkBob, 18, 14, 3)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = colors.trim
  ctx.beginPath()
  ctx.ellipse(-10, -2 + walkBob, 4, 5, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(10, -2 + walkBob, 4, 5, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = colors.armor
  ctx.strokeStyle = colors.trim
  ctx.beginPath()
  ctx.arc(0, -10 + walkBob, 7, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = colors.visor
  ctx.fillRect(2, -12 + walkBob, 6, 3)

  ctx.fillStyle = colors.gun
  ctx.fillRect(6 + shootRecoil, -2 + walkBob, 14, 4)

  if (unit.state === 'shooting' && unit.stateTimer < 0.1) {
    ctx.fillStyle = '#ffe566'
    ctx.shadowColor = '#ff9f1c'
    ctx.shadowBlur = 12
    ctx.beginPath()
    ctx.arc(22 + shootRecoil, 0 + walkBob, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
  }

  ctx.restore()

  // Status indicators
  if (unit.coverLevel !== 'none' && unit.state !== 'dying') {
    ctx.fillStyle = unit.coverLevel === 'full' ? '#4ecdc4' : '#74c0fc'
    ctx.font = 'bold 8px sans-serif'
    ctx.fillText('▣', unit.x - 14, unit.y - 20)
  }
  if (unit.holdPosition && unit.state !== 'dying') {
    ctx.fillStyle = '#c9a227'
    ctx.font = 'bold 9px sans-serif'
    ctx.fillText('⏸', unit.x + 8, unit.y - 20)
  }
  if (unit.suppressedTimer > 0 && unit.state !== 'dying') {
    ctx.fillStyle = '#ff6b6b'
    ctx.font = 'bold 9px sans-serif'
    ctx.fillText('!', unit.x - 4, unit.y - 22)
  }

  if (unit.health < unit.maxHealth && unit.state !== 'dying') {
    const barW = 24
    const pct = unit.health / unit.maxHealth
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(unit.x - barW / 2, unit.y - 24, barW, 4)
    ctx.fillStyle = unit.team === 'player' ? '#4ecdc4' : '#ff6b6b'
    ctx.fillRect(unit.x - barW / 2, unit.y - 24, barW * pct, 4)
  }
}

function drawTracer(ctx: CanvasRenderingContext2D, tracer: BattleState['tracers'][0]): void {
  const alpha = tracer.life / 0.12
  if (tracer.blocked) {
    ctx.strokeStyle = `rgba(150, 150, 150, ${alpha * 0.5})`
    ctx.setLineDash([3, 3])
  } else {
    ctx.strokeStyle =
      tracer.team === 'player'
        ? `rgba(126, 232, 250, ${alpha})`
        : `rgba(255, 107, 74, ${alpha})`
    ctx.setLineDash([])
  }
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(tracer.fromX, tracer.fromY)
  ctx.lineTo(tracer.toX, tracer.toY)
  ctx.stroke()
  ctx.setLineDash([])
}

function drawExplosion(ctx: CanvasRenderingContext2D, explosion: BattleState['explosions'][0]): void {
  const progress = 1 - explosion.life / explosion.maxLife
  const radius = explosion.radius * (0.3 + progress * 0.7)
  const alpha = explosion.life / explosion.maxLife

  ctx.fillStyle = `rgba(255, 140, 50, ${alpha * 0.35})`
  ctx.beginPath()
  ctx.arc(explosion.x, explosion.y, radius, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = `rgba(255, 220, 100, ${alpha})`
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(explosion.x, explosion.y, radius * 0.6, 0, Math.PI * 2)
  ctx.stroke()
}

function drawSelectionRing(ctx: CanvasRenderingContext2D, unit: BattleUnit, primary: boolean): void {
  ctx.strokeStyle = primary ? '#c9a227' : 'rgba(201, 162, 39, 0.6)'
  ctx.lineWidth = primary ? 2 : 1.5
  ctx.setLineDash(primary ? [4, 4] : [2, 4])
  ctx.beginPath()
  ctx.arc(unit.x, unit.y, 22, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])
}

function drawDragSelect(ctx: CanvasRenderingContext2D, drag: NonNullable<BattleState['dragSelect']>): void {
  const x = Math.min(drag.startX, drag.endX)
  const y = Math.min(drag.startY, drag.endY)
  const w = Math.abs(drag.endX - drag.startX)
  const h = Math.abs(drag.endY - drag.startY)

  ctx.fillStyle = 'rgba(78, 205, 196, 0.1)'
  ctx.strokeStyle = 'rgba(78, 205, 196, 0.7)'
  ctx.lineWidth = 1.5
  ctx.setLineDash([4, 4])
  ctx.fillRect(x, y, w, h)
  ctx.strokeRect(x, y, w, h)
  ctx.setLineDash([])
}

export function renderBattle(ctx: CanvasRenderingContext2D, state: BattleState): void {
  const { width, height } = state

  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, '#121820')
  gradient.addColorStop(1, '#0a0e14')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  ctx.strokeStyle = 'rgba(61, 79, 99, 0.25)'
  ctx.lineWidth = 1
  for (let x = 0; x < width; x += 40) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
  for (let y = 0; y < height; y += 40) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }

  ctx.fillStyle = 'rgba(201, 162, 39, 0.03)'
  ctx.fillRect(0, 0, width, height)

  for (const cover of state.covers) {
    drawCover(ctx, cover)
  }

  for (const explosion of state.explosions) {
    drawExplosion(ctx, explosion)
  }

  for (const tracer of state.tracers) {
    drawTracer(ctx, tracer)
  }

  const sortedUnits = [...state.units].sort((a, b) => a.y - b.y)
  for (const unit of sortedUnits) {
    drawTopDownSoldier(ctx, unit)
  }

  for (const unitId of state.selectedUnitIds) {
    const unit = state.units.find((u) => u.id === unitId)
    if (unit && unit.state !== 'dead') {
      drawSelectionRing(ctx, unit, state.selectedUnitIds[0] === unitId)

      if (unit.moveTargetX !== null && unit.moveTargetY !== null) {
        ctx.strokeStyle = 'rgba(78, 205, 196, 0.35)'
        ctx.setLineDash([4, 6])
        ctx.beginPath()
        ctx.moveTo(unit.x, unit.y)
        ctx.lineTo(unit.moveTargetX, unit.moveTargetY)
        ctx.stroke()
        ctx.setLineDash([])
      }
    }
  }

  if (state.dragSelect) {
    drawDragSelect(ctx, state.dragSelect)
  }

  if (state.activeAbility === 'grenade') {
    ctx.fillStyle = 'rgba(255, 100, 50, 0.08)'
    ctx.fillRect(0, 0, width, height)
  }

  if (state.paused) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'
    ctx.fillRect(0, 0, width, height)
    ctx.fillStyle = '#c9a227'
    ctx.font = 'bold 28px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('PAUSED', width / 2, height / 2)
    ctx.textAlign = 'start'
  }
}

export function canvasToBattleCoords(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
  fieldWidth: number,
  fieldHeight: number
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect()
  const scaleX = fieldWidth / rect.width
  const scaleY = fieldHeight / rect.height
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  }
}
