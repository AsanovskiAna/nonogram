import { Fragment } from "react";
import {
  Check,
  PenLine,
  Puzzle,
  RotateCcw,
  Settings,
  Sparkles,
  Star,
  Timer,
  Trash2,
  Trophy,
  Undo2,
  X,
  Zap,
} from "lucide-react";
import { getClues } from "@/lib/nonogarm/puzzle.ts";
import { getLevelProgress } from "@/lib/nonogarm/scoring.ts";
import type { RoundStatus } from "@/lib/nonogarm/round.ts";
import type {
  ActorEntry,
  ActorPatch,
  BoardMarks,
  CellMark,
  Difficulty,
} from "@/lib/nonogarm/types.ts";

type PlayMode = Exclude<CellMark, "empty">;

const panelClass = "border-4 border-black bg-white shadow-[8px_8px_0_#000]";
const buttonClass =
  "inline-flex min-h-12 items-center justify-center gap-2 border-4 border-black px-4 py-2 font-mono text-sm font-black uppercase shadow-[5px_5px_0_#000] transition-transform hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-50";

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function difficultyColor(difficulty: Difficulty): string {
  if (difficulty === "Hard") return "bg-[#ff3f9a]";
  if (difficulty === "Medium") return "bg-[#ffd60a]";
  return "bg-[#caff24]";
}

export function HeaderBanner() {
  return (
    <header className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="border-4 border-black bg-[#ff3f9a] px-5 py-3 shadow-[8px_8px_0_#000] sm:px-7">
        <h1 className="font-mono text-5xl font-black leading-none tracking-normal sm:text-7xl lg:text-8xl">
          NONOGARM
        </h1>
      </div>
      <div className="flex items-center gap-4 border-4 border-black bg-[#ffd60a] px-5 py-3 font-mono font-black uppercase shadow-[8px_8px_0_#000]">
        <Star className="size-10 fill-black stroke-black" aria-hidden="true" />
        <p className="text-lg leading-tight">Solve puzzles. Reveal the star. Guess &amp; score!</p>
      </div>
    </header>
  );
}

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

type NonogramBoardProps = {
  activePatch: ActorPatch | null;
  disabled: boolean;
  marks: BoardMarks;
  mode: PlayMode;
  onCellClick: (row: number, col: number) => void;
};

export function NonogramBoard({
  activePatch,
  disabled,
  marks,
  mode,
  onCellClick,
}: NonogramBoardProps) {
  if (!activePatch) {
    return (
      <section className={`${panelClass} flex min-h-[430px] items-center justify-center p-6 text-center`}>
        <div className="max-w-md">
          <Sparkles className="mx-auto mb-4 size-16 stroke-[3]" aria-hidden="true" />
          <h2 className="font-mono text-3xl font-black uppercase">Choose a patch</h2>
          <p className="mt-3 font-mono text-lg font-bold">
            Outer clues are 5 x 5. Center clues are 8 x 8 and score bigger.
          </p>
        </div>
      </section>
    );
  }

  const rowClues = getClues(activePatch.solution, "row");
  const columnClues = getClues(activePatch.solution, "column");
  const size = activePatch.size;

  return (
    <section className={`${panelClass} p-3 sm:p-5`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 font-mono font-black uppercase">
        <h2 className="text-xl">Patch {activePatch.row + 1}-{activePatch.col + 1}</h2>
        <span className="border-4 border-black bg-[#ffd60a] px-3 py-1">{size} x {size}</span>
      </div>
      <div
        className="grid overflow-hidden border-4 border-black bg-black"
        style={{
          gridTemplateColumns: `minmax(4.5rem, 5.75rem) repeat(${size}, minmax(0, 1fr))`,
        }}
      >
        <div className="border-b-4 border-r-4 border-black bg-[#fff7e8]" />
        {columnClues.map((clue, index) => (
          <div
            className="flex min-h-20 items-end justify-center border-b-4 border-r-4 border-black bg-[#fff7e8] p-1 font-mono text-lg font-black last:border-r-0"
            key={`col-${index}`}
          >
            <span className="leading-tight">{clue.join(" ")}</span>
          </div>
        ))}
        {Array.from({ length: size }, (_, rowIndex) => (
          <Fragment key={`row-${rowIndex}`}>
            <div className="flex min-h-12 items-center justify-end border-b-4 border-r-4 border-black bg-[#fff7e8] px-2 font-mono text-lg font-black">
              {rowClues[rowIndex].join(" ")}
            </div>
            {Array.from({ length: size }, (_, colIndex) => {
              const mark = marks[rowIndex]?.[colIndex] ?? "empty";
              return (
                <button
                  aria-label={`Row ${rowIndex + 1}, column ${colIndex + 1}, ${mark}. ${mode} mode.`}
                  className={`aspect-square min-h-12 border-b-4 border-r-4 border-black font-mono text-3xl font-black transition-colors ${
                    mark === "filled" ? "bg-black text-white" : "bg-white text-black"
                  }`}
                  disabled={disabled}
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => onCellClick(rowIndex, colIndex)}
                  type="button"
                >
                  {mark === "crossed" ? "X" : ""}
                </button>
              );
            })}
          </Fragment>
        ))}
      </div>
    </section>
  );
}

type PuzzleControlsProps = {
  canClear: boolean;
  canUndo: boolean;
  disabled: boolean;
  mode: PlayMode;
  onClear: () => void;
  onModeChange: (mode: PlayMode) => void;
  onSubmit: () => void;
  onUndo: () => void;
};

