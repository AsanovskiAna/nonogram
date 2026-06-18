import { auth, clerkClient } from "@clerk/nextjs/server";
import {
  ArrowLeft,
  CircleUserRound,
  Crown,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { getLeaderboardEntries, type LeaderboardEntry } from "@/lib/nonogarm/leaderboard.ts";
import { formatTime } from "../nonogarm/components/shared";

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function PlayerAvatar({ entry }: { entry: LeaderboardEntry }) {
  return (
    <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden border-4 border-black bg-white">
      {entry.imageUrl ? (
        <div
          aria-hidden="true"
          className="size-full bg-cover bg-center"
          style={{ backgroundImage: `url(${entry.imageUrl})` }}
        />
      ) : (
        <span className="font-mono text-sm font-black">{getInitials(entry.playerName)}</span>
      )}
    </div>
  );
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  return (
    <li className="grid min-w-0 gap-3 border-4 border-black bg-white p-3 font-mono font-black uppercase shadow-[6px_6px_0_#000] sm:grid-cols-[4rem_minmax(0,1fr)_auto] sm:items-center">
      <div className="flex items-center gap-3 sm:block">
        <div className="flex size-12 items-center justify-center border-4 border-black bg-[#39d4ee] text-2xl">
          {entry.rank === 1 ? (
            <Crown className="size-7 fill-black stroke-black" aria-label="Rank 1" />
          ) : (
            entry.rank
          )}
        </div>
        <span className="sm:sr-only">Rank {entry.rank}</span>
      </div>

      <div className="flex min-w-0 items-center gap-3">
        <PlayerAvatar entry={entry} />
        <div className="min-w-0">
          <p className="truncate text-2xl leading-none">{entry.playerName}</p>
          <p className="mt-2 truncate text-sm text-black/65">
            Best actor: {entry.bestActor}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center sm:min-w-80">
        <div className="border-4 border-black bg-[#caff24] p-2">
          <p className="text-xs">Score</p>
          <p className="mt-1 text-xl leading-none">{entry.bestScore}</p>
        </div>
        <div className="border-4 border-black bg-[#ffd60a] p-2">
          <p className="text-xs">Time</p>
          <p className="mt-1 text-xl leading-none">{formatTime(entry.bestSeconds)}</p>
        </div>
        <div className="border-4 border-black bg-[#ff8a00] p-2">
          <p className="text-xs">Wins</p>
          <p className="mt-1 text-xl leading-none">{entry.wins}</p>
        </div>
      </div>
    </li>
  );
}

function EmptyLeaderboard() {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center gap-4 border-4 border-black bg-[#caff24] p-6 text-center font-mono font-black uppercase shadow-[8px_8px_0_#000]">
      <CircleUserRound className="size-14 stroke-[3]" aria-hidden="true" />
      <p className="text-2xl">No scores yet</p>
    </div>
  );
}

export default async function LeaderboardPage() {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  const client = await clerkClient();
  const users = await client.users.getUserList({ limit: 100, orderBy: "-updated_at" });
  const entries = getLeaderboardEntries(users.data, 50);

  return (
    <main className="min-h-screen bg-[#fff7e8] p-3 text-black sm:p-5 xl:p-7">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-5">
        <header className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="border-4 border-black bg-[#ff3f9a] px-5 py-4 shadow-[8px_8px_0_#000]">
            <div className="flex min-w-0 items-center gap-4">
              <Trophy className="size-12 shrink-0 fill-black stroke-black" aria-hidden="true" />
              <h1 className="min-w-0 truncate font-mono text-5xl font-black uppercase leading-none tracking-normal sm:text-7xl">
                Leaderboard
              </h1>
            </div>
          </div>
          <Link
            className="inline-flex min-h-16 items-center justify-center gap-3 border-4 border-black bg-[#ffd60a] px-5 py-3 font-mono font-black uppercase shadow-[8px_8px_0_#000] transition-transform hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none"
            href="/"
          >
            <ArrowLeft className="size-7 stroke-[3]" aria-hidden="true" />
            Game
          </Link>
        </header>

        {entries.length > 0 ? (
          <ol className="flex flex-col gap-4">
            {entries.map((entry) => (
              <LeaderboardRow entry={entry} key={entry.userId} />
            ))}
          </ol>
        ) : (
          <EmptyLeaderboard />
        )}
      </div>
    </main>
  );
}
