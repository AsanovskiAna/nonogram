"use client";

import {
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import {
  CircleUserRound,
  LogIn,
  Trophy,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { getPlayerRailActions, type PlayerRailAction } from "@/lib/nonogarm/navigation.ts";
import { getLevelProgress } from "@/lib/nonogarm/scoring.ts";
import type { RoundStatus } from "@/lib/nonogarm/round.ts";
import type { Difficulty } from "@/lib/nonogarm/types.ts";
import { difficultyColor, panelClass } from "./shared";

type StatusRailProps = {
  difficulty: Difficulty;
  isSignedIn: boolean;
  multiplier: number;
  score: number;
  status: RoundStatus;
  streak: number;
};

function actionClassName(color: string): string {
  return `flex w-full items-center justify-between border-b-4 border-black px-4 py-3 text-left font-mono font-black uppercase last:border-b-0 ${color}`;
}

function ActionIcon({ kind }: { kind: PlayerRailAction["kind"] }) {
  const iconClassName = "size-8 shrink-0 stroke-[3]";

  if (kind === "sign-in") {
    return <LogIn className={iconClassName} aria-hidden="true" />;
  }

  if (kind === "sign-up") {
    return <UserPlus className={iconClassName} aria-hidden="true" />;
  }

  if (kind === "account") {
    return <CircleUserRound className={iconClassName} aria-hidden="true" />;
  }

  return <Trophy className={iconClassName} aria-hidden="true" />;
}

function ActionLabel({ action }: { action: PlayerRailAction }) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <ActionIcon kind={action.kind} />
      <span className="truncate">{action.label}</span>
    </span>
  );
}

function RailAction({ action }: { action: PlayerRailAction }) {
  if (action.kind === "sign-in") {
    return (
      <SignInButton>
        <button className={actionClassName(action.color)} type="button">
          <ActionLabel action={action} />
          <span aria-hidden="true">&gt;</span>
        </button>
      </SignInButton>
    );
  }

  if (action.kind === "sign-up") {
    return (
      <SignUpButton>
        <button className={actionClassName(action.color)} type="button">
          <ActionLabel action={action} />
          <span aria-hidden="true">&gt;</span>
        </button>
      </SignUpButton>
    );
  }

  if (action.kind === "account") {
    return (
      <div className={actionClassName(action.color)}>
        <ActionLabel action={action} />
        <UserButton />
      </div>
    );
  }

  if (action.kind === "link") {
    return (
      <Link className={actionClassName(action.color)} href={action.href}>
        <ActionLabel action={action} />
        <span aria-hidden="true">&gt;</span>
      </Link>
    );
  }

  return null;
}

export function StatusRail({
  difficulty,
  isSignedIn,
  multiplier,
  score,
  status,
  streak,
}: StatusRailProps) {
  const levelProgress = getLevelProgress(score);
  const levelLabel = levelProgress.level.toString().padStart(2, "0");
  const actions = getPlayerRailActions(isSignedIn);

  return (
    <aside className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
      <div className={`${panelClass} overflow-hidden sm:col-span-2 lg:col-span-1`}>
        {actions.map((action) => (
          <RailAction action={action} key={action.kind} />
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