export function PuzzleControls({
  canClear,
  canUndo,
  disabled,
  mode,
  onClear,
  onModeChange,
  onSubmit,
  onUndo,
}: PuzzleControlsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-5">
      <button
        className={`${buttonClass} ${mode === "filled" ? "bg-[#39d4ee]" : "bg-white"}`}
        disabled={disabled}
        onClick={() => onModeChange("filled")}
        type="button"
      >
        <PenLine className="size-6 stroke-[3]" aria-hidden="true" />
        Fill
      </button>
      <button
        className={`${buttonClass} ${mode === "crossed" ? "bg-[#ffd60a]" : "bg-white"}`}
        disabled={disabled}
        onClick={() => onModeChange("crossed")}
        type="button"
      >
        <X className="size-7 stroke-[4]" aria-hidden="true" />
        Cross
      </button>
      <button
        className={`${buttonClass} bg-[#ffd60a]`}
        disabled={disabled || !canUndo}
        onClick={onUndo}
        type="button"
      >
        <Undo2 className="size-6 stroke-[3]" aria-hidden="true" />
        Undo
      </button>
      <button
        className={`${buttonClass} bg-[#ff3f9a]`}
        disabled={disabled || !canClear}
        onClick={onClear}
        type="button"
      >
        <Trash2 className="size-6 stroke-[3]" aria-hidden="true" />
        Clear
      </button>
      <button
        className={`${buttonClass} bg-[#caff24]`}
        disabled={disabled || !canClear}
        onClick={onSubmit}
        type="button"
      >
        <Check className="size-6 stroke-[3]" aria-hidden="true" />
        Check
      </button>
    </div>
  );
}

type PortraitRevealProps = {
  actor: ActorEntry;
  revealedPatchIds: string[];
  selectedPatchId: string | null;
  status: RoundStatus;
  onSelectPatch: (patchId: string) => void;
};

export function PortraitReveal({
  actor,
  revealedPatchIds,
  selectedPatchId,
  status,
  onSelectPatch,
}: PortraitRevealProps) {
  return (
    <section className={`${panelClass} relative aspect-[4/3] overflow-hidden bg-[#111]`}>
      <div
        aria-hidden="true"
        className={`absolute inset-0 bg-cover bg-center transition-all duration-500 ${
          status === "won" ? "blur-0 opacity-100" : "scale-105 blur-md opacity-80"
        }`}
        style={{ backgroundImage: `url(${actor.portrait})` }}
      />
      <div className="absolute inset-0 grid grid-cols-4 grid-rows-4">
        {actor.patches.map((patch) => {
          const revealed = revealedPatchIds.includes(patch.id) || status === "won";
          const selected = selectedPatchId === patch.id;
          const cropPosition = `${(patch.col / 3) * 100}% ${(patch.row / 3) * 100}%`;

          if (revealed) {
            return (
              <div
                aria-hidden="true"
                className="border border-black bg-cover"
                key={patch.id}
                style={{
                  backgroundImage: `url(${actor.portrait})`,
                  backgroundPosition: cropPosition,
                  backgroundSize: "400% 400%",
                  gridColumn: patch.col + 1,
                  gridRow: patch.row + 1,
                }}
              />
            );
          }

          return (
            <button
              aria-label={`Select patch ${patch.row + 1}-${patch.col + 1}, ${patch.size} by ${patch.size}`}
              className={`group relative border-2 border-black bg-black/35 transition-colors hover:bg-[#ffd60a]/55 ${
                selected ? "bg-[#ffd60a]/75" : ""
              }`}
              key={patch.id}
              onClick={() => onSelectPatch(patch.id)}
              style={{ gridColumn: patch.col + 1, gridRow: patch.row + 1 }}
              type="button"
            >
              <span className="absolute left-1 top-1 border-2 border-black bg-[#ffd60a] px-1 font-mono text-[10px] font-black opacity-0 group-hover:opacity-100 sm:text-xs">
                {patch.size}x{patch.size}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

type GuessPanelProps = {
  disabled: boolean;
  guess: string;
  status: RoundStatus;
  onGuessChange: (value: string) => void;
  onNewRound: () => void;
  onSubmit: () => void;
};

export function GuessPanel({
  disabled,
  guess,
  status,
  onGuessChange,
  onNewRound,
  onSubmit,
}: GuessPanelProps) {
  return (
    <section className="flex flex-col gap-3">
      <form
        className="grid min-w-0 gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <input
          aria-label="Guess actor"
          className="min-h-16 min-w-0 border-4 border-black bg-white px-5 font-mono text-2xl font-black uppercase shadow-[6px_6px_0_#000] outline-none focus:bg-[#fff7e8]"
          disabled={disabled}
          onChange={(event) => onGuessChange(event.target.value)}
          placeholder="WHO IS IT?"
          value={guess}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            className={`${buttonClass} min-w-0 bg-[#ff3f9a] text-2xl`}
            disabled={disabled}
            type="submit"
          >
            Guess
          </button>
          <button className={`${buttonClass} bg-[#caff24]`} onClick={onNewRound} type="button">
            <RotateCcw className="size-6 stroke-[3]" aria-hidden="true" />
            {status === "won" ? "Next" : "Skip"}
          </button>
        </div>
      </form>
    </section>
  );
}

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
  const speedBonus = Math.max(0, 900 - elapsedSeconds * 8);
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
        <div className="flex items-center gap-3 bg-[#c05df2] px-4 py-3">
          <Timer className="size-6 stroke-[3]" aria-hidden="true" />
          Speed +{speedBonus}
          <span className="ml-auto text-sm">{hiddenCount} hidden</span>
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
