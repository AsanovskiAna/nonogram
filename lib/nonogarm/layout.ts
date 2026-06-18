export type BoardFrame = {
  maxWidth: number;
  minHeight: number;
  puzzleMaxWidth: number;
};

const SHARED_BOARD_FRAME = {
  maxWidth: 580,
  minHeight: 560,
};

const BOARD_FRAMES: Record<5 | 8, BoardFrame> = {
  5: { ...SHARED_BOARD_FRAME, puzzleMaxWidth: 440 },
  8: { ...SHARED_BOARD_FRAME, puzzleMaxWidth: 468 },
};

export function getBoardFrame(size: 5 | 8): BoardFrame {
  return BOARD_FRAMES[size];
}

export function getBoardPanelStyle(size: 5 | 8): {
  height: number;
  maxWidth: number;
  minHeight: number;
} {
  const frame = getBoardFrame(size);

  return {
    height: frame.minHeight,
    maxWidth: frame.maxWidth,
    minHeight: frame.minHeight,
  };
}

export function getBoardPuzzleMaxWidth(size: 5 | 8): number {
  return getBoardFrame(size).puzzleMaxWidth;
}

export function getBoardGridTemplate(size: 5 | 8): string {
  return `max-content repeat(${size}, minmax(0, 1fr))`;
}

export function getColumnClueLines(clue: number[]): string[] {
  return clue.map((value) => value.toString());
}
