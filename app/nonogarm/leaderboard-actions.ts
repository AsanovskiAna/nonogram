"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { ACTORS } from "@/lib/nonogarm/actors.ts";
import {
  LEADERBOARD_METADATA_KEY,
  mergeLeaderboardMetadata,
  readLeaderboardMetadata,
  type LeaderboardSubmission,
} from "@/lib/nonogarm/leaderboard.ts";
import {
  PROGRESS_METADATA_KEY,
  mergeGameProgressMetadata,
  readGameProgressMetadata,
  type GameProgressSubmission,
} from "@/lib/nonogarm/progress.ts";

export type SaveLeaderboardScoreResult = {
  status: "invalid" | "saved" | "signed-out";
};

export type SaveRoundResultSubmission = LeaderboardSubmission & GameProgressSubmission;

function isValidSubmission(submission: LeaderboardSubmission): boolean {
  return (
    typeof submission.actorName === "string" &&
    submission.actorName.trim().length > 0 &&
    Number.isFinite(submission.elapsedSeconds) &&
    submission.elapsedSeconds >= 0 &&
    submission.elapsedSeconds <= 60 * 60 &&
    Number.isFinite(submission.score) &&
    submission.score > 0 &&
    submission.score <= 15000 &&
    Number.isFinite(submission.streak) &&
    submission.streak >= 0 &&
    submission.streak <= 1000
  );
}

function isValidProgressSubmission(submission: GameProgressSubmission): boolean {
  return (
    ACTORS.some((actor) => actor.id === submission.actorId) &&
    Number.isFinite(submission.careerScore) &&
    submission.careerScore >= 0 &&
    submission.careerScore <= 5_000_000 &&
    Number.isFinite(submission.streak) &&
    submission.streak >= 0 &&
    submission.streak <= 1000
  );
}

export async function saveRoundResult(
  submission: SaveRoundResultSubmission,
): Promise<SaveLeaderboardScoreResult> {
  const { userId } = await auth();

  if (!userId) {
    return { status: "signed-out" };
  }

  if (!isValidSubmission(submission) || !isValidProgressSubmission(submission)) {
    return { status: "invalid" };
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const updatedAt = new Date().toISOString();
  const previousLeaderboard = readLeaderboardMetadata(
    user.publicMetadata[LEADERBOARD_METADATA_KEY],
  );
  const previousProgress = readGameProgressMetadata(user.publicMetadata[PROGRESS_METADATA_KEY]);

  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      [LEADERBOARD_METADATA_KEY]: mergeLeaderboardMetadata(
        previousLeaderboard ?? undefined,
        submission,
        updatedAt,
      ),
      [PROGRESS_METADATA_KEY]: mergeGameProgressMetadata(
        previousProgress ?? undefined,
        submission,
        updatedAt,
      ),
    },
  });

  revalidatePath("/");
  revalidatePath("/leaderboard");

  return { status: "saved" };
}

export async function saveLeaderboardScore(
  submission: LeaderboardSubmission,
): Promise<SaveLeaderboardScoreResult> {
  const { userId } = await auth();

  if (!userId) {
    return { status: "signed-out" };
  }

  if (!isValidSubmission(submission)) {
    return { status: "invalid" };
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const previous = readLeaderboardMetadata(user.publicMetadata[LEADERBOARD_METADATA_KEY]);
  const next = mergeLeaderboardMetadata(
    previous ?? undefined,
    submission,
    new Date().toISOString(),
  );

  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      [LEADERBOARD_METADATA_KEY]: next,
    },
  });

  revalidatePath("/leaderboard");

  return { status: "saved" };
}
