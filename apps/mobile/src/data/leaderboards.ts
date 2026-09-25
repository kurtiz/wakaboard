import { authClient } from "./wakatime-client";

export type LeaderboardScope = "country" | "global";

export type Leader = {
  id: string;
  rank: number;
  name: string;
  seconds: number;
  countryCode: string | null;
};

export type Leaderboard = {
  scope: LeaderboardScope;
  countryCode: string | null;
  rank: number | null;
  leaders: Leader[];
  range: string;
  updatedAt: string | null;
};

const apiUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");

export async function fetchLeaderboard(scope: LeaderboardScope): Promise<Leaderboard> {
  if (!apiUrl) throw new Error("Connect WakaTime to see the leaderboards.");
  const cookie = await authClient.getCookie();
  if (!cookie) throw new Error("Connect WakaTime to see the leaderboards.");
  const url = new URL("/api/leaderboards", apiUrl);
  url.searchParams.set("scope", scope);
  const response = await fetch(url, { headers: { Cookie: cookie }, credentials: "omit" });
  if (response.status === 401) throw new Error("Your WakaTime session expired. Sign in again.");
  if (!response.ok) throw new Error("The leaderboard could not be loaded. Try again later.");
  const board = await response.json() as Leaderboard;
  if (!Array.isArray(board.leaders) || board.scope !== scope) throw new Error("The leaderboard response was invalid.");
  return board;
}
