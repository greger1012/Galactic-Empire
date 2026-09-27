import { getFactionLore } from '../game/lore'
import type { BattleUnit, UnitArchetype } from './types'

export interface UnitPalette {
  armor: string
  armorDark: string
  trim: string
  visor: string
  gun: string
  accent: string
}

const LEGION_PALETTE: UnitPalette = {
  armor: '#3d4f63',
  armorDark: '#2a3544',
  trim: '#c9a227',
  visor: '#6ec4d8',
  gun: '#8b9bb4',
  accent: '#e8c547',
}

function darken(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.max(0, ((n >> 16) & 255) - amount)
  const g = Math.max(0, ((n >> 8) & 255) - amount)
  const b = Math.max(0, (n & 255) - amount)
  return `rgb(${r},${g},${b})`
}

export function getUnitPalette(unit: BattleUnit, enemyColor: string): UnitPalette {
  if (unit.team === 'player') {
    if (unit.archetype === 'legionVeteran') {
      return {
        ...LEGION_PALETTE,
        armor: '#45566c',
        trim: '#e8c547',
        accent: '#ffe566',
      }
    }
    return LEGION_PALETTE
  }

  const faction = unit.factionId ? getFactionLore(unit.factionId) : undefined
  const accent = faction?.color ?? enemyColor

  return {
    armor: darken(accent, 55),
    armorDark: darken(accent, 75),
    trim: accent,
    visor: unit.archetype === 'hostileSkirmisher' ? '#a8ffd0' : '#ff8a6a',
    gun: darken(accent, 35),
    accent,
  }
}

function scaleForArchetype(archetype: UnitArchetype): number {
  switch (archetype) {
    case 'hostileBulwark':
      return 1.28
    case 'hostileHeavy':
      return 1.14
    case 'hostileSkirmisher':
      return 0.84
    case 'legionVeteran':
      return 1.12
    default:
      return 1
  }
}

function drawLegionCape(
  ctx: CanvasRenderingContext2D,
  walkBob: number,
  veteran: boolean
): void {
  if (!veteran) return
  ctx.fillStyle = 'rgba(201, 162, 39, 0.35)'
  ctx.beginPath()
  ctx.moveTo(-6, 2 + walkBob)
  ctx.lineTo(-10, 12 + walkBob)
  ctx.lineTo(4, 10 + walkBob)
  ctx.closePath()
  ctx.fill()
}

