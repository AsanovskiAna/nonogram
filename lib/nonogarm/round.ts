import { isActorMatch } from "./matching.ts";
import {
  createEmptyMarks,
  createRoundSeed,
  generateActorPatches,
  isSolved,
} from "./puzzle.ts";
import { scoreActorGuess, scorePatchSolve } from "./scoring.ts";
import type { ActorEntry, ActorPatch, ActorProfile, BoardMarks, CellMark } from "./types.ts";

export type RoundStatus = "playing" | "won";

export type RoundState = {
  actor: ActorEntry;
  roundSeed: string;
  selectedPatchId: string | null;
  currentMarks: BoardMarks;
  revealedPatchIds: string[];
  score: number;
  streak: number;
  startedAt: number;
  activePatchStartedAt: number | null;
  wrongSubmitsByPatch: Record<string, number>;
  undoStack: BoardMarks[];
  status: RoundStatus;
  guessFeedback: string;
};

function cloneMarks(marks: BoardMarks): BoardMarks {
  return marks.map((row) => [...row]);
}

export function createRound(
  actor: ActorProfile,
  nowSeconds: number,
  roundSeed = createRoundSeed(),
  streak = 0,
): RoundState {
  const roundActor: ActorEntry = {
    ...actor,
    patches: generateActorPatches(actor.id, roundSeed),
  };

  return {
    actor: roundActor,
    roundSeed,
    selectedPatchId: null,
    currentMarks: [],
    revealedPatchIds: [],
    score: 0,
    streak,
    startedAt: nowSeconds,
    activePatchStartedAt: null,
    wrongSubmitsByPatch: {},
    undoStack: [],
    status: "playing",
    guessFeedback: "",
  };
}

export function getSelectedPatch(round: RoundState): ActorPatch | null {
  return round.actor.patches.find((patch) => patch.id === round.selectedPatchId) ?? null;
}

export function selectPatch(
  round: RoundState,
  patchId: string,
  nowSeconds: number,
): RoundState {
  const patch = round.actor.patches.find((candidate) => candidate.id === patchId);
  if (!patch || round.revealedPatchIds.includes(patchId) || round.status === "won") {
    return round;
  }

  return {
    ...round,
    selectedPatchId: patch.id,
    currentMarks: createEmptyMarks(patch.size),
    activePatchStartedAt: nowSeconds,
    undoStack: [],
    guessFeedback: `Patch ${patch.row + 1}-${patch.col + 1} selected.`,
  };
}

export function toggleCell(
  round: RoundState,
  row: number,
  col: number,
  mode: Exclude<CellMark, "empty">,
): RoundState {
  if (!round.selectedPatchId || round.status === "won") {
    return round;
  }

  const nextMarks = cloneMarks(round.currentMarks);
  nextMarks[row][col] = nextMarks[row][col] === mode ? "empty" : mode;

  return {
    ...round,
    currentMarks: nextMarks,
    undoStack: [...round.undoStack, cloneMarks(round.currentMarks)],
  };
}

export function undoLastMark(round: RoundState): RoundState {
  const previous = round.undoStack.at(-1);
  if (!previous) {
    return round;
  }

  return {
    ...round,
    currentMarks: cloneMarks(previous),
    undoStack: round.undoStack.slice(0, -1),
  };
}

export function clearActivePatch(round: RoundState): RoundState {
  const patch = getSelectedPatch(round);
  if (!patch) {
    return round;
  }

  return {
    ...round,
    currentMarks: createEmptyMarks(patch.size),
    undoStack: [...round.undoStack, cloneMarks(round.currentMarks)],
  };
}

export function submitActivePatch(
  round: RoundState,
  nowSeconds: number,
): { round: RoundState; solved: boolean; patchScore: number } {
  const patch = getSelectedPatch(round);
  if (!patch) {
    return { round, solved: false, patchScore: 0 };
  }

  const wrongSubmits = round.wrongSubmitsByPatch[patch.id] ?? 0;
  const seconds = Math.max(0, nowSeconds - (round.activePatchStartedAt ?? nowSeconds));

  if (!isSolved(patch.solution, round.currentMarks)) {
    return {
      round: {
        ...round,
        wrongSubmitsByPatch: {
          ...round.wrongSubmitsByPatch,
          [patch.id]: wrongSubmits + 1,
        },
        guessFeedback: "Not quite. Check the clues.",
      },
      solved: false,
      patchScore: 0,
    };
  }

  const patchScore = scorePatchSolve({ size: patch.size, seconds, wrongSubmits });

  return {
    round: {
      ...round,
      selectedPatchId: null,
      currentMarks: [],
      activePatchStartedAt: null,
      revealedPatchIds: [...round.revealedPatchIds, patch.id],
      score: round.score + patchScore,
      streak: round.streak + 1,
      undoStack: [],
      guessFeedback: `Patch solved +${patchScore}.`,
    },
    solved: true,
    patchScore,
  };
}

export function submitActorGuess(
  round: RoundState,
  guess: string,
  nowSeconds: number,
): { round: RoundState; correct: boolean; actorScore: number } {
  if (!guess.trim()) {
    return {
      round: { ...round, guessFeedback: "Type a name first." },
      correct: false,
      actorScore: 0,
    };
  }

  if (!isActorMatch(round.actor, guess)) {
    return {
      round: { ...round, streak: 0, guessFeedback: "No match yet. Reveal another patch?" },
      correct: false,
      actorScore: 0,
    };
  }

  const actorScore = scoreActorGuess({
    difficultyMultiplier: round.actor.difficultyMultiplier,
    seconds: Math.max(0, nowSeconds - round.startedAt),
    revealedPatches: round.revealedPatchIds.length,
    totalPatches: round.actor.patches.length,
  });

  return {
    round: {
      ...round,
      score: round.score + actorScore,
      streak: round.streak + 1,
      status: "won",
      guessFeedback: `Correct: ${round.actor.displayName}! +${actorScore}.`,
    },
    correct: true,
    actorScore,
  };
}
