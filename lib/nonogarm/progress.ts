import type { ActorProfile } from "./types.ts";

export const PROGRESS_METADATA_KEY = "nonogarmProgress";

export type GameProgressMetadata = {
  careerScore: number;
  completedActorIds: string[];
  streak: number;
  updatedAt: string;
};

export type GameProgressSnapshot = Pick<
  GameProgressMetadata,
  "careerScore" | "completedActorIds" | "streak"
>;

export type GameProgressSubmission = {
  actorId: string;
  careerScore: number;
  streak: number;
};

export const EMPTY_GAME_PROGRESS: GameProgressSnapshot = {
  careerScore: 0,
  completedActorIds: [],
  streak: 0,
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function uniqueStringIds(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return Array.from(
    new Set(
      values
        .filter(isNonEmptyString)
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

export function readGameProgressMetadata(value: unknown): GameProgressMetadata | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const metadata = value as Record<string, unknown>;
  if (
    !isFiniteNumber(metadata.careerScore) ||
    !isFiniteNumber(metadata.streak) ||
    !isNonEmptyString(metadata.updatedAt)
  ) {
    return null;
  }

  return {
    careerScore: Math.max(0, Math.round(metadata.careerScore)),
    completedActorIds: uniqueStringIds(metadata.completedActorIds),
    streak: Math.max(0, Math.round(metadata.streak)),
    updatedAt: metadata.updatedAt,
  };
}

export function toGameProgressSnapshot(value: unknown): GameProgressSnapshot {
  const progress = readGameProgressMetadata(value);

  if (!progress) {
    return EMPTY_GAME_PROGRESS;
  }

  return {
    careerScore: progress.careerScore,
    completedActorIds: progress.completedActorIds,
    streak: progress.streak,
  };
}

export function mergeGameProgressMetadata(
  previous: GameProgressMetadata | undefined,
  submission: GameProgressSubmission,
  updatedAt: string,
): GameProgressMetadata {
  const safePrevious = readGameProgressMetadata(previous);
  const actorId = submission.actorId.trim();
  const completedActorIds = actorId
    ? uniqueStringIds([...(safePrevious?.completedActorIds ?? []), actorId])
    : safePrevious?.completedActorIds ?? [];

  return {
    careerScore: Math.max(
      safePrevious?.careerScore ?? 0,
      Math.max(0, Math.round(submission.careerScore)),
    ),
    completedActorIds,
    streak: Math.max(0, Math.round(submission.streak)),
    updatedAt,
  };
}

export function getPlayableActors(
  actors: ActorProfile[],
  completedActorIds: string[],
): ActorProfile[] {
  const completed = new Set(completedActorIds);
  return actors.filter((actor) => !completed.has(actor.id));
}

export function getNextPlayableActor(
  actors: ActorProfile[],
  currentActorId: string,
  completedActorIds: string[],
): ActorProfile | null {
  const playableActors = getPlayableActors(actors, completedActorIds);

  if (playableActors.length === 0) {
    return null;
  }

  const currentIndex = actors.findIndex((actor) => actor.id === currentActorId);
  const startIndex = currentIndex >= 0 ? currentIndex + 1 : 0;

  for (let offset = 0; offset < actors.length; offset += 1) {
    const candidate = actors[(startIndex + offset) % actors.length];

    if (playableActors.some((actor) => actor.id === candidate.id)) {
      return candidate;
    }
  }

  return null;
}