function drawPauldrons(
  ctx: CanvasRenderingContext2D,
  walkBob: number,
  colors: UnitPalette,
  large: boolean
): void {
  const rx = large ? 5 : 4
  const ry = large ? 6 : 5
  ctx.fillStyle = colors.trim
  ctx.strokeStyle = colors.armorDark
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.ellipse(-11, -2 + walkBob, rx, ry, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.beginPath()
  ctx.ellipse(11, -2 + walkBob, rx, ry, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
}

function drawHostileSilhouette(
  ctx: CanvasRenderingContext2D,
  archetype: UnitArchetype,
  walkBob: number,
  colors: UnitPalette
): void {
  if (archetype === 'hostileBulwark') {
    ctx.fillStyle = colors.armorDark
    ctx.fillRect(-12, -4 + walkBob, 24, 16)
    ctx.strokeStyle = colors.trim
    ctx.lineWidth = 2
    ctx.strokeRect(-12, -4 + walkBob, 24, 16)
    ctx.fillStyle = colors.trim
    ctx.fillRect(-8, -8 + walkBob, 16, 5)
    return
  }

  if (archetype === 'hostileHeavy') {
    ctx.fillStyle = colors.armor
    ctx.beginPath()
    ctx.roundRect(-11, -7 + walkBob, 22, 16, 2)
    ctx.fill()
    ctx.fillStyle = colors.gun
    ctx.fillRect(4, -1 + walkBob, 18, 6)
    ctx.fillStyle = colors.trim
    ctx.fillRect(-3, -11 + walkBob, 6, 8)
    return
  }

  if (archetype === 'hostileSkirmisher') {
    ctx.fillStyle = colors.armor
    ctx.beginPath()
    ctx.ellipse(0, 0 + walkBob, 8, 11, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = colors.trim
    ctx.stroke()
    return
  }

  // hostileLine + default
  ctx.fillStyle = colors.armor
  ctx.beginPath()
  ctx.roundRect(-9, -6 + walkBob, 18, 14, 3)
  ctx.fill()
}

function drawWeapon(
  ctx: CanvasRenderingContext2D,
  archetype: UnitArchetype,
  walkBob: number,
  shootRecoil: number,
  colors: UnitPalette
): void {
  ctx.fillStyle = colors.gun
  if (archetype === 'hostileHeavy' || archetype === 'hostileBulwark') {
    ctx.fillRect(5 + shootRecoil, -3 + walkBob, 20, 6)
    ctx.fillStyle = colors.trim
    ctx.fillRect(12 + shootRecoil, -5 + walkBob, 8, 3)
  } else if (archetype === 'hostileSkirmisher') {
    ctx.fillRect(4 + shootRecoil, -1 + walkBob, 12, 3)
  } else {
    ctx.fillRect(6 + shootRecoil, -2 + walkBob, 14, 4)
  }
}

function drawMuzzleFlash(
  ctx: CanvasRenderingContext2D,
  unit: BattleUnit,
  walkBob: number,
  shootRecoil: number,
  colors: UnitPalette
): void {
  if (unit.state !== 'shooting' || unit.stateTimer >= 0.1) return

  const flashColor = unit.team === 'player' ? '#7ee8fa' : colors.visor
  ctx.fillStyle = flashColor
  ctx.shadowColor = flashColor
  ctx.shadowBlur = 14
  const tipX = unit.archetype === 'hostileHeavy' ? 26 : 22
  ctx.beginPath()
  ctx.arc(tipX + shootRecoil, 0 + walkBob, 5, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0
}

function drawDyingBody(
  ctx: CanvasRenderingContext2D,
  unit: BattleUnit,
  colors: UnitPalette,
  scale: number
): void {
  const fall = Math.min(1, unit.stateTimer / 0.75)
  const tilt = fall * (Math.PI / 2)
  ctx.rotate(tilt)
  ctx.globalAlpha *= 1 - fall * 0.35
  ctx.scale(scale, scale)

  ctx.fillStyle = colors.armorDark
  ctx.fillRect(-10, -4, 20, 12)
  ctx.fillStyle = colors.trim
  ctx.fillRect(2, -8, 5, 4)

  if (unit.stateTimer < 0.15) {
    ctx.fillStyle = unit.team === 'player' ? 'rgba(110, 196, 216, 0.8)' : 'rgba(255, 120, 60, 0.8)'
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2
      ctx.beginPath()
      ctx.arc(Math.cos(a) * 8, Math.sin(a) * 8 - 4, 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

export function drawBattleUnit(
  ctx: CanvasRenderingContext2D,
  unit: BattleUnit,
  enemyColor: string
): void {
  if (unit.state === 'dead') return

  const colors = getUnitPalette(unit, enemyColor)
  const dying = unit.state === 'dying'
  const alpha = dying ? Math.max(0.25, 1 - unit.stateTimer * 0.9) : 1
  const scale = scaleForArchetype(unit.archetype)
  const isPlayer = unit.team === 'player'
  const veteran = unit.archetype === 'legionVeteran'

  const walkPhase = unit.animFrame * 2
  const walkBob = unit.state === 'moving' ? Math.sin(walkPhase) * 1.8 : Math.sin(unit.animFrame * 0.4) * 0.4
  const shootRecoil = unit.state === 'shooting' ? -2.5 - unit.stateTimer * 8 : 0
  const legSwing = unit.state === 'moving' ? Math.sin(walkPhase) * 5 : 0

  ctx.save()
  ctx.translate(unit.x, unit.y)
  ctx.rotate(unit.facing)
  ctx.globalAlpha = alpha

  if (dying) {
    drawDyingBody(ctx, unit, colors, scale)
    ctx.restore()
    drawUnitStatusIcons(ctx, unit)
    return
  }

  ctx.scale(scale, scale)

  ctx.fillStyle = 'rgba(0,0,0,0.38)'
  ctx.beginPath()
  ctx.ellipse(2, 5, 12 * scale, 7 * scale, 0, 0, Math.PI * 2)
  ctx.fill()

  drawLegionCape(ctx, walkBob, veteran)

  ctx.fillStyle = colors.armorDark
  ctx.fillRect(-4 + legSwing, 5 + walkBob, 4, 9)
  ctx.fillRect(0 - legSwing, 5 + walkBob, 4, 9)
  if (unit.state === 'moving') {
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    ctx.fillRect(-5 + legSwing, 12 + walkBob, 3, 2)
    ctx.fillRect(1 - legSwing, 12 + walkBob, 3, 2)
  }

  if (isPlayer) {
    ctx.fillStyle = colors.armor
    ctx.strokeStyle = colors.trim
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.roundRect(-9, -6 + walkBob, 18, 14, veteran ? 2 : 3)
    ctx.fill()
    ctx.stroke()
    drawPauldrons(ctx, walkBob, colors, veteran)
    ctx.fillStyle = colors.armor
    ctx.strokeStyle = colors.trim
    ctx.beginPath()
    ctx.arc(0, -10 + walkBob, veteran ? 7.5 : 7, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = colors.visor
    ctx.fillRect(2, -12 + walkBob, veteran ? 7 : 6, 3)
    if (veteran) {
      ctx.strokeStyle = colors.accent
      ctx.strokeRect(-1, -14 + walkBob, 4, 2)
    }
  } else {
    drawHostileSilhouette(ctx, unit.archetype, walkBob, colors)
    drawPauldrons(
      ctx,
      walkBob,
      colors,
      unit.archetype === 'hostileHeavy' || unit.archetype === 'hostileBulwark'
    )
    if (unit.archetype !== 'hostileSkirmisher') {
      ctx.fillStyle = colors.armor
      ctx.strokeStyle = colors.trim
      ctx.beginPath()
      ctx.arc(0, -10 + walkBob, 6.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = colors.visor
      ctx.fillRect(1, -12 + walkBob, 6, 3)
    } else {
      ctx.fillStyle = colors.visor
      ctx.beginPath()
      ctx.arc(3, -6 + walkBob, 3, 0, Math.PI * 2)
      ctx.fill()
    }
    if (unit.factionId === 'vexar') {
      ctx.strokeStyle = 'rgba(180, 140, 255, 0.5)'
      ctx.beginPath()
      ctx.arc(0, -10 + walkBob, 9, 0, Math.PI * 2)
      ctx.stroke()
    }
    if (unit.factionId === 'pirates') {
      ctx.fillStyle = 'rgba(196, 127, 26, 0.5)'
      ctx.fillRect(-8, 2 + walkBob, 5, 4)
    }
  }

  if (unit.archetype !== 'hostileHeavy') {
    drawWeapon(ctx, unit.archetype, walkBob, shootRecoil, colors)
  }
  drawMuzzleFlash(ctx, unit, walkBob, shootRecoil, colors)

  ctx.restore()
  drawUnitStatusIcons(ctx, unit)
}

function drawUnitStatusIcons(ctx: CanvasRenderingContext2D, unit: BattleUnit): void {
  if (unit.coverLevel !== 'none' && unit.state !== 'dying' && unit.state !== 'dead') {
    ctx.fillStyle = unit.coverLevel === 'full' ? '#4ecdc4' : '#74c0fc'
    ctx.font = 'bold 8px sans-serif'
    ctx.fillText('▣', unit.x - 14, unit.y - 20)
  }
  if (unit.holdPosition && unit.state !== 'dying' && unit.state !== 'dead') {
    ctx.fillStyle = '#c9a227'
    ctx.font = 'bold 9px sans-serif'
    ctx.fillText('⏸', unit.x + 8, unit.y - 20)
  }
  if (unit.suppressedTimer > 0 && unit.state !== 'dying' && unit.state !== 'dead') {
    ctx.fillStyle = '#ff6b6b'
    ctx.font = 'bold 9px sans-serif'
    ctx.fillText('!', unit.x - 4, unit.y - 22)
  }

  if (unit.health < unit.maxHealth && unit.state !== 'dying' && unit.state !== 'dead') {
    const barW = unit.archetype === 'hostileBulwark' ? 30 : 24
    const pct = unit.health / unit.maxHealth
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(unit.x - barW / 2, unit.y - 24, barW, 4)
    ctx.fillStyle = unit.team === 'player' ? '#4ecdc4' : '#ff6b6b'
    ctx.fillRect(unit.x - barW / 2, unit.y - 24, barW * pct, 4)
  }
}
