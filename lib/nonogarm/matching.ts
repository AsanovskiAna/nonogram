import type { ActorEntry } from "./types.ts";

export function normalizeGuess(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function isActorMatch(
  actor: Pick<ActorEntry, "displayName" | "aliases">,
  guess: string,
): boolean {
  const normalizedGuess = normalizeGuess(guess);
  if (!normalizedGuess) {
    return false;
  }

  return [actor.displayName, ...actor.aliases].some(
    (name) => normalizeGuess(name) === normalizedGuess,
  );
}
