import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { ACTORS } from "../lib/nonogarm/actors.ts";
import {
  getBoardFrame,
  getBoardGridTemplate,
  getBoardPanelStyle,
  getBoardPuzzleMaxWidth,
  getColumnClueLines,
} from "../lib/nonogarm/layout.ts";
import { generateActorPatches, getClues, getPatchSize, isSolved } from "../lib/nonogarm/puzzle.ts";
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
  getSpeedBonus,
  getSpeedFillPercent,
  scoreActorGuess,
  scorePatchSolve,
} from "../lib/nonogarm/scoring.ts";
import { isActorMatch, normalizeGuess } from "../lib/nonogarm/matching.ts";
import { getPlayerRailActions } from "../lib/nonogarm/navigation.ts";
import {
  getLeaderboardEntries,
  mergeLeaderboardMetadata,
  type LeaderboardUser,
} from "../lib/nonogarm/leaderboard.ts";
import {
  getNextPlayableActor,
  mergeGameProgressMetadata,
  readGameProgressMetadata,
} from "../lib/nonogarm/progress.ts";
import { getCellMarkClasses } from "../lib/nonogarm/cell-style.ts";
import type { ActorPatch } from "../lib/nonogarm/types.ts";

function serializePatchSolutions(patches: ActorPatch[]): string[] {
  return patches.map(
    (patch) =>
      `${patch.id}:${patch.solution
        .map((row) => row.map((filled) => (filled ? "1" : "0")).join(""))
        .join("/")}`,
  );
}

function serializeSolution(patch: ActorPatch): string {
  return patch.solution
    .map((row) => row.map((filled) => (filled ? "1" : "0")).join(""))
    .join("/");
}

test("getPatchSize returns 8 for center patches and 5 for outer patches", () => {
  assert.equal(getPatchSize(1, 1), 8);
  assert.equal(getPatchSize(2, 2), 8);
  assert.equal(getPatchSize(0, 0), 5);
  assert.equal(getPatchSize(3, 2), 5);
});

test("generateActorPatches creates stable unique puzzles from a round seed", () => {
  const first = generateActorPatches("ava-sterling", "round-a");
  const again = generateActorPatches("ava-sterling", "round-a");
  const otherRound = generateActorPatches("ava-sterling", "round-b");

  assert.equal(first.length, 16);
  assert.equal(first.filter((patch) => patch.size === 8).length, 4);
  assert.equal(first.filter((patch) => patch.size === 5).length, 12);
  assert.deepEqual(serializePatchSolutions(first), serializePatchSolutions(again));
  assert.notDeepEqual(serializePatchSolutions(first), serializePatchSolutions(otherRound));
  assert.equal(new Set(first.map(serializeSolution)).size, 16);
});

