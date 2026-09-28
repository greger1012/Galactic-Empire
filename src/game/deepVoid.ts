/** Difficulty curve for procedural void frontiers (founding sector = wave 0). */

export type DeepVoidTier = 'founding' | 'shallow' | 'mid' | 'deep' | 'abyssal'

export function getDeepVoidTier(frontierWave: number | undefined): DeepVoidTier {
  const wave = frontierWave ?? 0
  if (wave <= 0) return 'founding'
  if (wave <= 2) return 'shallow'
  if (wave <= 4) return 'mid'
  if (wave <= 7) return 'deep'
  return 'abyssal'
}

export const DEEP_VOID_TIER_LABELS: Record<DeepVoidTier, string> = {
  founding: 'Founding Sector',
  shallow: 'Shallow Void',
  mid: 'Mid Frontier',
  deep: 'Deep Void',
  abyssal: 'Abyssal Expanse',
}

export function getDeepVoidTierLabel(frontierWave: number | undefined): string {
  return DEEP_VOID_TIER_LABELS[getDeepVoidTier(frontierWave)]
}

/** Planetary aegis and population scaling for procedural worlds. */
export function getDeepVoidDefenseMult(frontierWave: number): number {
  if (frontierWave <= 0) return 1
  return 1 + frontierWave * 0.07 + Math.floor(frontierWave / 4) * 0.12
}

export function getDeepVoidPopulationMult(frontierWave: number): number {
  if (frontierWave <= 0) return 1
  return 1 + frontierWave * 0.1
}

/** Ground-legion stat multiplier from void depth. */
export function getDeepVoidCombatMult(frontierWave: number): number {
  if (frontierWave <= 0) return 1
  return 1 + frontierWave * 0.05 + Math.floor(frontierWave / 3) * 0.08
}

/** Rival pulse pressure — raids and embargoes bite harder in the deep void. */
export function getDeepVoidPulsePressure(frontierWave: number): number {
  if (frontierWave <= 2) return 0
  return Math.min(0.45, (frontierWave - 2) * 0.06)
}

export function getFrontierBossDefenseMult(frontierWave: number): number {
  return 1.32 + frontierWave * 0.04
}
