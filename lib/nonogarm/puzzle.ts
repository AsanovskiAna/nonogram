import type { ActorPatch, BoardMarks, CellMark, SolutionGrid } from "./types.ts";

const BOARD_ROWS = 4;
const BOARD_COLS = 4;
const MAX_GENERATION_ATTEMPTS = 600;
const UNIQUE_SOLUTION_LIMIT = 2;
const FNV_OFFSET = 2_166_136_261;
const FNV_PRIME = 16_777_619;

const MIN_FILLED_CELLS: Record<5 | 8, number> = {
  5: 8,
  8: 20,
};

const MAX_FILLED_CELLS: Record<5 | 8, number> = {
  5: 17,
  8: 44,
};

export function getPatchSize(row: number, col: number): 5 | 8 {
  return row >= 1 && row <= 2 && col >= 1 && col <= 2 ? 8 : 5;
}

export function createRoundSeed(): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) {
    return uuid;
  }

  return `${Date.now()}-${Math.random()}`;
}

function hashString(value: string): number {
  let hash = FNV_OFFSET;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, FNV_PRIME);
  }

  return hash >>> 0;
}

function createRandom(seed: string): () => number {
  let state = hashString(seed) || 0x6d2b79f5;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function getLineClues(line: readonly boolean[]): number[] {
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

  if (currentRun > 0) {
    runs.push(currentRun);
  }

  return runs.length > 0 ? runs : [0];
}

function cluesMatch(left: readonly number[], right: readonly number[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function serializeSolution(solution: SolutionGrid): string {
  return solution
    .map((row) => row.map((filled) => (filled ? "1" : "0")).join(""))
    .join("/");
}

function createCandidateSolution(size: 5 | 8, random: () => number): SolutionGrid {
  const density = size === 5 ? 0.42 + random() * 0.12 : 0.38 + random() * 0.14;

  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => random() < density),
  );
}

function countFilledCells(solution: SolutionGrid): number {
  return solution.reduce(
    (total, row) => total + row.filter((filled) => filled).length,
    0,
  );
}

function hasMixedLines(solution: SolutionGrid): boolean {
  const columns = solution[0].map((_, colIndex) => solution.map((row) => row[colIndex]));
  const lines = [...solution, ...columns];

  return lines.every((line) => line.some(Boolean) && line.some((filled) => !filled));
}

function passesQualityChecks(solution: SolutionGrid, size: 5 | 8): boolean {
  const filledCells = countFilledCells(solution);

  return (
    filledCells >= MIN_FILLED_CELLS[size] &&
    filledCells <= MAX_FILLED_CELLS[size] &&
    hasMixedLines(solution)
  );
}

function getLinePatterns(size: number, clue: readonly number[]): boolean[][] {
  const patterns: boolean[][] = [];
  const maxMask = 1 << size;

  for (let mask = 0; mask < maxMask; mask += 1) {
    const pattern = Array.from(
      { length: size },
      (_, index) => (mask & (1 << (size - index - 1))) !== 0,
    );

    if (cluesMatch(getLineClues(pattern), clue)) {
      patterns.push(pattern);
    }
  }

  return patterns;
}

function canPrefixMatchClue(
  prefix: readonly boolean[],
  clue: readonly number[],
  size: number,
): boolean {
  const remainingCells = size - prefix.length;
  const suffixCount = 1 << remainingCells;

  for (let mask = 0; mask < suffixCount; mask += 1) {
    const suffix = Array.from(
      { length: remainingCells },
      (_, index) => (mask & (1 << (remainingCells - index - 1))) !== 0,
    );

    if (cluesMatch(getLineClues([...prefix, ...suffix]), clue)) {
      return true;
    }
  }

  return false;
}

function countSolutions(solution: SolutionGrid, limit: number): number {
  const size = solution.length;
  const rowClues = getClues(solution, "row");
  const columnClues = getClues(solution, "column");
  const rowPatterns = rowClues.map((clue) => getLinePatterns(size, clue));
  const rows: boolean[][] = [];
  let count = 0;

  function search(rowIndex: number) {
    if (count >= limit) {
      return;
    }

    if (rowIndex === size) {
      count += 1;
      return;
    }

    for (const pattern of rowPatterns[rowIndex]) {
      rows.push(pattern);

      const columnsCanMatch = columnClues.every((clue, colIndex) =>
        canPrefixMatchClue(
          rows.map((row) => row[colIndex]),
          clue,
          size,
        ),
      );

      if (columnsCanMatch) {
        search(rowIndex + 1);
      }

      rows.pop();
    }
  }

  search(0);
  return count;
}

function hasUniqueSolution(solution: SolutionGrid): boolean {
  return countSolutions(solution, UNIQUE_SOLUTION_LIMIT) === 1;
}

function generatePatchSolution(
  size: 5 | 8,
  seed: string,
  seenSolutions: Set<string>,
): SolutionGrid {
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const random = createRandom(`${seed}:${attempt}`);
    const solution = createCandidateSolution(size, random);
    const serialized = serializeSolution(solution);

    if (
      !seenSolutions.has(serialized) &&
      passesQualityChecks(solution, size) &&
      hasUniqueSolution(solution)
    ) {
      seenSolutions.add(serialized);
      return solution;
    }
  }

  throw new Error(`Unable to generate a unique ${size}x${size} nonogram patch.`);
}

export function generateActorPatches(actorId: string, roundSeed: string): ActorPatch[] {
  const seenSolutions = new Set<string>();

  return Array.from({ length: BOARD_ROWS }, (_, row) =>
    Array.from({ length: BOARD_COLS }, (_, col) => {
      const size = getPatchSize(row, col);
      const solution = generatePatchSolution(
        size,
        `${roundSeed}:${actorId}:${row}:${col}`,
        seenSolutions,
      );

      return {
        id: `${actorId}-${row}-${col}`,
        row,
        col,
        size,
        solution,
      };
    }),
  ).flat();
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
    return getLineClues(line);
  });
}

export function isSolved(
  solution: SolutionGrid,
  marks: readonly (readonly CellMark[])[],
): boolean {
  return solution.every((row, rowIndex) =>
    row.every((filled, colIndex) => {
      const mark = marks[rowIndex]?.[colIndex];
      return filled ? mark === "filled" : mark !== "filled";
    }),
  );
}
