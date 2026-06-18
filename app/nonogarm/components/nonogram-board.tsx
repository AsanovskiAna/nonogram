import { Fragment } from "react";
import { Sparkles } from "lucide-react";
import {
  getBoardGridTemplate,
  getBoardPanelStyle,
  getBoardPuzzleMaxWidth,
  getColumnClueLines,
} from "@/lib/nonogarm/layout.ts";
import { getClues } from "@/lib/nonogarm/puzzle.ts";
import type {
  ActorPatch,
  BoardMarks,
  CellMark,
} from "@/lib/nonogarm/types.ts";
import { panelClass } from "./shared";

type PlayMode = Exclude<CellMark, "empty">;

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
      <section
        className={`${panelClass} mx-auto flex w-full items-center justify-center p-6 text-center`}
        style={getBoardPanelStyle(5)}
      >
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
    <section
      className={`${panelClass} mx-auto flex w-full flex-col p-3 sm:p-4`}
      style={getBoardPanelStyle(size)}
    >
      <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-3 font-mono font-black uppercase">
        <h2 className="text-xl">Patch {activePatch.row + 1}-{activePatch.col + 1}</h2>
        <span className="border-4 border-black bg-[#ffd60a] px-3 py-1">{size} x {size}</span>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <div
          className="grid w-full overflow-hidden border-4 border-black bg-black"
          style={{
            gridTemplateColumns: getBoardGridTemplate(size),
            maxWidth: getBoardPuzzleMaxWidth(size),
          }}
        >
          <div className="border-b-4 border-r-4 border-black bg-[#fff7e8]" />
          {columnClues.map((clue, index) => (
            <div
              className="flex min-h-16 items-end justify-center border-b-4 border-r-4 border-black bg-[#fff7e8] p-1 font-mono text-base font-black last:border-r-0"
              data-column-clue={index}
              key={`col-${index}`}
            >
              <span className="flex flex-col items-center leading-tight">
                {getColumnClueLines(clue).map((line, lineIndex) => (
                  <span key={`${index}-${lineIndex}`}>{line}</span>
                ))}
              </span>
            </div>
          ))}
          {Array.from({ length: size }, (_, rowIndex) => (
            <Fragment key={`row-${rowIndex}`}>
              <div
                className="flex min-h-11 items-center justify-end whitespace-nowrap border-b-4 border-r-4 border-black bg-[#fff7e8] px-2 font-mono text-base font-black"
                data-row-clue={rowIndex}
              >
                {rowClues[rowIndex].join(" ")}
              </div>
              {Array.from({ length: size }, (_, colIndex) => {
                const mark = marks[rowIndex]?.[colIndex] ?? "empty";
                return (
                  <button
                    aria-label={`Row ${rowIndex + 1}, column ${colIndex + 1}, ${mark}. ${mode} mode.`}
                    className={`aspect-square min-h-11 border-b-4 border-r-4 border-black font-mono text-2xl font-black transition-colors ${
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
      </div>
    </section>
  );
}
