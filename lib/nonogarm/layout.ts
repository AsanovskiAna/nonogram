export type BoardFrame = {
  maxWidth: number;
  minHeight: number;
};

const BOARD_FRAMES: Record<5 | 8, BoardFrame> = {
  5: { maxWidth: 580, minHeight: 600 },
  8: { maxWidth: 580, minHeight: 600 },
};

export function getBoardFrame(size: 5 | 8): BoardFrame {
  return BOARD_FRAMES[size];
}

export function getBoardGridTemplate(size: 5 | 8): string {
  return `max-content repeat(${size}, minmax(0, 1fr))`;
}

export function getColumnClueLines(clue: number[]): string[] {
  return clue.map((value) => value.toString());
}
