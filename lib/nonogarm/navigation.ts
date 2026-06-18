export type PlayerRailAction =
  | {
      color: string;
      kind: "sign-in" | "sign-up";
      label: string;
    }
  | {
      color: string;
      href: string;
      kind: "link";
      label: string;
    }
  | {
      color: string;
      kind: "account";
      label: string;
    };

export function getPlayerRailActions(isSignedIn: boolean): PlayerRailAction[] {
  if (isSignedIn) {
    return [
      {
        color: "bg-[#39d4ee]",
        href: "/leaderboard",
        kind: "link",
        label: "Leaderboard",
      },
      { color: "bg-white", kind: "account", label: "Account" },
    ];
  }

  return [
    { color: "bg-[#caff24]", kind: "sign-in", label: "Sign in" },
    { color: "bg-[#ff3f9a]", kind: "sign-up", label: "Sign up" },
  ];
}
