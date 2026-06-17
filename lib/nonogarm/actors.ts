import { getPatchSize } from "./puzzle.ts";
import type { ActorEntry, ActorPatch, SolutionGrid } from "./types.ts";

const FIVE_SOLUTIONS: SolutionGrid[] = [
  [
    [false, true, true, true, false],
    [true, false, false, false, true],
    [true, true, true, true, true],
    [true, false, false, false, true],
    [true, false, false, false, true],
  ],
  [
    [true, true, true, false, false],
    [true, false, false, true, false],
    [true, true, true, false, false],
    [true, false, true, false, false],
    [true, false, false, true, false],
  ],
  [
    [false, true, true, true, false],
    [true, false, false, false, true],
    [true, false, false, false, false],
    [true, false, false, false, true],
    [false, true, true, true, false],
  ],
  [
    [true, true, true, true, false],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [true, true, true, true, false],
  ],
];

const EIGHT_SOLUTIONS: SolutionGrid[] = [
  [
    [false, false, true, true, true, true, false, false],
    [false, true, false, false, false, false, true, false],
    [true, false, true, false, false, true, false, true],
    [true, false, false, false, false, false, false, true],
    [true, false, true, true, true, true, false, true],
    [true, false, false, false, false, false, false, true],
    [false, true, false, false, false, false, true, false],
    [false, false, true, true, true, true, false, false],
  ],
  [
    [true, true, true, false, false, true, true, true],
    [true, false, false, true, true, false, false, true],
    [true, false, true, false, false, true, false, true],
    [true, true, false, false, false, false, true, true],
    [true, false, true, false, false, true, false, true],
    [true, false, false, true, true, false, false, true],
    [true, false, false, false, false, false, false, true],
    [true, true, true, true, true, true, true, true],
  ],
  [
    [false, true, true, false, false, true, true, false],
    [true, false, false, true, true, false, false, true],
    [true, false, true, false, false, true, false, true],
    [false, true, false, true, true, false, true, false],
    [false, true, false, true, true, false, true, false],
    [true, false, true, false, false, true, false, true],
    [true, false, false, true, true, false, false, true],
    [false, true, true, false, false, true, true, false],
  ],
];

function buildPatches(actorId: string): ActorPatch[] {
  let fiveIndex = 0;
  let eightIndex = 0;

  return Array.from({ length: 4 }, (_, row) =>
    Array.from({ length: 4 }, (_, col) => {
      const size = getPatchSize(row, col);
      const solution =
        size === 8
          ? EIGHT_SOLUTIONS[eightIndex++ % EIGHT_SOLUTIONS.length]
          : FIVE_SOLUTIONS[fiveIndex++ % FIVE_SOLUTIONS.length];

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

export const ACTORS: ActorEntry[] = [
  {
    id: "ava-sterling",
    displayName: "Ava Sterling",
    aliases: ["Ava", "Sterling", "A Sterling"],
    difficulty: "Easy",
    difficultyMultiplier: 1,
    portrait: "/actors/ava-sterling.svg",
    patches: buildPatches("ava-sterling"),
  },
  {
    id: "milo-voss",
    displayName: "Milo Voss",
    aliases: ["Milo", "Voss", "M Voss"],
    difficulty: "Medium",
    difficultyMultiplier: 1.4,
    portrait: "/actors/milo-voss.svg",
    patches: buildPatches("milo-voss"),
  },
  {
    id: "noor-valen",
    displayName: "Noor Valen",
    aliases: ["Noor", "Valen", "N Valen"],
    difficulty: "Hard",
    difficultyMultiplier: 1.8,
    portrait: "/actors/noor-valen.svg",
    patches: buildPatches("noor-valen"),
  },
];
