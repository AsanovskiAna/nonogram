"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Trophy } from "lucide-react";
import Link from "next/link";
import { ACTORS } from "@/lib/nonogarm/actors.ts";
import {
  getNextPlayableActor,
  getPlayableActors,
  type GameProgressSnapshot,
} from "@/lib/nonogarm/progress.ts";
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
import { bankRoundScore } from "@/lib/nonogarm/scoring.ts";
import type { CellMark, SolutionGrid } from "@/lib/nonogarm/types.ts";
import {
  GuessPanel,
  HeaderBanner,
  NonogramBoard,
  PortraitReveal,
  PuzzleControls,
  ScoreHud,
  StatusRail,
} from "./components";
import { saveRoundResult } from "./leaderboard-actions";

type PlayMode = Exclude<CellMark, "empty">;

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function createInitialRound(
  completedActorIds: string[],
  streak: number,
): RoundState | null {
  const firstPlayableActor = getPlayableActors(ACTORS, completedActorIds)[0];

  return firstPlayableActor
    ? createRound(firstPlayableActor, nowSeconds(), undefined, streak)
    : null;
}

function formatSolutionForConsole(solution: SolutionGrid): string {
  return solution
    .map((row) => row.map((filled) => (filled ? "#" : ".")).join(" "))
    .join("\n");
}

type GameShellProps = {
  initialProgress: GameProgressSnapshot;
  isSignedIn: boolean;
};

