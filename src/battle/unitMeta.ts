import { getFactionLore } from '../game/lore'
import type { BattleUnit, UnitArchetype } from './types'

const ARCHETYPE_TITLES: Record<UnitArchetype, string> = {
  legionLine: 'Line Legionnaire',
  legionVeteran: 'Veteran Legionnaire',
  hostileLine: 'Line Infantry',
  hostileHeavy: 'Heavy Infantry',
  hostileSkirmisher: 'Skirmisher',
  hostileBulwark: 'Bulwark',
}

export function getArchetypeTitle(archetype: UnitArchetype): string {
  return ARCHETYPE_TITLES[archetype]
}

export interface UnitTooltipInfo {
  title: string
  subtitle: string
  detail: string
  teamLabel: string
}

export function getUnitTooltipInfo(unit: BattleUnit): UnitTooltipInfo {
  const archetype = getArchetypeTitle(unit.archetype)
  const hp = `${Math.ceil(unit.health)} / ${unit.maxHealth} vitality`

  if (unit.team === 'player') {
    return {
      teamLabel: 'Ascendancy Legion',
      title: unit.label,
      subtitle: archetype,
      detail: hp,
    }
  }

  const faction = unit.factionId ? getFactionLore(unit.factionId) : undefined
  return {
    teamLabel: faction?.name ?? 'Hostile Forces',
    title: unit.label,
    subtitle: archetype,
    detail: `${hp} · ${getWeaponName(unit)}`,
  }
}

export type WeaponStyle =
  | 'pulseRifle'
  | 'luminCarbine'
  | 'kryllRivetGun'
  | 'kryllForgeCannon'
  | 'kryllRivetPistol'
  | 'vexarNullRod'
  | 'vexarPenitentLance'
  | 'vexarSkiffNeedler'
  | 'zynthianSpineRifle'
  | 'zynthianVitaeCannon'
  | 'zynthianStalkerBlade'
  | 'reaverSawedOff'
  | 'reaverBoardingGun'
  | 'reaverCutlass'
  | 'hostileAutogun'

export function getWeaponStyle(unit: BattleUnit): WeaponStyle {
  if (unit.team === 'player') {
    return unit.archetype === 'legionVeteran' ? 'luminCarbine' : 'pulseRifle'
  }

  const faction = unit.factionId ?? 'unknown'
  const arch = unit.archetype

  if (faction === 'kryll') {
    if (arch === 'hostileHeavy' || arch === 'hostileBulwark') return 'kryllForgeCannon'
    if (arch === 'hostileSkirmisher') return 'kryllRivetPistol'
    return 'kryllRivetGun'
  }
  if (faction === 'vexar') {
    if (arch === 'hostileHeavy' || arch === 'hostileBulwark') return 'vexarPenitentLance'
    if (arch === 'hostileSkirmisher') return 'vexarSkiffNeedler'
    return 'vexarNullRod'
  }
  if (faction === 'zynthian') {
    if (arch === 'hostileHeavy' || arch === 'hostileBulwark') return 'zynthianVitaeCannon'
    if (arch === 'hostileSkirmisher') return 'zynthianStalkerBlade'
    return 'zynthianSpineRifle'
  }
  if (faction === 'pirates') {
    if (arch === 'hostileHeavy' || arch === 'hostileBulwark') return 'reaverBoardingGun'
    if (arch === 'hostileSkirmisher') return 'reaverCutlass'
    return 'reaverSawedOff'
  }

  if (arch === 'hostileHeavy' || arch === 'hostileBulwark') return 'hostileAutogun'
  return 'hostileAutogun'
}

const WEAPON_NAMES: Record<WeaponStyle, string> = {
  pulseRifle: 'Pattern-IX Pulse Rifle',
  luminCarbine: 'Lumin Carbine',
  kryllRivetGun: 'Forge Rivet Gun',
  kryllForgeCannon: 'Slag Forge Cannon',
  kryllRivetPistol: 'Compact Rivet Pistol',
  vexarNullRod: 'Null Conduction Rod',
  vexarPenitentLance: 'Penitent Circuit Lance',
  vexarSkiffNeedler: 'Null Skiff Needler',
  zynthianSpineRifle: 'Grown Spine Rifle',
  zynthianVitaeCannon: 'Vitae Seed Cannon',
  zynthianStalkerBlade: 'Canopy Stalker Blade',
  reaverSawedOff: 'Sawed-Off Scattergun',
  reaverBoardingGun: 'Hull Breacher Cannon',
  reaverCutlass: 'Void Cutlass & Pistol',
  hostileAutogun: 'Autogun',
}

export function getWeaponName(unit: BattleUnit): string {
  return WEAPON_NAMES[getWeaponStyle(unit)]
}

/** Muzzle tip offset along +X in local unit space (after scale). */
export function getWeaponMuzzleX(unit: BattleUnit): number {
  const style = getWeaponStyle(unit)
  switch (style) {
    case 'kryllForgeCannon':
    case 'vexarPenitentLance':
    case 'zynthianVitaeCannon':
    case 'reaverBoardingGun':
      return 28
    case 'luminCarbine':
      return 24
    case 'zynthianStalkerBlade':
    case 'reaverCutlass':
      return 16
    case 'vexarNullRod':
      return 22
    default:
      return 20
  }
}
