# Nonogarm Playable Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a playable neobrutalist Nonogarm prototype with free patch selection, 5x5/8x8 nonograms, generated actor stand-ins, timer-based scoring, and forgiving actor guesses.

**Architecture:** Keep `app/page.tsx` as a Server Component that renders one Client Component game shell. Put all nonogram, scoring, matching, and round-state behavior in small pure TypeScript modules under `lib/nonogarm/` so the future puzzle engine can replace starter data without rewriting the UI.

**Tech Stack:** Next.js App Router, React 19 Client Components, TypeScript, Tailwind CSS v4, lucide-react icons, Node 26 built-in test runner with `--experimental-strip-types`.

---

## File Structure

- Modify `package.json`: add `type: module` and `test:logic` for Node's TypeScript-capable test runner.
- Modify `tsconfig.json`: allow explicit TypeScript extension imports for no-emit test/runtime compatibility.
- Create `tests/nonogarm.logic.test.mts`: pure behavior tests for clues, scoring, matching, patch sizing, and round state.
- Create `lib/nonogarm/types.ts`: shared types for marks, patches, actors, rounds, and score results.
- Create `lib/nonogarm/puzzle.ts`: clue generation, empty board creation, patch size detection, and solution comparison.
- Create `lib/nonogarm/scoring.ts`: nonogram and actor score formulas.
- Create `lib/nonogarm/matching.ts`: accent-insensitive free-text actor matching.
- Create `lib/nonogarm/actors.ts`: three generated actor stand-ins, aliases, difficulty multipliers, and starter patch solutions.
- Create `lib/nonogarm/round.ts`: pure round-state transitions for selecting patches, marking cells, undo, clear, submitting patches, and submitting guesses.
- Create `public/actors/ava-sterling.svg`, `public/actors/milo-voss.svg`, and `public/actors/noor-valen.svg`: generated-style fictional portrait assets.
- Modify `app/page.tsx`: render the Nonogarm game shell.
- Modify `app/layout.tsx`: update metadata from Create Next App defaults.
- Create `app/nonogarm/game-shell.tsx`: Client Component that owns live timers and composes the UI.
- Create `app/nonogarm/ui.tsx`: presentational components for header, status rail, board, controls, portrait reveal, guess panel, and score HUD.
- Modify `app/globals.css`: add game-friendly base background and small utility classes only when Tailwind utilities are too noisy.

---

### Task 1: Add Logic Test Harness And Puzzle Helpers

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.json`
- Create: `tests/nonogarm.logic.test.mts`
- Create: `lib/nonogarm/types.ts`
- Create: `lib/nonogarm/puzzle.ts`
- Create: `lib/nonogarm/scoring.ts`
- Create: `lib/nonogarm/matching.ts`

- [ ] **Step 1: Add the logic test script**

Patch `package.json`:

```json
"type": "module",
"test:logic": "node --test --experimental-strip-types tests/nonogarm.logic.test.mts"
```

- [ ] **Step 2: Allow explicit TypeScript extension imports**

Patch `tsconfig.json` inside `compilerOptions`:

```json
"allowImportingTsExtensions": true
```

- [ ] **Step 3: Write failing logic tests**

Create `tests/nonogarm.logic.test.mts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { getClues, getPatchSize, isSolved } from "../lib/nonogarm/puzzle.ts";
import { scoreActorGuess, scorePatchSolve } from "../lib/nonogarm/scoring.ts";
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
```

- [ ] **Step 4: Run tests and verify the expected red state**

Run:

```bash
npm run test:logic
```

Expected: FAIL because `lib/nonogarm/puzzle.ts`, `scoring.ts`, and `matching.ts` do not exist yet.

- [ ] **Step 5: Implement the helper modules**

Create `lib/nonogarm/types.ts`:

```ts
export type Difficulty = "Easy" | "Medium" | "Hard";
export type CellMark = "empty" | "filled" | "crossed";
export type BoardMarks = CellMark[][];
export type SolutionGrid = boolean[][];

