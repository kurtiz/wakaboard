import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import { authClient, wakatimeConnectionAvailable } from "./wakatime-client";
import { fetchLeaderboard, type Leaderboard, type LeaderboardScope } from "./leaderboards";
import { loadCachedLeaderboards, saveCachedLeaderboard } from "./dashboard-store";

type Boards = Record<LeaderboardScope, Leaderboard | null>;
type LeaderboardContextValue = {
  boards: Boards;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  clear: () => void;
};

const LeaderboardContext = createContext<LeaderboardContextValue | null>(null);
const CACHED_USER_KEY = "leaderboard_user_id";

export function LeaderboardProvider({ children }: { children: ReactNode }) {
  const [boards, setBoards] = useState<Boards>({ country: null, global: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: session } = await authClient.getSession();
      if (!session?.user) throw new Error("Connect WakaTime to see the leaderboards.");
      const [global, country] = await Promise.all([fetchLeaderboard("global"), fetchLeaderboard("country")]);
      setBoards({ global, country });
      await Promise.allSettled([
        SecureStore.setItemAsync(CACHED_USER_KEY, session.user.id),
        saveCachedLeaderboard(session.user.id, global),
        saveCachedLeaderboard(session.user.id, country),
      ]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The leaderboard could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!wakatimeConnectionAvailable) return;
    void Promise.all([authClient.getCookie(), SecureStore.getItemAsync(CACHED_USER_KEY)]).then(async ([cookie, userId]) => {
      if (!cookie) return;
      if (userId) {
        const cached = await loadCachedLeaderboards(userId);
        setBoards({ country: cached.country ?? null, global: cached.global ?? null });
      }
      await refresh();
    }).catch(() => {});
  }, [refresh]);

  const clear = useCallback(() => {
    setBoards({ country: null, global: null });
    setError(null);
    void SecureStore.deleteItemAsync(CACHED_USER_KEY);
  }, []);

  const value = useMemo(() => ({ boards, loading, error, refresh, clear }), [boards, loading, error, refresh, clear]);
  return <LeaderboardContext.Provider value={value}>{children}</LeaderboardContext.Provider>;
}

export function useLeaderboards() {
  const context = useContext(LeaderboardContext);
  if (!context) throw new Error("LeaderboardProvider is missing");
  return context;
}
