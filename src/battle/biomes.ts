import type { PlanetType } from '../game/types'
import type { BattleCover, CoverLevel } from './types'

export type CoverStyle = 'blocks' | 'ruins' | 'boulders' | 'domes' | 'crystals' | 'wrecks'

export interface Biome {
  name: string
  tagline: string
  floorTop: string
  floorBottom: string
  gridColor: string
  coverFill: string
  coverStroke: string
  coverAccent: string
  ambientGlow: string
  particleColor: string
  particleCount: number
  coverStyle: CoverStyle
  coverDensity: number
  fullCoverRatio: number
  moveSpeedMult: number
  rangeMult: number
  hazardLabel?: string
}

export const BIOMES: Record<PlanetType, Biome> = {
  terran: {
    name: 'Throne City Outskirts',
    tagline: 'Marble plazas and civic spires of a throne-world',
    floorTop: '#1a1d24',
    floorBottom: '#0e1015',
    gridColor: 'rgba(201, 162, 39, 0.12)',
    coverFill: '#2a2d36',
    coverStroke: '#5a5d6a',
    coverAccent: 'rgba(201, 162, 39, 0.45)',
    ambientGlow: 'rgba(201, 162, 39, 0.04)',
    particleColor: 'rgba(255, 240, 200, 0.5)',
    particleCount: 12,
    coverStyle: 'blocks',
    coverDensity: 7,
    fullCoverRatio: 0.45,
    moveSpeedMult: 1,
    rangeMult: 1,
  },
  desert: {
    name: 'Adamant Flats',
    tagline: 'Sun-blasted salt pans strewn with exposed ore',
    floorTop: '#3a2e1c',
    floorBottom: '#241b10',
    gridColor: 'rgba(212, 168, 67, 0.08)',
    coverFill: '#4a3a24',
    coverStroke: '#8a6a3a',
    coverAccent: 'rgba(255, 200, 120, 0.35)',
    ambientGlow: 'rgba(255, 180, 80, 0.05)',
    particleColor: 'rgba(230, 200, 140, 0.4)',
    particleCount: 30,
    coverStyle: 'boulders',
    coverDensity: 5,
    fullCoverRatio: 0.3,
    moveSpeedMult: 0.95,
    rangeMult: 1.15,
    hazardLabel: 'Open ground: extended sightlines',
  },
  ice: {
    name: 'Permafrost Shelf',
    tagline: 'Wind-scoured ice fields under a pale sun',
    floorTop: '#1e2a36',
    floorBottom: '#101820',
    gridColor: 'rgba(160, 210, 240, 0.1)',
    coverFill: '#2c3c4c',
    coverStroke: '#7aa0bc',
    coverAccent: 'rgba(180, 230, 255, 0.4)',
    ambientGlow: 'rgba(140, 200, 240, 0.05)',
    particleColor: 'rgba(220, 240, 255, 0.6)',
    particleCount: 45,
    coverStyle: 'boulders',
    coverDensity: 6,
    fullCoverRatio: 0.4,
    moveSpeedMult: 0.8,
    rangeMult: 0.9,
    hazardLabel: 'Ice: legions move 20% slower',
  },
  volcanic: {
    name: 'Pyroclast Forge Floor',
    tagline: 'Basalt terraces cracked by magma channels',
    floorTop: '#2a1410',
    floorBottom: '#120806',
    gridColor: 'rgba(255, 100, 40, 0.1)',
    coverFill: '#3a1c14',
    coverStroke: '#8a3a20',
    coverAccent: 'rgba(255, 120, 40, 0.5)',
    ambientGlow: 'rgba(255, 80, 20, 0.08)',
    particleColor: 'rgba(255, 140, 40, 0.7)',
    particleCount: 25,
    coverStyle: 'boulders',
    coverDensity: 7,
    fullCoverRatio: 0.5,
    moveSpeedMult: 0.9,
    rangeMult: 0.85,
    hazardLabel: 'Ash haze: reduced sightlines',
  },
  gasGiant: {
    name: 'Orbital Refinery Deck',
    tagline: 'Pressurised gantries above an endless storm',
    floorTop: '#1c1a2c',
    floorBottom: '#0e0c18',
    gridColor: 'rgba(155, 126, 200, 0.14)',
    coverFill: '#2c2a40',
    coverStroke: '#6a5a90',
    coverAccent: 'rgba(200, 170, 255, 0.4)',
    ambientGlow: 'rgba(155, 126, 200, 0.06)',
    particleColor: 'rgba(200, 180, 255, 0.4)',
    particleCount: 18,
    coverStyle: 'blocks',
    coverDensity: 9,
    fullCoverRatio: 0.6,
    moveSpeedMult: 1,
    rangeMult: 0.9,
    hazardLabel: 'Dense machinery: heavy cover',
  },
  oceanic: {
    name: 'Tidal Aquaculture Platform',
    tagline: 'Floating vitae farms over endless sea',
    floorTop: '#0f2a34',
    floorBottom: '#081820',
    gridColor: 'rgba(110, 196, 216, 0.14)',
    coverFill: '#1a3a44',
    coverStroke: '#3a8a9a',
    coverAccent: 'rgba(110, 216, 236, 0.4)',
    ambientGlow: 'rgba(110, 196, 216, 0.06)',
    particleColor: 'rgba(180, 240, 255, 0.5)',
    particleCount: 20,
    coverStyle: 'domes',
    coverDensity: 6,
    fullCoverRatio: 0.35,
    moveSpeedMult: 1,
    rangeMult: 1.05,
  },
  jungle: {
    name: 'Canopy Understory',
    tagline: 'Bioluminescent undergrowth beneath a living ceiling',
    floorTop: '#122416',
    floorBottom: '#08140a',
    gridColor: 'rgba(90, 158, 111, 0.12)',
    coverFill: '#1e3a24',
    coverStroke: '#3d8f5f',
    coverAccent: 'rgba(120, 230, 150, 0.4)',
    ambientGlow: 'rgba(90, 158, 111, 0.06)',
    particleColor: 'rgba(160, 255, 180, 0.6)',
    particleCount: 35,
    coverStyle: 'domes',
    coverDensity: 10,
    fullCoverRatio: 0.25,
    moveSpeedMult: 0.85,
    rangeMult: 0.75,
    hazardLabel: 'Dense growth: short sightlines, abundant half cover',
  },
  habitable: {
    name: 'Megacity Arterial',
    tagline: 'Towering habitation blocks and transit canyons',
    floorTop: '#1c1e28',
    floorBottom: '#0e1018',
    gridColor: 'rgba(110, 196, 216, 0.12)',
    coverFill: '#2a2c3a',
    coverStroke: '#5c6a80',
    coverAccent: 'rgba(110, 196, 216, 0.45)',
    ambientGlow: 'rgba(110, 196, 216, 0.05)',
    particleColor: 'rgba(200, 220, 255, 0.4)',
    particleCount: 10,
    coverStyle: 'blocks',
    coverDensity: 9,
    fullCoverRatio: 0.55,
    moveSpeedMult: 1,
    rangeMult: 0.95,
    hazardLabel: 'Urban terrain: dense full cover',
  },
  asteroid: {
    name: 'Hollow Rock Excavation',
    tagline: 'Zero-atmosphere tunnels carved through solid ore',
    floorTop: '#16161a',
    floorBottom: '#0a0a0c',
    gridColor: 'rgba(212, 168, 67, 0.1)',
    coverFill: '#28262a',
    coverStroke: '#6a6060',
    coverAccent: 'rgba(212, 168, 67, 0.4)',
    ambientGlow: 'rgba(212, 168, 67, 0.03)',
    particleColor: 'rgba(200, 190, 170, 0.35)',
    particleCount: 15,
    coverStyle: 'boulders',
    coverDensity: 8,
    fullCoverRatio: 0.6,
    moveSpeedMult: 1.1,
    rangeMult: 1,
    hazardLabel: 'Low gravity: faster movement',
  },
  barren: {
    name: 'Sentinel Bastion Approach',
    tagline: 'A dead world armoured into a fortress',
    floorTop: '#141416',
    floorBottom: '#08080a',
    gridColor: 'rgba(196, 75, 75, 0.12)',
    coverFill: '#242428',
    coverStroke: '#5a5a60',
    coverAccent: 'rgba(196, 75, 75, 0.45)',
    ambientGlow: 'rgba(196, 75, 75, 0.04)',
    particleColor: 'rgba(160, 160, 170, 0.3)',
    particleCount: 8,
    coverStyle: 'ruins',
    coverDensity: 10,
    fullCoverRatio: 0.7,
    moveSpeedMult: 1,
    rangeMult: 1.1,
    hazardLabel: 'Fortified: heavy defensive emplacements',
  },
  toxic: {
    name: 'Sealed Chem-Hab Perimeter',
    tagline: 'Corroded gantries in a poison fog',
    floorTop: '#1e2416',
    floorBottom: '#0e120a',
    gridColor: 'rgba(160, 200, 60, 0.1)',
    coverFill: '#2c3420',
    coverStroke: '#6a7a30',
    coverAccent: 'rgba(200, 240, 80, 0.4)',
    ambientGlow: 'rgba(160, 200, 60, 0.07)',
    particleColor: 'rgba(200, 240, 100, 0.45)',
    particleCount: 40,
    coverStyle: 'wrecks',
    coverDensity: 7,
    fullCoverRatio: 0.4,
    moveSpeedMult: 0.9,
    rangeMult: 0.8,
    hazardLabel: 'Toxic fog: reduced sightlines',
  },
  crystalline: {
    name: 'Prism Cavern',
    tagline: 'Refractive crystal spires humming with charge',
    floorTop: '#1a1428',
    floorBottom: '#0c0a16',
    gridColor: 'rgba(200, 160, 255, 0.12)',
    coverFill: '#2a2040',
    coverStroke: '#8a70c0',
    coverAccent: 'rgba(220, 190, 255, 0.55)',
    ambientGlow: 'rgba(180, 140, 255, 0.07)',
    particleColor: 'rgba(230, 210, 255, 0.7)',
    particleCount: 28,
    coverStyle: 'crystals',
    coverDensity: 8,
    fullCoverRatio: 0.5,
    moveSpeedMult: 1,
    rangeMult: 1,
  },
}

