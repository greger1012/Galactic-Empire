import { BIOMES, type Biome } from './biomes'
import { drawBattleUnit } from './unitVisuals'
import type { BattleCover, BattleState, BattleUnit } from './types'

/** Stable per-cover jitter so organic shapes don't flicker between frames. */
function coverHash(cover: BattleCover): number {
  const n = Math.sin(cover.x * 12.9898 + cover.y * 78.233) * 43758.5453
  return n - Math.floor(n)
}

function traceCoverShape(ctx: CanvasRenderingContext2D, cover: BattleCover, biome: Biome): void {
  const { x, y, width: w, height: h } = cover
  const cx = x + w / 2
  const cy = y + h / 2
  const jitter = coverHash(cover)

  ctx.beginPath()
  switch (biome.coverStyle) {
    case 'boulders': {
      const points = 8
      for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2
        const wobble = 0.78 + ((Math.sin(angle * 3 + jitter * 10) + 1) / 2) * 0.22
        const px = cx + Math.cos(angle) * (w / 2) * wobble
        const py = cy + Math.sin(angle) * (h / 2) * wobble
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      break
    }
    case 'domes':
      ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2)
      break
    case 'crystals': {
      const tipLean = (jitter - 0.5) * w * 0.6
      ctx.moveTo(x + w * 0.2, y + h)
      ctx.lineTo(x, y + h * 0.55)
      ctx.lineTo(cx + tipLean, y)
      ctx.lineTo(x + w, y + h * 0.45)
      ctx.lineTo(x + w * 0.8, y + h)
      ctx.closePath()
      break
    }
    case 'ruins': {
      const notch = 6 + jitter * 10
      ctx.moveTo(x, y + notch)
      ctx.lineTo(x + w * 0.3, y + notch)
      ctx.lineTo(x + w * 0.3, y)
      ctx.lineTo(x + w * 0.65, y)
      ctx.lineTo(x + w * 0.65, y + notch * 0.6)
      ctx.lineTo(x + w, y + notch * 0.6)
      ctx.lineTo(x + w, y + h)
      ctx.lineTo(x, y + h)
      ctx.closePath()
      break
    }
    case 'wrecks': {
      const skew = (jitter - 0.5) * 12
      ctx.moveTo(x + skew, y)
      ctx.lineTo(x + w, y + 4)
      ctx.lineTo(x + w - skew, y + h)
      ctx.lineTo(x + 4, y + h - 3)
      ctx.closePath()
      break
    }
    default:
      ctx.roundRect(x, y, w, h, 3)
  }
}

function drawCover(ctx: CanvasRenderingContext2D, cover: BattleCover, biome: Biome): void {
  const isFull = cover.level === 'full'

  ctx.save()
  traceCoverShape(ctx, cover, biome)
  ctx.fillStyle = biome.coverFill
  ctx.strokeStyle = biome.coverStroke
  ctx.lineWidth = isFull ? 2.5 : 1.5
  ctx.globalAlpha = isFull ? 1 : 0.8
  ctx.fill()
  ctx.stroke()
  ctx.globalAlpha = 1

  ctx.strokeStyle = biome.coverAccent
  ctx.lineWidth = isFull ? 1.5 : 1
  ctx.beginPath()
  if (biome.coverStyle === 'crystals') {
    ctx.moveTo(cover.x + cover.width / 2, cover.y + 4)
    ctx.lineTo(cover.x + cover.width * 0.35, cover.y + cover.height - 4)
  } else if (biome.coverStyle === 'domes') {
    ctx.ellipse(
      cover.x + cover.width / 2,
      cover.y + cover.height / 2,
      cover.width / 4,
      cover.height / 4,
      0,
      0,
      Math.PI * 2
    )
  } else {
    ctx.moveTo(cover.x + 6, cover.y + 6)
    ctx.lineTo(cover.x + cover.width - 6, cover.y + cover.height - 6)
  }
  ctx.stroke()
  ctx.restore()

  ctx.fillStyle = isFull ? 'rgba(232, 228, 220, 0.35)' : 'rgba(232, 228, 220, 0.18)'
  ctx.font = '8px monospace'
  ctx.fillText(isFull ? 'FULL' : 'HALF', cover.x + 4, cover.y + cover.height - 4)
}

function drawAmbientParticles(
  ctx: CanvasRenderingContext2D,
  biome: Biome,
  elapsed: number,
  width: number,
  height: number
): void {
  ctx.fillStyle = biome.particleColor
  for (let i = 0; i < biome.particleCount; i++) {
    const phase = i * 7.31
    const driftX = ((phase * 53.7 + elapsed * (8 + (i % 5) * 3)) % (width + 40)) - 20
    const driftY = ((phase * 91.3 + Math.sin(elapsed * 0.6 + i) * 18 + elapsed * 5) % (height + 40)) - 20
    const size = 1 + ((i * 13) % 3) * 0.6
    ctx.globalAlpha = 0.4 + Math.sin(elapsed * 1.5 + i) * 0.3
    ctx.beginPath()
    ctx.arc(driftX, driftY, size, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
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
  const biome = BIOMES[state.planetType]

  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, biome.floorTop)
  gradient.addColorStop(1, biome.floorBottom)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  ctx.strokeStyle = biome.gridColor
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

  ctx.fillStyle = biome.ambientGlow
  ctx.fillRect(0, 0, width, height)

  drawAmbientParticles(ctx, biome, state.elapsed, width, height)

  for (const cover of state.covers) {
    drawCover(ctx, cover, biome)
  }

  for (const explosion of state.explosions) {
    drawExplosion(ctx, explosion)
  }

  for (const tracer of state.tracers) {
    drawTracer(ctx, tracer)
  }

  const sortedUnits = [...state.units].sort((a, b) => a.y - b.y)
  for (const unit of sortedUnits) {
    drawBattleUnit(ctx, unit, state.enemyColor)
  }

  if (state.hoveredUnitId) {
    const hovered = state.units.find((u) => u.id === state.hoveredUnitId)
    if (hovered && hovered.state !== 'dead' && hovered.state !== 'dying') {
      ctx.strokeStyle =
        hovered.team === 'player' ? 'rgba(126, 232, 250, 0.85)' : 'rgba(255, 180, 120, 0.9)'
      ctx.lineWidth = 1.5
      ctx.setLineDash([2, 3])
      ctx.beginPath()
      ctx.arc(hovered.x, hovered.y, 24, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
    }
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
