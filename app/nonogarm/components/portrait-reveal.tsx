import type { RoundStatus } from "@/lib/nonogarm/round.ts";
import type { ActorEntry } from "@/lib/nonogarm/types.ts";
import { panelClass } from "./shared";

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
