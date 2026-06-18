import {
  Check,
  PenLine,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import type { CellMark } from "@/lib/nonogarm/types.ts";
import { buttonClass } from "./shared";

type PlayMode = Exclude<CellMark, "empty">;

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
