export type LeaderboardSubmission = {
  actorName: string;
  elapsedSeconds: number;
  score: number;
  streak: number;
};

export type LeaderboardMetadata = {
  bestActor: string;
  bestScore: number;
  bestSeconds: number;
  bestStreak: number;
  updatedAt: string;
  wins: number;
};

export type LeaderboardUser = {
  firstName: string | null;
  id: string;
  imageUrl: string;
  lastName: string | null;
  publicMetadata: Record<string, unknown>;
  username: string | null;
};

export type LeaderboardEntry = LeaderboardMetadata & {
  imageUrl: string;
  playerName: string;
  rank: number;
  userId: string;
};

export const LEADERBOARD_METADATA_KEY = "nonogarmLeaderboard";

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function readLeaderboardMetadata(value: unknown): LeaderboardMetadata | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const metadata = value as Record<string, unknown>;
  if (
    !isNonEmptyString(metadata.bestActor) ||
    !isFiniteNumber(metadata.bestScore) ||
    !isFiniteNumber(metadata.bestSeconds) ||
    !isFiniteNumber(metadata.bestStreak) ||
    !isNonEmptyString(metadata.updatedAt) ||
    !isFiniteNumber(metadata.wins)
  ) {
    return null;
  }

  return {
    bestActor: metadata.bestActor,
    bestScore: Math.max(0, Math.round(metadata.bestScore)),
    bestSeconds: Math.max(0, Math.round(metadata.bestSeconds)),
    bestStreak: Math.max(0, Math.round(metadata.bestStreak)),
    updatedAt: metadata.updatedAt,
    wins: Math.max(0, Math.round(metadata.wins)),
  };
}

function normalizeSubmission(submission: LeaderboardSubmission): LeaderboardSubmission {
  return {
    actorName: submission.actorName.trim() || "Unknown actor",
    elapsedSeconds: Math.max(0, Math.round(submission.elapsedSeconds)),
    score: Math.max(0, Math.round(submission.score)),
    streak: Math.max(0, Math.round(submission.streak)),
  };
}

function isBetterRun(current: LeaderboardMetadata | null, next: LeaderboardSubmission): boolean {
  if (!current) {
    return true;
  }

  if (next.score !== current.bestScore) {
    return next.score > current.bestScore;
  }

  return next.elapsedSeconds < current.bestSeconds;
}

export function mergeLeaderboardMetadata(
  previous: LeaderboardMetadata | undefined,
  submission: LeaderboardSubmission,
  updatedAt: string,
): LeaderboardMetadata {
  const safePrevious = readLeaderboardMetadata(previous);
  const safeSubmission = normalizeSubmission(submission);
  const wins = (safePrevious?.wins ?? 0) + 1;

  if (safePrevious && !isBetterRun(safePrevious, safeSubmission)) {
    return {
      ...safePrevious,
      updatedAt,
      wins,
    };
  }

  return {
    bestActor: safeSubmission.actorName,
    bestScore: safeSubmission.score,
    bestSeconds: safeSubmission.elapsedSeconds,
    bestStreak: safeSubmission.streak,
    updatedAt,
    wins,
  };
}

function getPlayerName(user: LeaderboardUser): string {
  if (isNonEmptyString(user.username)) {
    return user.username;
  }

  const fullName = [user.firstName, user.lastName].filter(isNonEmptyString).join(" ");
  return fullName || "Mystery Player";
}

export function getLeaderboardEntries(
  users: LeaderboardUser[],
  limit: number,
): LeaderboardEntry[] {
  return users
    .flatMap((user) => {
      const metadata = readLeaderboardMetadata(user.publicMetadata[LEADERBOARD_METADATA_KEY]);

      if (!metadata) {
        return [];
      }

      return [
        {
          ...metadata,
          imageUrl: user.imageUrl,
          playerName: getPlayerName(user),
          rank: 0,
          userId: user.id,
        },
      ];
    })
    .toSorted((left, right) => {
      if (left.bestScore !== right.bestScore) {
        return right.bestScore - left.bestScore;
      }

      if (left.bestSeconds !== right.bestSeconds) {
        return left.bestSeconds - right.bestSeconds;
      }

      return right.updatedAt.localeCompare(left.updatedAt);
    })
    .slice(0, Math.max(0, limit))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}