export type PatchStatus = "hidden" | "active" | "solved";

export type ActorPatch = {
  id: string;
  row: number;
  col: number;
  size: 5 | 8;
  solution: SolutionGrid;
};

export type ActorEntry = {
  id: string;
  displayName: string;
  aliases: string[];
  difficulty: Difficulty;
  difficultyMultiplier: number;
  portrait: string;
  patches: ActorPatch[];
};

export type PatchScoreInput = {
  size: 5 | 8;
  seconds: number;
  wrongSubmits: number;
};

export type ActorScoreInput = {
  difficultyMultiplier: number;
  seconds: number;
  revealedPatches: number;
  totalPatches: number;
};
```

Create `lib/nonogarm/puzzle.ts` with these exported functions:

```ts
import type { BoardMarks, CellMark, SolutionGrid } from "./types.ts";

export function getPatchSize(row: number, col: number): 5 | 8 {
  return row >= 1 && row <= 2 && col >= 1 && col <= 2 ? 8 : 5;
}

export function createEmptyMarks(size: number): BoardMarks {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => "empty" as CellMark),
  );
}

export function getClues(solution: SolutionGrid, axis: "row" | "column"): number[][] {
  const length = axis === "row" ? solution.length : solution[0]?.length ?? 0;

  return Array.from({ length }, (_, outerIndex) => {
    const line =
      axis === "row"
        ? solution[outerIndex]
        : solution.map((row) => row[outerIndex]);
    const runs: number[] = [];
    let currentRun = 0;

    for (const filled of line) {
      if (filled) {
        currentRun += 1;
      } else if (currentRun > 0) {
        runs.push(currentRun);
        currentRun = 0;
      }
    }

    if (currentRun > 0) runs.push(currentRun);
    return runs.length > 0 ? runs : [0];
  });
}

export function isSolved(solution: SolutionGrid, marks: readonly (readonly CellMark[])[]): boolean {
  return solution.every((row, rowIndex) =>
    row.every((filled, colIndex) => (filled ? marks[rowIndex]?.[colIndex] === "filled" : marks[rowIndex]?.[colIndex] !== "filled")),
  );
}
```

Create `lib/nonogarm/scoring.ts`:

```ts
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
```

Create `lib/nonogarm/matching.ts`:

```ts
import type { ActorEntry } from "./types.ts";

export function normalizeGuess(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function isActorMatch(actor: Pick<ActorEntry, "displayName" | "aliases">, guess: string): boolean {
  const normalizedGuess = normalizeGuess(guess);
  if (!normalizedGuess) return false;

  return [actor.displayName, ...actor.aliases].some(
    (name) => normalizeGuess(name) === normalizedGuess,
  );
}
```

- [ ] **Step 6: Run tests and verify green state**

Run:

```bash
npm run test:logic
```

Expected: PASS with 7 passing tests.

---

### Task 2: Add Actor Stand-Ins And Round State

**Files:**
- Modify: `tests/nonogarm.logic.test.mts`
- Create: `lib/nonogarm/actors.ts`
- Create: `lib/nonogarm/round.ts`
- Create: `public/actors/ava-sterling.svg`
- Create: `public/actors/milo-voss.svg`
- Create: `public/actors/noor-valen.svg`

- [ ] **Step 1: Extend tests for actor data and round state**

Add these imports near the top of `tests/nonogarm.logic.test.mts`, then append the tests below the existing tests:

```ts
import { ACTORS } from "../lib/nonogarm/actors.ts";
import {
  clearActivePatch,
  createRound,
  selectPatch,
  submitActorGuess,
  submitActivePatch,
  toggleCell,
  undoLastMark,
} from "../lib/nonogarm/round.ts";

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
      if (patch.solution[row][col]) round = toggleCell(round, row, col, "filled");
    }
  }

  const result = submitActivePatch(round, 12);
  assert.equal(result.solved, true);
  assert.equal(result.round.revealedPatchIds.includes(patch.id), true);
  assert.ok(result.patchScore >= 50);
});

