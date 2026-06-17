"use client";

import { useEffect, useMemo, useState } from "react";
import { ACTORS } from "@/lib/nonogarm/actors.ts";
import {
  clearActivePatch,
  createRound,
  getSelectedPatch,
  selectPatch,
  submitActorGuess,
  submitActivePatch,
  toggleCell,
  undoLastMark,
  type RoundState,
} from "@/lib/nonogarm/round.ts";
import type { CellMark } from "@/lib/nonogarm/types.ts";
import {
  GuessPanel,
  HeaderBanner,
  NonogramBoard,
  PortraitReveal,
  PuzzleControls,
  ScoreHud,
  StatusRail,
} from "./ui";

type PlayMode = Exclude<CellMark, "empty">;

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function createInitialRound(): RoundState {
  return createRound(ACTORS[0], nowSeconds());
}

export function GameShell() {
  const [actorIndex, setActorIndex] = useState(0);
  const [round, setRound] = useState<RoundState>(createInitialRound);
  const [mode, setMode] = useState<PlayMode>("filled");
  const [guess, setGuess] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (round.status === "won") {
      return;
    }

    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.max(0, nowSeconds() - round.startedAt));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [round.startedAt, round.status]);

  const activePatch = useMemo(() => getSelectedPatch(round), [round]);

  function handleSelectPatch(patchId: string) {
    setRound((current) => selectPatch(current, patchId, nowSeconds()));
  }

  function handleToggleCell(row: number, col: number) {
    setRound((current) => toggleCell(current, row, col, mode));
  }

  function handleSubmitPatch() {
    setRound((current) => submitActivePatch(current, nowSeconds()).round);
  }

  function handleGuess() {
    setRound((current) => {
      const result = submitActorGuess(current, guess, nowSeconds());
      if (result.correct) {
        setElapsedSeconds(Math.max(0, nowSeconds() - current.startedAt));
      }
      return result.round;
    });
  }

  function handleNewRound() {
    const nextIndex = (actorIndex + 1) % ACTORS.length;
    setActorIndex(nextIndex);
    setRound(createRound(ACTORS[nextIndex], nowSeconds()));
    setGuess("");
    setMode("filled");
    setElapsedSeconds(0);
  }

  return (
    <main className="min-h-screen bg-[#fff7e8] p-3 text-black sm:p-5 xl:p-7">
      <div className="mx-auto flex w-full max-w-[1720px] flex-col gap-5">
        <HeaderBanner />
        <section className="grid gap-5 xl:grid-cols-[minmax(240px,0.82fr)_minmax(520px,2.2fr)_minmax(420px,1.55fr)]">
          <div className="order-5 xl:order-none">
            <StatusRail
              difficulty={round.actor.difficulty}
              multiplier={round.actor.difficultyMultiplier}
              score={round.score}
              status={round.status}
            />
          </div>
          <div className="order-3 flex min-w-0 flex-col gap-4 xl:order-none">
            <NonogramBoard
              activePatch={activePatch}
              disabled={round.status === "won"}
              marks={round.currentMarks}
              mode={mode}
              onCellClick={handleToggleCell}
            />
            <PuzzleControls
              canClear={Boolean(activePatch)}
              canUndo={round.undoStack.length > 0}
              disabled={round.status === "won"}
              mode={mode}
              onClear={() => setRound(clearActivePatch)}
              onModeChange={setMode}
              onSubmit={handleSubmitPatch}
              onUndo={() => setRound(undoLastMark)}
            />
          </div>
          <div className="order-2 flex min-w-0 flex-col gap-4 xl:order-none">
            <div className="order-2 xl:order-1">
              <PortraitReveal
                actor={round.actor}
                revealedPatchIds={round.revealedPatchIds}
                selectedPatchId={round.selectedPatchId}
                status={round.status}
                onSelectPatch={handleSelectPatch}
              />
            </div>
            <div className="order-3 xl:order-2">
              <GuessPanel
                disabled={round.status === "won"}
                feedback={round.guessFeedback}
                guess={guess}
                status={round.status}
                onGuessChange={setGuess}
                onNewRound={handleNewRound}
                onSubmit={handleGuess}
              />
            </div>
            <div className="order-1 xl:order-3">
              <ScoreHud
                activePatch={activePatch}
                elapsedSeconds={elapsedSeconds}
                revealedCount={round.revealedPatchIds.length}
                score={round.score}
                totalPatches={round.actor.patches.length}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
