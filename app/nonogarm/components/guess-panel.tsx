import { RotateCcw } from "lucide-react";
import type { RoundStatus } from "@/lib/nonogarm/round.ts";
import { buttonClass } from "./shared";

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
