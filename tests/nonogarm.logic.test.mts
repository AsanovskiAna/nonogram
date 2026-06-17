import assert from "node:assert/strict";
import test from "node:test";
import { ACTORS } from "../lib/nonogarm/actors.ts";
import { getClues, getPatchSize, isSolved } from "../lib/nonogarm/puzzle.ts";
import {
  clearActivePatch,
  createRound,
  selectPatch,
  submitActorGuess,
  submitActivePatch,
  toggleCell,
  undoLastMark,
} from "../lib/nonogarm/round.ts";
import {
  bankRoundScore,
  getLevelProgress,
  scoreActorGuess,
  scorePatchSolve,
} from "../lib/nonogarm/scoring.ts";
import { isActorMatch, normalizeGuess } from "../lib/nonogarm/matching.ts";

test("getPatchSize returns 8 for center patches and 5 for outer patches", () => {
  assert.equal(getPatchSize(1, 1), 8);
  assert.equal(getPatchSize(2, 2), 8);
  assert.equal(getPatchSize(0, 0), 5);
  assert.equal(getPatchSize(3, 2), 5);
});

test("getClues compresses filled cell runs and uses 0 for empty rows", () => {
  const solution = [
    [true, true, false, true, false],
    [false, false, false, false, false],
    [true, false, true, true, true],
  ];

  assert.deepEqual(getClues(solution, "row"), [[2, 1], [0], [1, 3]]);
  assert.deepEqual(getClues(solution, "column"), [[1, 1], [1], [1], [1, 1], [1]]);
});

test("isSolved accepts filled solution cells and ignores crossed empty cells", () => {
  const solution = [
    [true, false],
    [false, true],
  ];
  const marks = [
    ["filled", "crossed"],
    ["empty", "filled"],
  ] as const;

  assert.equal(isSolved(solution, marks), true);
});

test("normalizeGuess strips accents, punctuation, case, and repeated spacing", () => {
  assert.equal(normalizeGuess("  Timothee!   Chalamet "), "timothee chalamet");
  assert.equal(normalizeGuess("Zoë-Kravitz"), "zoe kravitz");
});

test("isActorMatch accepts display name and aliases", () => {
  const actor = {
    id: "ava",
    displayName: "Ava Sterling",
    aliases: ["A. Sterling", "Sterling"],
    difficulty: "Easy" as const,
    difficultyMultiplier: 1,
    portrait: "/actors/ava-sterling.svg",
    patches: [],
  };

  assert.equal(isActorMatch(actor, "ava sterling"), true);
  assert.equal(isActorMatch(actor, "A Sterling"), true);
  assert.equal(isActorMatch(actor, "someone else"), false);
});

test("scorePatchSolve applies grid base, time penalty, submit penalty, and minimum score", () => {
  assert.equal(scorePatchSolve({ size: 5, seconds: 20, wrongSubmits: 1 }), 115);
  assert.equal(scorePatchSolve({ size: 8, seconds: 10, wrongSubmits: 0 }), 620);
  assert.equal(scorePatchSolve({ size: 5, seconds: 500, wrongSubmits: 10 }), 50);
});

test("scoreActorGuess rewards difficulty, speed, and unrevealed patches", () => {
  assert.equal(
    scoreActorGuess({
      difficultyMultiplier: 1.4,
      seconds: 45,
      revealedPatches: 4,
      totalPatches: 16,
    }),
    3892,
  );
});

test("getLevelProgress starts at level zero and advances from score XP", () => {
  assert.deepEqual(getLevelProgress(0), {
    level: 0,
    currentXp: 0,
    nextLevelXp: 600,
    progressPercent: 0,
  });
  assert.deepEqual(getLevelProgress(599), {
    level: 0,
    currentXp: 599,
    nextLevelXp: 600,
    progressPercent: 100,
  });
  assert.deepEqual(getLevelProgress(1450), {
    level: 2,
    currentXp: 250,
    nextLevelXp: 600,
    progressPercent: 42,
  });
});