test("round state keeps wrong guesses alive and ends on a forgiving correct guess", () => {
  let round = createRound(ACTORS[0], 0);

  const wrong = submitActorGuess(round, "not right", 20);
  assert.equal(wrong.round.status, "playing");
  assert.equal(wrong.correct, false);

  const right = submitActorGuess(wrong.round, ACTORS[0].aliases[0], 25);
  assert.equal(right.round.status, "won");
  assert.equal(right.correct, true);
  assert.ok(right.actorScore > 0);
});
```

- [ ] **Step 2: Run tests and verify red state**

Run:

```bash
npm run test:logic
```

Expected: FAIL because `actors.ts` and `round.ts` do not exist.

- [ ] **Step 3: Create generated-style fictional portrait assets**

Create three SVG portraits in `public/actors/`. Each file should be a square `viewBox="0 0 640 640"` portrait with a bold flat background, stylized fictional face, no real-person likeness, no text, and enough facial detail for patch reveals.

- [ ] **Step 4: Implement actor data**

Create `lib/nonogarm/actors.ts` with:

```ts
import { getPatchSize } from "./puzzle.ts";
import type { ActorEntry, ActorPatch, SolutionGrid } from "./types.ts";

const FIVE_SOLUTIONS: SolutionGrid[] = [
  [[false, true, true, true, false], [true, false, false, false, true], [true, true, true, true, true], [true, false, false, false, true], [true, false, false, false, true]],
  [[true, true, true, false, false], [true, false, false, true, false], [true, true, true, false, false], [true, false, true, false, false], [true, false, false, true, false]],
  [[false, true, true, true, false], [true, false, false, false, true], [true, false, false, false, false], [true, false, false, false, true], [false, true, true, true, false]],
  [[true, true, true, true, false], [true, false, false, false, true], [true, false, false, false, true], [true, false, false, false, true], [true, true, true, true, false]],
];

const EIGHT_SOLUTIONS: SolutionGrid[] = [
  [[false, false, true, true, true, true, false, false], [false, true, false, false, false, false, true, false], [true, false, true, false, false, true, false, true], [true, false, false, false, false, false, false, true], [true, false, true, true, true, true, false, true], [true, false, false, false, false, false, false, true], [false, true, false, false, false, false, true, false], [false, false, true, true, true, true, false, false]],
  [[true, true, true, false, false, true, true, true], [true, false, false, true, true, false, false, true], [true, false, true, false, false, true, false, true], [true, true, false, false, false, false, true, true], [true, false, true, false, false, true, false, true], [true, false, false, true, true, false, false, true], [true, false, false, false, false, false, false, true], [true, true, true, true, true, true, true, true]],
];

function buildPatches(actorId: string): ActorPatch[] {
  let fiveIndex = 0;
  let eightIndex = 0;

  return Array.from({ length: 4 }, (_, row) =>
    Array.from({ length: 4 }, (_, col) => {
      const size = getPatchSize(row, col);
      const solution = size === 8 ? EIGHT_SOLUTIONS[eightIndex++ % EIGHT_SOLUTIONS.length] : FIVE_SOLUTIONS[fiveIndex++ % FIVE_SOLUTIONS.length];
      return { id: `${actorId}-${row}-${col}`, row, col, size, solution };
    }),
  ).flat();
}