/** Deterministic pseudo-random from a seed string, so a given planet always gets the same layout. */
function seededRandom(seed: string): () => number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return () => {
    h += h << 13
    h ^= h >>> 7
    h += h << 3
    h ^= h >>> 17
    h += h << 5
    return ((h >>> 0) % 100000) / 100000
  }
}

export function generateBiomeCovers(
  biome: Biome,
  seed: string,
  fieldWidth: number,
  fieldHeight: number
): BattleCover[] {
  const rand = seededRandom(seed)
  const covers: BattleCover[] = []
  const margin = 200
  const minX = margin
  const maxX = fieldWidth - margin
  const minY = 50
  const maxY = fieldHeight - 50

  let attempts = 0
  while (covers.length < biome.coverDensity && attempts < 200) {
    attempts++
    const isFull = rand() < biome.fullCoverRatio
    const level: CoverLevel = isFull ? 'full' : 'half'

    let width: number
    let height: number
    switch (biome.coverStyle) {
      case 'boulders':
        width = 40 + rand() * 50
        height = 36 + rand() * 40
        break
      case 'domes':
        width = 44 + rand() * 30
        height = 44 + rand() * 30
        break
      case 'crystals':
        width = 24 + rand() * 30
        height = 50 + rand() * 50
        break
      case 'ruins':
        width = 30 + rand() * 90
        height = 24 + rand() * 40
        break
      case 'wrecks':
        width = 50 + rand() * 70
        height = 30 + rand() * 30
        break
      default:
        width = 50 + rand() * 60
        height = 36 + rand() * 30
    }

    const x = minX + rand() * (maxX - minX - width)
    const y = minY + rand() * (maxY - minY - height)
    const candidate = { x, y, width, height, level }

    const overlaps = covers.some(
      (c) =>
        x < c.x + c.width + 24 &&
        x + width + 24 > c.x &&
        y < c.y + c.height + 24 &&
        y + height + 24 > c.y
    )
    if (!overlaps) covers.push(candidate)
  }

  return covers
}
