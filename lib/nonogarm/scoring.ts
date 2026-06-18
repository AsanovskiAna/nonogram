import type { ActorScoreInput, PatchScoreInput } from "./types.ts";

const PATCH_BASE: Record<5 | 8, number> = { 5: 250, 8: 650 };
const MIN_PATCH_SCORE = 50;
const BASE_LEVEL_XP = 600;
const LEVEL_XP_STEP = 300;
const MAX_SPEED_BONUS = 900;
const SPEED_PENALTY_PER_SECOND = 8;

export type LevelProgress = {
  level: number;
  currentXp: number;
  nextLevelXp: number;
  progressPercent: number;
};

function getLevelXpRequirement(level: number): number {
  return BASE_LEVEL_XP + Math.max(0, level) * LEVEL_XP_STEP;
}

export function getLevelProgress(score: number): LevelProgress {
  let remainingXp = Math.max(0, Math.round(score));
  let level = 0;
  let nextLevelXp = getLevelXpRequirement(level);

  while (remainingXp >= nextLevelXp) {
    remainingXp -= nextLevelXp;
    level += 1;
    nextLevelXp = getLevelXpRequirement(level);
  }

  return {
    level,
    currentXp: remainingXp,
    nextLevelXp,
    progressPercent: Math.round((remainingXp / nextLevelXp) * 100),
  };
}

export function bankRoundScore(careerScore: number, roundScore: number): number {
  return Math.max(0, careerScore) + Math.max(0, roundScore);
}

export function scorePatchSolve({ size, seconds, wrongSubmits }: PatchScoreInput): number {
  const raw = PATCH_BASE[size] - seconds * 3 - wrongSubmits * 75;
  return Math.max(MIN_PATCH_SCORE, raw);
}

export function getSpeedBonus(seconds: number): number {
  return Math.max(0, MAX_SPEED_BONUS - Math.max(0, seconds) * SPEED_PENALTY_PER_SECOND);
}

export function getSpeedFillPercent(seconds: number): number {
  return Math.round((getSpeedBonus(seconds) / MAX_SPEED_BONUS) * 100);
}

export function scoreActorGuess({
  difficultyMultiplier,
  seconds,
  revealedPatches,
  totalPatches,
}: ActorScoreInput): number {
  const hiddenPatches = Math.max(0, totalPatches - revealedPatches);
  const speedBonus = getSpeedBonus(seconds);
  return Math.round((800 + hiddenPatches * 120 + speedBonus) * difficultyMultiplier);
}
