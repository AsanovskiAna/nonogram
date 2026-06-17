import type { ActorScoreInput, PatchScoreInput } from "./types.ts";

const PATCH_BASE: Record<5 | 8, number> = { 5: 250, 8: 650 };
const MIN_PATCH_SCORE = 50;

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
