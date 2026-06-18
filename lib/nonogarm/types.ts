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

export type ActorProfile = {
  id: string;
  displayName: string;
  aliases: string[];
  difficulty: Difficulty;
  difficultyMultiplier: number;
  portrait: string;
};

export type ActorEntry = ActorProfile & {
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