test("createRound attaches generated puzzles and keeps explicit seeds deterministic", () => {
  const first = createRound(ACTORS[0], 0, "memory-seed-a");
  const again = createRound(ACTORS[0], 30, "memory-seed-a");
  const otherRound = createRound(ACTORS[0], 0, "memory-seed-b");

  assert.equal(first.roundSeed, "memory-seed-a");
  assert.equal(first.actor.patches.length, 16);
  assert.deepEqual(
    serializePatchSolutions(first.actor.patches),
    serializePatchSolutions(again.actor.patches),
  );
  assert.notDeepEqual(
    serializePatchSolutions(first.actor.patches),
    serializePatchSolutions(otherRound.actor.patches),
  );
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

test("speed bonus fill drains as time increases", () => {
  assert.equal(getSpeedBonus(0), 900);
  assert.equal(getSpeedBonus(45), 540);
  assert.equal(getSpeedBonus(200), 0);
  assert.equal(getSpeedFillPercent(0), 100);
  assert.equal(getSpeedFillPercent(45), 60);
  assert.equal(getSpeedFillPercent(200), 0);
});

test("speed bonus fill keeps fractional progress for smooth animation", () => {
  assert.ok(Math.abs(getSpeedFillPercent(1) - 99.111) < 0.001);
  assert.ok(Math.abs(getSpeedFillPercent(5) - 95.556) < 0.001);
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
  assert.deepEqual(getLevelProgress(600), {
    level: 1,
    currentXp: 0,
    nextLevelXp: 900,
    progressPercent: 0,
  });
  assert.deepEqual(getLevelProgress(1450), {
    level: 1,
    currentXp: 850,
    nextLevelXp: 900,
    progressPercent: 94,
  });
  assert.deepEqual(getLevelProgress(2700), {
    level: 3,
    currentXp: 0,
    nextLevelXp: 1500,
    progressPercent: 0,
  });
});

test("bankRoundScore carries level XP across actor rounds", () => {
  const careerScore = bankRoundScore(500, 250);

  assert.equal(careerScore, 750);
  assert.deepEqual(getLevelProgress(careerScore), {
    level: 1,
    currentXp: 150,
    nextLevelXp: 900,
    progressPercent: 17,
  });
  assert.equal(bankRoundScore(careerScore, 0), 750);
});

test("actor catalog includes 20 regional musicians with local portraits", () => {
  assert.deepEqual(
    ACTORS.map((actor) => actor.displayName),
    [
      "Marija Šerifović",
      "Željko Joksimović",
      "Konstrakta",
      "Sanja Vučić",
      "Đorđe Balašević",
      "Dino Merlin",
      "Goran Bregović",
      "Zdravko Čolić",
      "Amira Medunjanin",
      "Haris Džinović",
      "Sergej Ćetković",
      "Rambo Amadeus",
      "Knez",
      "Andrea Demirović",
      "Slavko Kalezić",
      "Severina",
      "Oliver Dragojević",
      "Nina Badrić",
      "Josipa Lisac",
      "Tony Cetinski",
    ],
  );
  assert.equal(new Set(ACTORS.map((actor) => actor.id)).size, ACTORS.length);

  for (const actor of ACTORS) {
    assert.ok(actor.aliases.length >= 2, `${actor.displayName} should have guess aliases`);
    assert.ok(actor.portrait.startsWith("/actors/"), `${actor.displayName} should use local portrait`);
    assert.equal(
      existsSync(new URL(`../public${actor.portrait}`, import.meta.url)),
      true,
      `${actor.displayName} portrait should exist`,
    );

    const round = createRound(actor, 0, `catalog-${actor.id}`);

    assert.equal(round.actor.patches.length, 16);
    assert.equal(round.actor.patches.filter((patch) => patch.size === 8).length, 4);
    assert.equal(round.actor.patches.filter((patch) => patch.size === 5).length, 12);
  }
});

test("getBoardFrame gives 5x5 and 8x8 puzzles the same frame", () => {
  const fiveFrame = getBoardFrame(5);
  const eightFrame = getBoardFrame(8);

  assert.equal(fiveFrame.minHeight, 560);
  assert.equal(eightFrame.maxWidth, fiveFrame.maxWidth);
  assert.equal(eightFrame.minHeight, fiveFrame.minHeight);
});

test("getBoardPanelStyle fixes every puzzle state to the shared frame height", () => {
  for (const size of [5, 8] as const) {
    const frame = getBoardFrame(size);

    assert.deepEqual(getBoardPanelStyle(size), {
      height: frame.minHeight,
      maxWidth: frame.maxWidth,
      minHeight: frame.minHeight,
    });
  }
});

test("getBoardPuzzleMaxWidth pads smaller grids inside the shared frame", () => {
  assert.equal(getBoardPuzzleMaxWidth(5), 440);
  assert.equal(getBoardPuzzleMaxWidth(8), 468);
  assert.ok(getBoardPuzzleMaxWidth(5) < getBoardPuzzleMaxWidth(8));
  assert.ok(getBoardPuzzleMaxWidth(8) < getBoardFrame(8).maxWidth);
});

test("getColumnClueLines keeps top clues stacked in order", () => {
  assert.deepEqual(getColumnClueLines([1, 2, 1]), ["1", "2", "1"]);
  assert.deepEqual(getColumnClueLines([0]), ["0"]);
});

test("getBoardGridTemplate lets row clues expand without wrapping", () => {
  assert.equal(getBoardGridTemplate(5), "max-content repeat(5, minmax(0, 1fr))");
  assert.equal(getBoardGridTemplate(8), "max-content repeat(8, minmax(0, 1fr))");
});

test("filled cell styling keeps black fill visible with a white lower-right edge", () => {
  const filledClasses = getCellMarkClasses("filled");

  assert.match(filledClasses, /bg-black/);
  assert.match(filledClasses, /text-white/);
  assert.match(filledClasses, /shadow-\[inset_-4px_-4px_0_#fff\]/);
});

test("round state supports selecting, marking, undoing, clearing, and solving a patch", () => {
  let round = createRound(ACTORS[0], 0, "round-flow");
  const patch = round.actor.patches.find((candidate) => candidate.size === 5)!;

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
  const round = createRound(ACTORS[0], 0, "status-message");
  const patch = round.actor.patches[0];

  const selected = selectPatch(round, patch.id, 0);

  assert.equal(selected.selectedPatchId, patch.id);
  assert.equal(selected.guessFeedback, "Patch 1-1 selected.");
});

test("round state preserves streak after wrong patch checks and resets after wrong actor guesses", () => {
  let round = createRound(ACTORS[0], 0, "streak-reset");
  const patches = round.actor.patches.filter((candidate) => candidate.size === 5);

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
  assert.equal(round.streak, 1);

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

test("new rounds can preserve a correct-guess streak", () => {
  const round = createRound(ACTORS[0], 0, "carry-streak-a", 2);
  const right = submitActorGuess(round, ACTORS[0].displayName, 20);
  const nextRound = createRound(ACTORS[1], 30, "carry-streak-b", right.round.streak);

  assert.equal(right.round.streak, 3);
  assert.equal(nextRound.streak, 3);
});

test("mergeLeaderboardMetadata records the best run while counting every win", () => {
  const first = mergeLeaderboardMetadata(
    undefined,
    {
      actorName: "Ava Sterling",
      elapsedSeconds: 52,
      score: 2400,
      streak: 2,
    },
    "2026-06-18T10:00:00.000Z",
  );

  assert.deepEqual(first, {
    bestActor: "Ava Sterling",
    bestScore: 2400,
    bestSeconds: 52,
    bestStreak: 2,
    updatedAt: "2026-06-18T10:00:00.000Z",
    wins: 1,
  });

  const lowerScore = mergeLeaderboardMetadata(
    first,
    {
      actorName: "Noor Valen",
      elapsedSeconds: 32,
      score: 1800,
      streak: 4,
    },
    "2026-06-18T10:04:00.000Z",
  );

  assert.deepEqual(lowerScore, {
    ...first,
    updatedAt: "2026-06-18T10:04:00.000Z",
    wins: 2,
  });

  const betterScore = mergeLeaderboardMetadata(
    lowerScore,
    {
      actorName: "Milo Voss",
      elapsedSeconds: 41,
      score: 2600,
      streak: 5,
    },
    "2026-06-18T10:08:00.000Z",
  );

  assert.deepEqual(betterScore, {
    bestActor: "Milo Voss",
    bestScore: 2600,
    bestSeconds: 41,
    bestStreak: 5,
    updatedAt: "2026-06-18T10:08:00.000Z",
    wins: 3,
  });
});

test("getLeaderboardEntries ranks Clerk users by career level before run score", () => {
  const users: LeaderboardUser[] = [
    {
      firstName: "Milo",
      id: "user_1",
      imageUrl: "https://example.com/milo.png",
      lastName: "Voss",
      publicMetadata: {
        nonogarmLeaderboard: {
          bestActor: "Ava Sterling",
          bestScore: 5000,
          bestSeconds: 35,
          bestStreak: 2,
          updatedAt: "2026-06-18T10:00:00.000Z",
          wins: 1,
        },
        nonogarmProgress: {
          careerScore: 1000,
          completedActorIds: ["marija-serifovic"],
          streak: 1,
          updatedAt: "2026-06-18T10:00:00.000Z",
        },
      },
      username: null,
    },
    {
      firstName: null,
      id: "user_2",
      imageUrl: "https://example.com/noor.png",
      lastName: null,
      publicMetadata: {
        nonogarmLeaderboard: {
          bestActor: "Noor Valen",
          bestScore: 2800,
          bestSeconds: 48,
          bestStreak: 4,
          updatedAt: "2026-06-18T10:02:00.000Z",
          wins: 2,
        },
        nonogarmProgress: {
          careerScore: 2800,
          completedActorIds: ["marija-serifovic", "zeljko-joksimovic"],
          streak: 4,
          updatedAt: "2026-06-18T10:02:00.000Z",
        },
      },
      username: "noor",
    },
    {
      firstName: "Invalid",
      id: "user_3",
      imageUrl: "",
      lastName: "Metadata",
      publicMetadata: {
        nonogarmLeaderboard: {
          bestScore: "2800",
        },
      },
      username: null,
    },
    {
      firstName: "Legacy",
      id: "user_4",
      imageUrl: "",
      lastName: "Player",
      publicMetadata: {
        nonogarmLeaderboard: {
          bestActor: "Konstrakta",
          bestScore: 1500,
          bestSeconds: 28,
          bestStreak: 1,
          updatedAt: "2026-06-18T10:04:00.000Z",
          wins: 1,
        },
      },
      username: null,
    },
  ];

  assert.deepEqual(getLeaderboardEntries(users, 10), [
    {
      bestActor: "Noor Valen",
      bestScore: 2800,
      bestSeconds: 48,
      bestStreak: 4,
      currentXp: 100,
      imageUrl: "https://example.com/noor.png",
      leaderboardXp: 2800,
      level: 3,
      nextLevelXp: 1500,
      playerName: "noor",
      progressPercent: 7,
      rank: 1,
      updatedAt: "2026-06-18T10:02:00.000Z",
      userId: "user_2",
      wins: 2,
    },
    {
      bestActor: "Konstrakta",
      bestScore: 1500,
      bestSeconds: 28,
      bestStreak: 1,
      currentXp: 0,
      imageUrl: "",
      leaderboardXp: 1500,
      level: 2,
      nextLevelXp: 1200,
      playerName: "Legacy Player",
      progressPercent: 0,
      rank: 2,
      updatedAt: "2026-06-18T10:04:00.000Z",
      userId: "user_4",
      wins: 1,
    },
    {
      bestActor: "Ava Sterling",
      bestScore: 5000,
      bestSeconds: 35,
      bestStreak: 2,
      currentXp: 400,
      imageUrl: "https://example.com/milo.png",
      leaderboardXp: 1000,
      level: 1,
      nextLevelXp: 900,
      playerName: "Milo Voss",
      progressPercent: 44,
      rank: 3,
      updatedAt: "2026-06-18T10:00:00.000Z",
      userId: "user_1",
      wins: 1,
    },
  ]);
});

test("getPlayerRailActions exposes auth actions signed out and leaderboard signed in", () => {
  assert.deepEqual(getPlayerRailActions(false), [
    { color: "bg-[#caff24]", kind: "sign-in", label: "Sign in" },
    { color: "bg-[#ff3f9a]", kind: "sign-up", label: "Sign up" },
  ]);

  assert.deepEqual(getPlayerRailActions(true), [
    {
      color: "bg-[#39d4ee]",
      href: "/leaderboard",
      kind: "link",
      label: "Leaderboard",
    },
    { color: "bg-white", kind: "account", label: "Account" },
  ]);
});

test("mergeGameProgressMetadata stores best score, streak, and completed actors", () => {
  const first = mergeGameProgressMetadata(
    undefined,
    {
      actorId: "ava-sterling",
      careerScore: 1400,
      streak: 3,
    },
    "2026-06-18T11:00:00.000Z",
  );

  assert.deepEqual(first, {
    careerScore: 1400,
    completedActorIds: ["ava-sterling"],
    streak: 3,
    updatedAt: "2026-06-18T11:00:00.000Z",
  });

  const merged = mergeGameProgressMetadata(
    first,
    {
      actorId: "milo-voss",
      careerScore: 900,
      streak: 1,
    },
    "2026-06-18T11:04:00.000Z",
  );

  assert.deepEqual(merged, {
    careerScore: 1400,
    completedActorIds: ["ava-sterling", "milo-voss"],
    streak: 1,
    updatedAt: "2026-06-18T11:04:00.000Z",
  });
});

test("readGameProgressMetadata sanitizes invalid Clerk metadata", () => {
  assert.equal(readGameProgressMetadata(null), null);
  assert.equal(readGameProgressMetadata({ careerScore: "a lot" }), null);

  assert.deepEqual(
    readGameProgressMetadata({
      careerScore: 600.4,
      completedActorIds: ["ava-sterling", "", "ava-sterling", 42],
      streak: 2.6,
      updatedAt: "2026-06-18T11:08:00.000Z",
    }),
    {
      careerScore: 600,
      completedActorIds: ["ava-sterling"],
      streak: 3,
      updatedAt: "2026-06-18T11:08:00.000Z",
    },
  );
});

test("getNextPlayableActor skips completed actors and stops when all are finished", () => {
  assert.equal(
    getNextPlayableActor(ACTORS, "marija-serifovic", ["marija-serifovic"])?.id,
    "zeljko-joksimovic",
  );
  assert.equal(
    getNextPlayableActor(ACTORS, "zeljko-joksimovic", [
      "marija-serifovic",
      "zeljko-joksimovic",
    ])?.id,
    "konstrakta",
  );
  assert.equal(
    getNextPlayableActor(
      ACTORS,
      "tony-cetinski",
      ACTORS.map((actor) => actor.id),
    ),
    null,
  );
});
