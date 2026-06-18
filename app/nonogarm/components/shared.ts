import type { Difficulty } from "@/lib/nonogarm/types.ts";

export const panelClass = "border-4 border-black bg-white shadow-[8px_8px_0_#000]";

export const buttonClass =
  "inline-flex min-h-12 items-center justify-center gap-2 border-4 border-black px-4 py-2 font-mono text-sm font-black uppercase shadow-[5px_5px_0_#000] transition-transform hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-50";

export function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function difficultyColor(difficulty: Difficulty): string {
  if (difficulty === "Hard") return "bg-[#ff3f9a]";
  if (difficulty === "Medium") return "bg-[#ffd60a]";
  return "bg-[#caff24]";
}
