import {
  Timer,
  Zap,
} from "lucide-react";
import {
  getSpeedBonus,
  getSpeedFillPercent,
} from "@/lib/nonogarm/scoring.ts";
import { formatTime } from "./shared";

type ScoreHudProps = {
  elapsedSeconds: number;
  feedback: string;
  revealedCount: number;
  score: number;
  totalPatches: number;
};

export function ScoreHud({
  elapsedSeconds,
  feedback,
  revealedCount,
  score,
  totalPatches,
}: ScoreHudProps) {
  const hiddenCount = totalPatches - revealedCount;
  const speedBonus = getSpeedBonus(elapsedSeconds);
  const speedFillPercent = getSpeedFillPercent(elapsedSeconds);
  const speedFillLabel = Math.round(speedFillPercent);
  const speedFillScale = speedFillPercent / 100;
  const tiles = [
    { label: "Score", value: score.toString(), color: "bg-[#39d4ee]" },
    { label: "Time", value: formatTime(elapsedSeconds), color: "bg-[#caff24]" },
    { label: "Revealed", value: `${revealedCount}/${totalPatches}`, color: "bg-[#ff8a00]" },
  ];

  return (
    <section className="grid gap-3">
      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-3">
        {tiles.map((tile) => (
          <div
            className={`border-4 border-black p-3 text-center font-mono font-black uppercase shadow-[6px_6px_0_#000] ${tile.color}`}
            key={tile.label}
          >
            <p className="text-sm">{tile.label}</p>
            <p className="mt-1 text-3xl">{tile.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[1fr_130px] overflow-hidden border-4 border-black font-mono font-black uppercase shadow-[6px_6px_0_#000]">
        <div
          aria-label={`Speed bonus ${speedBonus}, ${speedFillLabel}% remaining`}
          className="relative isolate overflow-hidden bg-white px-4 py-3"
          data-speed-fill-percent={speedFillPercent}
        >
          <div
            aria-hidden="true"
            className="absolute inset-y-0 left-0 z-0 w-full origin-left bg-[#c05df2] transition-transform duration-1000 ease-linear will-change-transform"
            data-speed-fill
            style={{ transform: `scaleX(${speedFillScale})` }}
          />
          <div className="relative z-10 flex items-center gap-3">
            <Timer className="size-6 stroke-[3]" aria-hidden="true" />
            Speed +{speedBonus}
            <span className="ml-auto text-sm">{hiddenCount} hidden</span>
          </div>
        </div>
        <div className="flex items-center justify-center border-l-4 border-black bg-[#ffd60a]">
          <Zap className="size-8 fill-black stroke-black" aria-hidden="true" />
        </div>
      </div>
      <p className="min-h-14 border-4 border-black bg-white px-4 py-3 font-mono font-black shadow-[5px_5px_0_#000]">
        {feedback || "Solve a patch or take a shot."}
      </p>
    </section>
  );
}
