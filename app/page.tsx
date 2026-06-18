import { auth, clerkClient } from "@clerk/nextjs/server";
import {
  EMPTY_GAME_PROGRESS,
  PROGRESS_METADATA_KEY,
  toGameProgressSnapshot,
} from "@/lib/nonogarm/progress.ts";
import { GameShell } from "./nonogarm/game-shell";

async function getInitialProgress(userId: string | null) {
  if (!userId) {
    return EMPTY_GAME_PROGRESS;
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  return toGameProgressSnapshot(user.publicMetadata[PROGRESS_METADATA_KEY]);
}

export default async function Home() {
  const { userId } = await auth();
  const initialProgress = await getInitialProgress(userId);

  return <GameShell initialProgress={initialProgress} isSignedIn={Boolean(userId)} />;
}
