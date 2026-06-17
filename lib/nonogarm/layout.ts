export type BoardFrame = {
  maxWidth: number;
  minHeight: number;
};

const BOARD_FRAMES: Record<5 | 8, BoardFrame> = {
  5: { maxWidth: 500, minHeight: 540 },
  8: { maxWidth: 650, minHeight: 680 },
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
