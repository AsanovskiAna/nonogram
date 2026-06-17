import type { ActorScoreInput, PatchScoreInput } from "./types.ts";

const PATCH_BASE: Record<5 | 8, number> = { 5: 250, 8: 650 };
const MIN_PATCH_SCORE = 50;
const LEVEL_XP = 600;

export type LevelProgress = {
  level: number;
  currentXp: number;
  nextLevelXp: number;
  progressPercent: number;
};

export function getLevelProgress(score: number): LevelProgress {
  const safeScore = Math.max(0, score);
  const currentXp = safeScore % LEVEL_XP;

  return {
    level: Math.floor(safeScore / LEVEL_XP),
    currentXp,
    nextLevelXp: LEVEL_XP,
    progressPercent: Math.round((currentXp / LEVEL_XP) * 100),
  };
}

export function bankRoundScore(careerScore: number, roundScore: number): number {
  return Math.max(0, careerScore) + Math.max(0, roundScore);
}

export function scorePatchSolve({ size, seconds, wrongSubmits }: PatchScoreInput): number {
  const raw = PATCH_BASE[size] - seconds * 3 - wrongSubmits * 75;
  return Math.max(MIN_PATCH_SCORE, raw);
}

export function scoreActorGuess({
  difficultyMultiplier,
  seconds,
  revealedPatches,
  totalPatches,
}: ActorScoreInput): number {
  const hiddenPatches = Math.max(0, totalPatches - revealedPatches);
  const speedBonus = Math.max(0, 900 - seconds * 8);
  return Math.round((800 + hiddenPatches * 120 + speedBonus) * difficultyMultiplier);
}
