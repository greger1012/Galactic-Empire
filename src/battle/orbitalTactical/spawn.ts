import { SHIP_INFO } from '../../game/constants'
import type { Fleet } from '../../game/types'
import type { TechModifiers } from '../../game/research'
import type { OrbitalDoctrine } from '../orbitalEngagement'
import type { OrbitalTacticalState, VoidShipUnit } from './types'

const WIDTH = 880
const HEIGHT = 420

function spawnPlayerGroup(
  type: keyof Fleet,
  count: number,
  index: number,
  total: number
): VoidShipUnit[] {
  if (count <= 0) return []
  const info = SHIP_INFO[type]
  const units: VoidShipUnit[] = []
  const groups = Math.min(count, type === 'carrier' ? 2 : type === 'destroyer' ? 4 : 6)
  const hullsPerGroup = Math.ceil(count / groups)

  for (let g = 0; g < groups; g++) {
    const row = index + g
    const angle = (row / Math.max(1, total)) * Math.PI * 0.8 - Math.PI * 0.4
    const radius = 70 + (row % 3) * 28
    const x = 120 + Math.cos(angle) * radius * 0.4
    const y = HEIGHT / 2 + Math.sin(angle) * radius

    const scale = Math.sqrt(hullsPerGroup)
    units.push({
      id: `p-${type}-${g}`,
      team: 'player',
      shipType: type,
      label: info.name,
      icon: info.icon,
      x,
      y,
      moveTargetX: null,
      moveTargetY: null,
      health: Math.floor(80 * scale + info.attackPower * 0.8),
      maxHealth: Math.floor(80 * scale + info.attackPower * 0.8),
      damage: Math.floor(info.attackPower * 0.55 + 6),
      range: type === 'scout' ? 200 : type === 'carrier' ? 240 : 215,
      moveSpeed: type === 'scout' ? 95 : type === 'carrier' ? 58 : 72,
      fireCooldown: Math.random() * 0.4,
      fireInterval: type === 'destroyer' ? 0.85 : 0.65,
      shootTargetId: null,
    })
  }
  return units
}

function spawnEnemyFleet(defenseRating: number, factionColor: string): VoidShipUnit[] {
  const count = Math.min(10, Math.max(3, Math.floor(defenseRating / 12)))
  const units: VoidShipUnit[] = []

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 1.2 + Math.PI * 0.15
    const radius = 55 + (i % 2) * 35
    units.push({
      id: `e-${i}`,
      team: 'enemy',
      label: i % 3 === 0 ? 'Aegis Corvette' : 'Mandate Interceptor',
      icon: i % 3 === 0 ? '🛡️' : '✴️',
      x: WIDTH - 160 + Math.cos(angle) * radius,
      y: HEIGHT / 2 + Math.sin(angle) * radius * 0.9,
      moveTargetX: null,
      moveTargetY: null,
      health: 55 + Math.floor(defenseRating / 15),
      maxHealth: 55 + Math.floor(defenseRating / 15),
      damage: 10 + Math.floor(defenseRating / 25),
      range: 190,
      moveSpeed: 64 + (i % 3) * 8,
      fireCooldown: Math.random() * 0.5,
      fireInterval: 0.7 + (i % 4) * 0.08,
      shootTargetId: null,
    })
  }

  void factionColor
  return units
}

export function createOrbitalTacticalBattle(
  planetName: string,
  defenseRating: number,
  fleet: Fleet,
  doctrine: OrbitalDoctrine,
  mods: TechModifiers,
  enemyColor: string
): OrbitalTacticalState {
  let playerShips: VoidShipUnit[] = []
  let idx = 0
  const types: (keyof Fleet)[] = ['scout', 'frigate', 'destroyer', 'carrier']
  const totalGroups = types.reduce((sum, t) => sum + Math.min(fleet[t], t === 'carrier' ? 2 : 6), 0)

  for (const type of types) {
    const spawned = spawnPlayerGroup(type, fleet[type], idx, totalGroups)
    idx += spawned.length
    playerShips = [...playerShips, ...spawned]
  }

  for (const ship of playerShips) {
    ship.damage = Math.floor(ship.damage * mods.fleetPowerMult)
    ship.maxHealth = Math.floor(ship.maxHealth * (0.9 + mods.fleetPowerMult * 0.15))
    ship.health = ship.maxHealth
    if (doctrine === 'lanceBarrage') ship.damage = Math.floor(ship.damage * 1.15)
    if (doctrine === 'voidScreens') ship.maxHealth = Math.floor(ship.maxHealth * 1.12)
  }

  const enemyShips = spawnEnemyFleet(defenseRating, enemyColor)
  const aegisMaxHp = Math.floor(defenseRating * 2.8)

  return {
    active: true,
    width: WIDTH,
    height: HEIGHT,
    planetName,
    enemyColor,
    doctrine,
    aegisHp: aegisMaxHp,
    aegisMaxHp,
    aegisX: WIDTH - 48,
    aegisY: HEIGHT / 2,
    ships: [...playerShips, ...enemyShips],
    tracers: [],
    selectedUnitIds: [],
    dragSelect: null,
    paused: false,
    status: 'active',
    initialPlayerCount: playerShips.length,
    elapsed: 0,
  }
}