export function GameShell({ initialProgress, isSignedIn }: GameShellProps) {
  const [, startSavingScore] = useTransition();
  const [careerScore, setCareerScore] = useState(initialProgress.careerScore);
  const [completedActorIds, setCompletedActorIds] = useState(() => [
    ...initialProgress.completedActorIds,
  ]);
  const [streak, setStreak] = useState(initialProgress.streak);
  const [round, setRound] = useState<RoundState | null>(() =>
    createInitialRound(initialProgress.completedActorIds, initialProgress.streak),
  );
  const [mode, setMode] = useState<PlayMode>("filled");
  const [guess, setGuess] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const roundStartedAt = round?.startedAt;
  const roundStatus = round?.status;

  useEffect(() => {
    if (roundStartedAt === undefined || roundStatus === "won") {
      return;
    }

    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.max(0, nowSeconds() - roundStartedAt));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [roundStartedAt, roundStatus]);

  const activePatch = useMemo(() => (round ? getSelectedPatch(round) : null), [round]);
  const levelScore = careerScore + (round?.score ?? 0);

  function handleSelectPatch(patchId: string) {
    setRound((current) => {
      if (!current) {
        return current;
      }

      const patch = current.actor.patches.find((candidate) => candidate.id === patchId);

      if (patch && !current.revealedPatchIds.includes(patch.id) && current.status !== "won") {
        console.log(
          `[Nonogarm] Solution ${patch.row + 1}-${patch.col + 1} (${patch.size}x${patch.size})\n${formatSolutionForConsole(patch.solution)}`,
        );
      }

      return selectPatch(current, patchId, nowSeconds());
    });
  }

  function handleToggleCell(row: number, col: number) {
    setRound((current) => (current ? toggleCell(current, row, col, mode) : current));
  }

  function handleSubmitPatch() {
    setRound((current) => (current ? submitActivePatch(current, nowSeconds()).round : current));
  }

  function handleGuess() {
    if (!round) {
      return;
    }

    const guessedAt = nowSeconds();
    const result = submitActorGuess(round, guess, guessedAt);

    if (result.correct) {
      const finalElapsedSeconds = Math.max(0, guessedAt - round.startedAt);
      const nextCareerScore = bankRoundScore(careerScore, result.round.score);
      const nextCompletedActorIds = Array.from(
        new Set([...completedActorIds, result.round.actor.id]),
      );

      setElapsedSeconds(finalElapsedSeconds);
      setCompletedActorIds(nextCompletedActorIds);
      setStreak(result.round.streak);

      startSavingScore(async () => {
        try {
          await saveRoundResult({
            actorId: result.round.actor.id,
            actorName: result.round.actor.displayName,
            careerScore: nextCareerScore,
            elapsedSeconds: finalElapsedSeconds,
            score: result.round.score,
            streak: result.round.streak,
          });
        } catch {
          // Progress saves are best-effort; the round should still finish cleanly.
        }
      });
    }

    setRound(result.round);
  }

  function handleNewRound() {
    if (!round) {
      return;
    }

    const nextCareerScore = bankRoundScore(careerScore, round.score);
    const nextCompletedActorIds =
      round.status === "won"
        ? Array.from(new Set([...completedActorIds, round.actor.id]))
        : completedActorIds;
    const nextActor = getNextPlayableActor(ACTORS, round.actor.id, nextCompletedActorIds);

    setCareerScore(nextCareerScore);
    setCompletedActorIds(nextCompletedActorIds);
    setStreak(round.streak);
    setRound(nextActor ? createRound(nextActor, nowSeconds(), undefined, round.streak) : null);
    setGuess("");
    setMode("filled");
    setElapsedSeconds(0);
  }

  if (!round) {
    return (
      <main className="min-h-screen bg-[#fff7e8] p-3 text-black sm:p-5 xl:p-7">
        <div className="mx-auto flex w-full max-w-[1720px] flex-col gap-5">
          <HeaderBanner />
          <section className="grid gap-4 lg:grid-cols-[minmax(190px,0.65fr)_minmax(0,2.9fr)] xl:gap-5 xl:grid-cols-[minmax(240px,0.82fr)_minmax(0,3.75fr)]">
            <div className="order-5 lg:order-none">
              <StatusRail
                difficulty="Easy"
                isSignedIn={isSignedIn}
                multiplier={1}
                score={careerScore}
                status="won"
                streak={streak}
              />
            </div>
            <section className="flex min-h-[560px] flex-col items-center justify-center border-4 border-black bg-white p-6 text-center font-mono font-black uppercase shadow-[8px_8px_0_#000]">
              <Trophy
                className="mb-5 size-20 fill-[#ffd60a] stroke-black stroke-[3]"
                aria-hidden="true"
              />
              <h2 className="text-4xl sm:text-6xl">All actors solved</h2>
              <p className="mt-4 max-w-2xl text-lg">
                {completedActorIds.length} / {ACTORS.length} actors finished. New actors can
                join the catalog next.
              </p>
              <Link
                className="mt-6 inline-flex min-h-14 items-center justify-center border-4 border-black bg-[#39d4ee] px-5 py-3 text-xl shadow-[6px_6px_0_#000] transition-transform hover:-translate-y-0.5"
                href="/leaderboard"
              >
                Leaderboard
              </Link>
            </section>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fff7e8] p-3 text-black sm:p-5 xl:p-7">
      <div className="mx-auto flex w-full max-w-[1720px] flex-col gap-5">
        <HeaderBanner />
        <section className="grid gap-4 lg:grid-cols-[minmax(190px,0.65fr)_minmax(430px,1.65fr)_minmax(340px,1.25fr)] xl:gap-5 xl:grid-cols-[minmax(240px,0.82fr)_minmax(520px,2.2fr)_minmax(420px,1.55fr)]">
          <div className="order-5 lg:order-none">
            <div className="flex flex-col gap-4">
              <StatusRail
                difficulty={round.actor.difficulty}
                isSignedIn={isSignedIn}
                multiplier={round.actor.difficultyMultiplier}
                score={levelScore}
                status={round.status}
                streak={round.streak}
              />
            </div>
          </div>
          <div className="order-3 flex min-w-0 flex-col gap-4 lg:order-none">
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
              onClear={() =>
                setRound((current) => (current ? clearActivePatch(current) : current))
              }
              onModeChange={setMode}
              onSubmit={handleSubmitPatch}
              onUndo={() => setRound((current) => (current ? undoLastMark(current) : current))}
            />
          </div>
          <div className="order-2 flex min-w-0 flex-col gap-4 lg:order-none">
            <div className="order-2 lg:order-1">
              <PortraitReveal
                actor={round.actor}
                revealedPatchIds={round.revealedPatchIds}
                selectedPatchId={round.selectedPatchId}
                status={round.status}
                onSelectPatch={handleSelectPatch}
              />
            </div>
            <div className="order-3 lg:order-2">
              <GuessPanel
                disabled={round.status === "won"}
                guess={guess}
                status={round.status}
                onGuessChange={setGuess}
                onNewRound={handleNewRound}
                onSubmit={handleGuess}
              />
            </div>
            <div className="order-1 lg:order-3">
              <ScoreHud
                elapsedSeconds={elapsedSeconds}
                feedback={round.guessFeedback}
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
