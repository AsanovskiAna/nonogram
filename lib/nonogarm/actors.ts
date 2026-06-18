import type { ActorProfile } from "./types.ts";

export const ACTORS: ActorProfile[] = [
  {
    id: "ava-sterling",
    displayName: "Ava Sterling",
    aliases: ["Ava", "Sterling", "A Sterling"],
    difficulty: "Easy",
    difficultyMultiplier: 1,
    portrait: "/actors/ava-sterling.svg",
  },
  {
    id: "milo-voss",
    displayName: "Milo Voss",
    aliases: ["Milo", "Voss", "M Voss"],
    difficulty: "Medium",
    difficultyMultiplier: 1.4,
    portrait: "/actors/milo-voss.svg",
  },
  {
    id: "noor-valen",
    displayName: "Noor Valen",
    aliases: ["Noor", "Valen", "N Valen"],
    difficulty: "Hard",
    difficultyMultiplier: 1.8,
    portrait: "/actors/noor-valen.svg",
  },
];
