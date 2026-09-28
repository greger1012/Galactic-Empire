export interface FactionAITuning {
  coverSeekMult: number
  grenadeChanceMult: number
  flankAggression: number
  rangeHoldMult: number
  advanceAggression: number
}

const DEFAULT_TUNING: FactionAITuning = {
  coverSeekMult: 1,
  grenadeChanceMult: 1,
  flankAggression: 1,
  rangeHoldMult: 1,
  advanceAggression: 1,
}

/** Rival mandate tactical doctrines for ground assault AI. */
export const FACTION_AI_TUNING: Record<string, FactionAITuning> = {
  kryll: {
    coverSeekMult: 0.55,
    grenadeChanceMult: 0.75,
    flankAggression: 0.75,
    rangeHoldMult: 0.7,
    advanceAggression: 1.35,
  },
  vexar: {
    coverSeekMult: 1.35,
    grenadeChanceMult: 0.65,
    flankAggression: 0.55,
    rangeHoldMult: 1.25,
    advanceAggression: 0.75,
  },
  zynthian: {
    coverSeekMult: 0.95,
    grenadeChanceMult: 1,
    flankAggression: 1.45,
    rangeHoldMult: 0.95,
    advanceAggression: 1.1,
  },
  pirates: {
    coverSeekMult: 0.8,
    grenadeChanceMult: 1.85,
    flankAggression: 1.25,
    rangeHoldMult: 0.65,
    advanceAggression: 1.2,
  },
}

export const APEX_BOSS_TUNING: FactionAITuning = {
  coverSeekMult: 0.45,
  grenadeChanceMult: 1.55,
  flankAggression: 1.05,
  rangeHoldMult: 0.85,
  advanceAggression: 1.25,
}

export function resolveEnemyAITuning(
  factionId?: string,
  isFrontierBoss?: boolean
): FactionAITuning {
  if (isFrontierBoss) {
    const base = factionId ? FACTION_AI_TUNING[factionId] : undefined
    if (!base) return APEX_BOSS_TUNING
    return {
      coverSeekMult: APEX_BOSS_TUNING.coverSeekMult * base.coverSeekMult,
      grenadeChanceMult: APEX_BOSS_TUNING.grenadeChanceMult * base.grenadeChanceMult,
      flankAggression: APEX_BOSS_TUNING.flankAggression * base.flankAggression,
      rangeHoldMult: APEX_BOSS_TUNING.rangeHoldMult * base.rangeHoldMult,
      advanceAggression: APEX_BOSS_TUNING.advanceAggression * base.advanceAggression,
    }
  }
  if (factionId && FACTION_AI_TUNING[factionId]) {
    return FACTION_AI_TUNING[factionId]
  }
  return DEFAULT_TUNING
}
