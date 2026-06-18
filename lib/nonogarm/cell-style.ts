import type { CellMark } from "./types.ts";

export function getCellMarkClasses(mark: CellMark): string {
  if (mark === "filled") {
    return "bg-black text-white shadow-[inset_-4px_-4px_0_#fff]";
  }

  return "bg-white text-black";
}
