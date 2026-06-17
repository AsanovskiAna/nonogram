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

    if (currentRun > 0) {
      runs.push(currentRun);
    }

    return runs.length > 0 ? runs : [0];
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
