import {
  Puzzle,
  Settings,
  Star,
  Trophy,
} from "lucide-react";
import { getLevelProgress } from "@/lib/nonogarm/scoring.ts";
import type { RoundStatus } from "@/lib/nonogarm/round.ts";
import type { Difficulty } from "@/lib/nonogarm/types.ts";
import { difficultyColor, panelClass } from "./shared";

type StatusRailProps = {
  difficulty: Difficulty;
  multiplier: number;
  score: number;
  status: RoundStatus;
  streak: number;
};

export function StatusRail({ difficulty, multiplier, score, status, streak }: StatusRailProps) {
  const levelProgress = getLevelProgress(score);
  const levelLabel = levelProgress.level.toString().padStart(2, "0");
  const items = [
    { icon: Puzzle, label: "Puzzle", color: "bg-[#39d4ee]" },
    { icon: Trophy, label: "Scores", color: "bg-white" },
    { icon: Star, label: "Stats", color: "bg-[#caff24]" },
    { icon: Settings, label: "Settings", color: "bg-white" },
  ];

  return (
    <aside className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
      <div className={`${panelClass} overflow-hidden sm:col-span-2 lg:col-span-1`}>
        {items.map(({ icon: Icon, label, color }) => (
          <div
            className={`flex items-center justify-between border-b-4 border-black px-4 py-3 font-mono font-black uppercase last:border-b-0 ${color}`}
            key={label}
          >
            <span className="flex items-center gap-3">
              <Icon className="size-8 stroke-[3]" aria-hidden="true" />
              {label}
            </span>
            <span aria-hidden="true">&gt;</span>
          </div>
        ))}
      </div>
      <div className={`${panelClass} flex flex-col items-center justify-center gap-2 p-4 text-center`}>
        <span className="font-mono text-2xl font-black uppercase">Streak</span>
        <span className="font-mono text-6xl font-black text-[#ff3f9a] [-webkit-text-stroke:2px_#000]">
          x{streak}
        </span>
      </div>
      <div className="border-4 border-black bg-[#ff8a00] p-4 font-mono font-black uppercase shadow-[8px_8px_0_#000]">
        <div className="flex items-center justify-between gap-3">
          <span>Level {levelLabel}</span>
          <span>{status === "won" ? "Solved" : "Live"}</span>
        </div>
        <div className="mt-4 h-7 border-4 border-black bg-white">
          <div
            className="h-full bg-black"
            style={{ width: `${levelProgress.progressPercent}%` }}
          />
        </div>
        <p className="mt-3 text-sm">
          {levelProgress.currentXp} / {levelProgress.nextLevelXp} XP
        </p>
        <p className={`mt-3 border-4 border-black px-3 py-2 ${difficultyColor(difficulty)}`}>
          {difficulty} x{multiplier.toFixed(1)}
        </p>
      </div>
    </aside>
  );
}
