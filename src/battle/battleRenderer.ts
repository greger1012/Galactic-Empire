import type { BattleState, BattleUnit } from './types'

const TEAM_COLORS = {
  player: {
    armor: '#3d5a73',
    trim: '#c9a227',
    visor: '#7ee8fa',
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
  ctx.fillStyle = '#1a2230'
  ctx.strokeStyle = '#3d4f63'
  ctx.lineWidth = 2
  ctx.fillRect(cover.x, cover.y, cover.width, cover.height)
  ctx.strokeRect(cover.x, cover.y, cover.width, cover.height)

  ctx.strokeStyle = 'rgba(201, 162, 39, 0.35)'
  ctx.beginPath()
  ctx.moveTo(cover.x + 6, cover.y + 6)
  ctx.lineTo(cover.x + cover.width - 6, cover.y + cover.height - 6)
  ctx.stroke()
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

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)'
  ctx.beginPath()
  ctx.ellipse(2, 4, 11, 7, 0, 0, Math.PI * 2)
  ctx.fill()

  // Legs (walk cycle)
  const legSwing = unit.state === 'moving' ? Math.sin(unit.animFrame * 2) * 4 : 0
  ctx.fillStyle = '#2a3544'
  ctx.fillRect(-4 + legSwing, 4 + walkBob, 4, 8)
  ctx.fillRect(0 - legSwing, 4 + walkBob, 4, 8)

  // Torso armor
  ctx.fillStyle = colors.armor
  ctx.strokeStyle = colors.trim
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(-9, -6 + walkBob, 18, 14, 3)
  ctx.fill()
  ctx.stroke()

  // Shoulder pads
  ctx.fillStyle = colors.trim
  ctx.beginPath()
  ctx.ellipse(-10, -2 + walkBob, 4, 5, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(10, -2 + walkBob, 4, 5, 0, 0, Math.PI * 2)
  ctx.fill()

  // Helmet
  ctx.fillStyle = colors.armor
  ctx.strokeStyle = colors.trim
  ctx.beginPath()
  ctx.arc(0, -10 + walkBob, 7, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Visor
  ctx.fillStyle = colors.visor
  ctx.fillRect(2, -12 + walkBob, 6, 3)

  // Weapon
  ctx.fillStyle = colors.gun
  ctx.fillRect(6 + shootRecoil, -2 + walkBob, 14, 4)

  // Muzzle flash
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

  // Health bar
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
  ctx.strokeStyle =
    tracer.team === 'player'
      ? `rgba(126, 232, 250, ${alpha})`
      : `rgba(255, 107, 74, ${alpha})`
  ctx.lineWidth = 2
  ctx.shadowColor = ctx.strokeStyle
  ctx.shadowBlur = 6
  ctx.beginPath()
  ctx.moveTo(tracer.fromX, tracer.fromY)
  ctx.lineTo(tracer.toX, tracer.toY)
  ctx.stroke()
  ctx.shadowBlur = 0
}

function drawSelectionRing(ctx: CanvasRenderingContext2D, unit: BattleUnit): void {
  ctx.strokeStyle = '#c9a227'
  ctx.lineWidth = 2
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  ctx.arc(unit.x, unit.y, 22, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])
}

export function renderBattle(ctx: CanvasRenderingContext2D, state: BattleState): void {
  const { width, height } = state

  // Floor
  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, '#121820')
  gradient.addColorStop(1, '#0a0e14')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  // Grid
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

  // Ambient forge glow
  ctx.fillStyle = 'rgba(201, 162, 39, 0.03)'
  ctx.fillRect(0, 0, width, height)

  for (const cover of state.covers) {
    drawCover(ctx, cover)
  }

  for (const tracer of state.tracers) {
    drawTracer(ctx, tracer)
  }

  const sortedUnits = [...state.units].sort((a, b) => a.y - b.y)
  for (const unit of sortedUnits) {
    drawTopDownSoldier(ctx, unit)
  }

  if (state.selectedUnitId) {
    const selected = state.units.find((u) => u.id === state.selectedUnitId)
    if (selected && selected.state !== 'dead') {
      drawSelectionRing(ctx, selected)

      if (selected.moveTargetX !== null && selected.moveTargetY !== null) {
        ctx.strokeStyle = 'rgba(78, 205, 196, 0.5)'
        ctx.setLineDash([6, 6])
        ctx.beginPath()
        ctx.moveTo(selected.x, selected.y)
        ctx.lineTo(selected.moveTargetX, selected.moveTargetY)
        ctx.stroke()
        ctx.setLineDash([])
      }
    }
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