test("bankRoundScore carries level XP across actor rounds", () => {
  const careerScore = bankRoundScore(500, 250);

  assert.equal(careerScore, 750);
  assert.deepEqual(getLevelProgress(careerScore), {
    level: 1,
    currentXp: 150,
    nextLevelXp: 600,
    progressPercent: 25,
  });
  assert.equal(bankRoundScore(careerScore, 0), 750);
});

test("actor data includes three actors with sixteen correctly sized patches each", () => {
  assert.equal(ACTORS.length, 3);
  for (const actor of ACTORS) {
    assert.equal(actor.patches.length, 16);
    assert.equal(actor.patches.filter((patch) => patch.size === 8).length, 4);
    assert.equal(actor.patches.filter((patch) => patch.size === 5).length, 12);
  }
});

test("round state supports selecting, marking, undoing, clearing, and solving a patch", () => {
  let round = createRound(ACTORS[0], 0);
  const patch = ACTORS[0].patches.find((candidate) => candidate.size === 5)!;

  assert.equal(round.streak, 0);

  round = selectPatch(round, patch.id, 0);
  assert.equal(round.selectedPatchId, patch.id);
  assert.equal(round.currentMarks.length, 5);

  round = toggleCell(round, 0, 0, "filled");
  assert.equal(round.currentMarks[0][0], "filled");

  round = undoLastMark(round);
  assert.equal(round.currentMarks[0][0], "empty");

  round = toggleCell(round, 0, 0, "crossed");
  round = clearActivePatch(round);
  assert.equal(round.currentMarks[0][0], "empty");

  for (let row = 0; row < patch.solution.length; row += 1) {
    for (let col = 0; col < patch.solution[row].length; col += 1) {
      if (patch.solution[row][col]) {
        round = toggleCell(round, row, col, "filled");
      }
    }
  }

  const result = submitActivePatch(round, 12);
  assert.equal(result.solved, true);
  assert.equal(result.round.revealedPatchIds.includes(patch.id), true);
  assert.equal(result.round.streak, 1);
  assert.ok(result.patchScore >= 50);
});

test("selecting a patch creates a status message", () => {
  const round = createRound(ACTORS[0], 0);
  const patch = ACTORS[0].patches[0];

  const selected = selectPatch(round, patch.id, 0);

  assert.equal(selected.selectedPatchId, patch.id);
  assert.equal(selected.guessFeedback, "Patch 1-1 selected.");
});

test("round state resets streak after a wrong patch check or actor guess", () => {
  let round = createRound(ACTORS[0], 0);
  const patches = ACTORS[0].patches.filter((candidate) => candidate.size === 5);

  round = selectPatch(round, patches[0].id, 0);
  for (let row = 0; row < patches[0].solution.length; row += 1) {
    for (let col = 0; col < patches[0].solution[row].length; col += 1) {
      if (patches[0].solution[row][col]) {
        round = toggleCell(round, row, col, "filled");
      }
    }
  }

  round = submitActivePatch(round, 8).round;
  assert.equal(round.streak, 1);

  round = selectPatch(round, patches[1].id, 10);
  round = submitActivePatch(round, 14).round;
  assert.equal(round.streak, 0);

  round = submitActorGuess(round, "not right", 20).round;
  assert.equal(round.streak, 0);
});

test("round state keeps wrong guesses alive and ends on a forgiving correct guess", () => {
  const round = createRound(ACTORS[0], 0);

  const wrong = submitActorGuess(round, "not right", 20);
  assert.equal(wrong.round.status, "playing");
  assert.equal(wrong.correct, false);

  const right = submitActorGuess(wrong.round, ACTORS[0].aliases[0], 25);
  assert.equal(right.round.status, "won");
  assert.equal(right.correct, true);
  assert.equal(right.round.streak, 1);
  assert.ok(right.actorScore > 0);
});
