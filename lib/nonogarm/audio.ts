import type { RoundStatus } from "./round.ts";

export const AUDIO_TRACKS = {
  loop: "/audio/nonogarm-loop.wav",
  correct: "/audio/correct.wav",
  wrong: "/audio/wrong.wav",
  win: "/audio/win.wav",
} as const;

export type AudioCue = Exclude<keyof typeof AUDIO_TRACKS, "loop">;

export type RoundAudioSnapshot = {
  guessFeedback: string;
  revealedPatchCount: number;
  status: RoundStatus;
};

export function getRoundAudioCue(
  previous: RoundAudioSnapshot | null,
  next: RoundAudioSnapshot | null,
): AudioCue | null {
  if (!previous || !next) {
    return null;
  }

  if (previous.status !== "won" && next.status === "won") {
    return "win";
  }

  if (next.revealedPatchCount > previous.revealedPatchCount) {
    return "correct";
  }

  const isWrongFeedback =
    next.guessFeedback.startsWith("Not quite.") || next.guessFeedback.startsWith("No match yet.");

  if (next.guessFeedback !== previous.guessFeedback && isWrongFeedback) {
    return "wrong";
  }

  return null;
}