export const ACTORS: ActorEntry[] = [
  { id: "ava-sterling", displayName: "Ava Sterling", aliases: ["Ava", "Sterling"], difficulty: "Easy", difficultyMultiplier: 1, portrait: "/actors/ava-sterling.svg", patches: buildPatches("ava-sterling") },
  { id: "milo-voss", displayName: "Milo Voss", aliases: ["Milo", "Voss"], difficulty: "Medium", difficultyMultiplier: 1.4, portrait: "/actors/milo-voss.svg", patches: buildPatches("milo-voss") },
  { id: "noor-valen", displayName: "Noor Valen", aliases: ["Noor", "Valen"], difficulty: "Hard", difficultyMultiplier: 1.8, portrait: "/actors/noor-valen.svg", patches: buildPatches("noor-valen") },
];
```

- [ ] **Step 5: Implement round transitions**

Create `lib/nonogarm/round.ts` with pure functions matching the tests:

```ts
import { isActorMatch } from "./matching.ts";
import { createEmptyMarks, isSolved } from "./puzzle.ts";
import { scoreActorGuess, scorePatchSolve } from "./scoring.ts";
import type { ActorEntry, ActorPatch, BoardMarks, CellMark } from "./types.ts";

export type RoundStatus = "playing" | "won";

export type RoundState = {
  actor: ActorEntry;
  selectedPatchId: string | null;
  currentMarks: BoardMarks;
  revealedPatchIds: string[];
  score: number;
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

export function createRound(actor: ActorEntry, nowSeconds: number): RoundState {
  return { actor, selectedPatchId: null, currentMarks: [], revealedPatchIds: [], score: 0, startedAt: nowSeconds, activePatchStartedAt: null, wrongSubmitsByPatch: {}, undoStack: [], status: "playing", guessFeedback: "" };
}

export function getSelectedPatch(round: RoundState): ActorPatch | null {
  return round.actor.patches.find((patch) => patch.id === round.selectedPatchId) ?? null;
}

export function selectPatch(round: RoundState, patchId: string, nowSeconds: number): RoundState {
  const patch = round.actor.patches.find((candidate) => candidate.id === patchId);
  if (!patch || round.revealedPatchIds.includes(patchId) || round.status === "won") return round;
  return { ...round, selectedPatchId: patch.id, currentMarks: createEmptyMarks(patch.size), activePatchStartedAt: nowSeconds, undoStack: [], guessFeedback: `Patch ${patch.row + 1}-${patch.col + 1} selected.` };
}

export function toggleCell(round: RoundState, row: number, col: number, mode: Exclude<CellMark, "empty">): RoundState {
  if (!round.selectedPatchId || round.status === "won") return round;
  const nextMarks = cloneMarks(round.currentMarks);
  nextMarks[row][col] = nextMarks[row][col] === mode ? "empty" : mode;
  return { ...round, currentMarks: nextMarks, undoStack: [...round.undoStack, cloneMarks(round.currentMarks)] };
}

export function undoLastMark(round: RoundState): RoundState {
  const previous = round.undoStack.at(-1);
  if (!previous) return round;
  return { ...round, currentMarks: cloneMarks(previous), undoStack: round.undoStack.slice(0, -1) };
}

export function clearActivePatch(round: RoundState): RoundState {
  const patch = getSelectedPatch(round);
  if (!patch) return round;
  return { ...round, currentMarks: createEmptyMarks(patch.size), undoStack: [...round.undoStack, cloneMarks(round.currentMarks)] };
}

export function submitActivePatch(round: RoundState, nowSeconds: number): { round: RoundState; solved: boolean; patchScore: number } {
  const patch = getSelectedPatch(round);
  if (!patch) return { round, solved: false, patchScore: 0 };
  const wrongSubmits = round.wrongSubmitsByPatch[patch.id] ?? 0;
  const seconds = Math.max(0, nowSeconds - (round.activePatchStartedAt ?? nowSeconds));
  if (!isSolved(patch.solution, round.currentMarks)) {
    return { round: { ...round, wrongSubmitsByPatch: { ...round.wrongSubmitsByPatch, [patch.id]: wrongSubmits + 1 }, guessFeedback: "Not quite. Check the clues." }, solved: false, patchScore: 0 };
  }
  const patchScore = scorePatchSolve({ size: patch.size, seconds, wrongSubmits });
  return { round: { ...round, selectedPatchId: null, currentMarks: [], activePatchStartedAt: null, revealedPatchIds: [...round.revealedPatchIds, patch.id], score: round.score + patchScore, undoStack: [], guessFeedback: `Patch solved +${patchScore}.` }, solved: true, patchScore };
}

export function submitActorGuess(round: RoundState, guess: string, nowSeconds: number): { round: RoundState; correct: boolean; actorScore: number } {
  if (!guess.trim()) return { round: { ...round, guessFeedback: "Type a name first." }, correct: false, actorScore: 0 };
  if (!isActorMatch(round.actor, guess)) return { round: { ...round, guessFeedback: "No match yet. Reveal another patch?" }, correct: false, actorScore: 0 };
  const actorScore = scoreActorGuess({ difficultyMultiplier: round.actor.difficultyMultiplier, seconds: Math.max(0, nowSeconds - round.startedAt), revealedPatches: round.revealedPatchIds.length, totalPatches: round.actor.patches.length });
  return { round: { ...round, score: round.score + actorScore, status: "won", guessFeedback: `Correct: ${round.actor.displayName}! +${actorScore}.` }, correct: true, actorScore };
}
```

- [ ] **Step 6: Run tests and verify green state**

Run:

```bash
npm run test:logic
```

Expected: PASS with 10 passing tests.

---

### Task 3: Build The Client Game Shell

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/layout.tsx`
- Create: `app/nonogarm/game-shell.tsx`
- Create: `app/nonogarm/ui.tsx`

- [ ] **Step 1: Replace the starter page with the game shell**

`app/page.tsx` should import and render the client game:

```tsx
import { GameShell } from "./nonogarm/game-shell";

export default function Home() {
  return <GameShell />;
}
```

- [ ] **Step 2: Update metadata**

Change `app/layout.tsx` metadata:

```ts
export const metadata: Metadata = {
  title: "Nonogarm",
  description: "Solve nonogram patches, reveal the actor, and score fast guesses.",
};
```

- [ ] **Step 3: Create the client shell**

Create `app/nonogarm/game-shell.tsx` as a `"use client"` entry. It should:

- use `ACTORS`, `createRound`, `selectPatch`, `toggleCell`, `undoLastMark`, `clearActivePatch`, `submitActivePatch`, and `submitActorGuess`.
- keep `mode` as `"filled" | "crossed"`.
- keep a live elapsed timer with `setInterval`.
- rotate to the next actor on New Round.
- derive the active patch with `getSelectedPatch`.
- pass state and callbacks to presentational components from `ui.tsx`.

- [ ] **Step 4: Create presentational UI components**

Create `app/nonogarm/ui.tsx` exporting:

```ts
export function HeaderBanner(...): JSX.Element
export function StatusRail(...): JSX.Element
export function NonogramBoard(...): JSX.Element
export function PuzzleControls(...): JSX.Element
export function PortraitReveal(...): JSX.Element
export function GuessPanel(...): JSX.Element
export function ScoreHud(...): JSX.Element
```

The components must render the approved Arcade Split structure: title/status/puzzle/controls on the left and portrait/guess/HUD on the right.

- [ ] **Step 5: Run type and lint checks**

Run:

```bash
npm run lint
npm run build
```

Expected: both commands complete successfully.

---

### Task 4: Apply Neobrutalist Styling And Responsive Layout

**Files:**
- Modify: `app/globals.css`
- Modify: `app/nonogarm/game-shell.tsx`
- Modify: `app/nonogarm/ui.tsx`

- [ ] **Step 1: Add compact game utilities**

In `app/globals.css`, keep the existing Tailwind/shadcn imports and theme variables. Add only project-specific base refinements:

```css
body {
  min-width: 320px;
}

button,
input {
  font: inherit;
}
```

- [ ] **Step 2: Style the desktop Arcade Split layout**

Use Tailwind classes and the existing neobrutalist tokens:

- `border-4 border-black`
- `shadow-[8px_8px_0_#000]`
- bright surfaces using explicit colors where the existing theme does not cover the reference palette
- stable board dimensions with CSS grid and square cells
- portrait `aspect-[4/3]` on desktop
- HUD tiles in a four-column grid

- [ ] **Step 3: Style the mobile stack**

Use responsive classes so below large desktop widths the page becomes:

1. Header.
2. Score HUD.
3. Portrait reveal and guess panel.
4. Active puzzle.
5. Controls and status rail.

- [ ] **Step 4: Run build**

Run:

```bash
npm run build
```

Expected: build completes successfully with no TypeScript or CSS errors.

---

### Task 5: Browser Verification And Interaction Fixes

**Files:**
- Modify files from Tasks 3-4 only if browser verification finds defects.

- [ ] **Step 1: Start the dev server**

Run:

```bash
npm run dev
```

Expected: local Next app starts and prints a localhost URL.

- [ ] **Step 2: Open the app in the in-app browser**

Navigate the Browser/IAB to the local URL. Verify the desktop first viewport shows:

- NONOGARM title.
- Left puzzle board area.
- Fill, Cross, Undo, Clear, and Check controls.
- Right portrait reveal panel with 4x4 patch grid.
- Free-text guess input and Guess button.
- Score, time, revealed count, and puzzle size HUD.

- [ ] **Step 3: Verify the core interaction path**

In the browser:

1. Select an outer patch and confirm the board is 5x5.
2. Mark cells with Fill and Cross.
3. Use Undo and Clear.
4. Submit an incomplete puzzle and confirm feedback plus wrong-submit state.
5. Fill the selected puzzle solution and submit it.
6. Confirm one portrait patch reveals and score increases.
7. Select a center patch and confirm the board is 8x8.
8. Submit a wrong actor guess and confirm the round continues.
9. Submit the actor alias and confirm the round ends with final score.
10. Start a new round and confirm another actor loads.

- [ ] **Step 4: Verify mobile layout**

Use the Browser/IAB viewport capability or an equivalent mobile-sized viewport around 390x844. Confirm no major text overlap, clipped controls, or unusable board cells.

- [ ] **Step 5: Capture screenshots for final review**

Save a desktop implementation screenshot under `/private/tmp/nonogarm-desktop.png` and a mobile screenshot under `/private/tmp/nonogarm-mobile.png`.

---

### Task 6: Final Verification And Cleanup

**Files:**
- Modify: `.gitignore`
- Commit all implementation files after verification.

- [ ] **Step 1: Ignore visual companion scratch files**

Add this line to `.gitignore`:

```gitignore
.superpowers/
```

- [ ] **Step 2: Run final commands**

Run:

```bash
npm run test:logic
npm run lint
npm run build
```

Expected: all commands complete successfully.

- [ ] **Step 3: Inspect git status**

Run:

```bash
git status --short
```

Expected: only intentional implementation files are modified or added.

- [ ] **Step 4: Stage and commit**

Run:

```bash
git add .gitignore package.json app lib public tests docs/superpowers/plans/2026-06-17-nonogarm-playable-prototype.md
git commit -m "Build Nonogarm playable prototype"
```

Expected: commit succeeds on `feature/nonogarm-playable-prototype`.

---

## Self-Review Notes

- Spec coverage: Tasks cover free patch choice, 4x4 patch map, center 8x8 puzzles, outer 5x5 puzzles, generated actor stand-ins, forgiving free-text guesses, scoring with time and difficulty, neobrutalist UI, desktop/mobile layouts, and browser verification.
- Scope control: real actor photos, persistent profiles, full stats/settings pages, and a full puzzle engine remain outside this prototype.
- Type consistency: the plan uses `ActorEntry`, `ActorPatch`, `SolutionGrid`, `BoardMarks`, `CellMark`, `RoundState`, and `RoundStatus` consistently across tests and modules.
