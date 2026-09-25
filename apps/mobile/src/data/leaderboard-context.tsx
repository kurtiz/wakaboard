import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Image } from "expo-image";
import * as SecureStore from "expo-secure-store";
import { authClient, wakatimeConnectionAvailable } from "./wakatime-client";
import { fetchLeaderboard, fetchMemberProfile, type Leaderboard, type LeaderboardScope, type MemberProfile } from "./leaderboards";
import { loadCachedLeaderboards, loadCachedMemberProfile, saveCachedLeaderboard, saveCachedMemberProfile } from "./dashboard-store";

type Boards = Record<LeaderboardScope, Leaderboard | null>;
type LeaderboardContextValue = {
  boards: Boards;
  currentProfile: MemberProfile | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<boolean>;
  clear: () => void;
};

const LeaderboardContext = createContext<LeaderboardContextValue | null>(null);
const CACHED_USER_KEY = "leaderboard_user_id";

export function LeaderboardProvider({ children }: { children: ReactNode }) {
  const [boards, setBoards] = useState<Boards>({ country: null, global: null });
  const [currentProfile, setCurrentProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: session } = await authClient.getSession();
      if (!session?.user) throw new Error("Connect WakaTime to see the leaderboards.");
      if (session.user.image) setCurrentProfile({
        id: session.user.id, name: session.user.name, username: null,
        photo: session.user.image, bio: null, website: null, countryCode: null, location: null,
      });
      const [globalResult, countryResult, profileResult] = await Promise.allSettled([
        fetchLeaderboard("global"),
        fetchLeaderboard("country"),
        fetchMemberProfile("current"),
      ]);
      const profile = profileResult.status === "fulfilled" ? profileResult.value : null;
      if (profile) setCurrentProfile(profile);
      if (profile) void saveCachedMemberProfile(session.user.id, "current", profile).catch(() => {});
      if (profile?.photo) void Image.prefetch(profile.photo, "disk").catch(() => {});
      if (globalResult.status === "rejected") throw globalResult.reason;
      if (countryResult.status === "rejected") throw countryResult.reason;
      const global = globalResult.value;
      const country = countryResult.value;
      setBoards({ global, country });
      const photos = [...new Set([...global.leaders, ...country.leaders].map((leader) => leader.photo).filter((photo): photo is string => !!photo))];
      if (photos.length) void Image.prefetch(photos, "disk").catch(() => {});
      await Promise.allSettled([
        SecureStore.setItemAsync(CACHED_USER_KEY, session.user.id),
        saveCachedLeaderboard(session.user.id, global),
        saveCachedLeaderboard(session.user.id, country),
      ]);
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The leaderboard could not be loaded.");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!wakatimeConnectionAvailable) return;
    void Promise.all([authClient.getCookie(), SecureStore.getItemAsync(CACHED_USER_KEY)]).then(async ([cookie, userId]) => {
      if (!cookie) return;
      if (userId) {
        const [cached, profile] = await Promise.all([
          loadCachedLeaderboards(userId),
          loadCachedMemberProfile(userId, "current"),
        ]);
        setBoards({ country: cached.country ?? null, global: cached.global ?? null });
        setCurrentProfile(profile);
      }
      await refresh();
    }).catch(() => {});
  }, [refresh]);

  const clear = useCallback(() => {
    setBoards({ country: null, global: null });
    setCurrentProfile(null);
    setError(null);
    void SecureStore.deleteItemAsync(CACHED_USER_KEY);
  }, []);

  const value = useMemo(() => ({ boards, currentProfile, loading, error, refresh, clear }), [boards, currentProfile, loading, error, refresh, clear]);
  return <LeaderboardContext.Provider value={value}>{children}</LeaderboardContext.Provider>;
}

export function useLeaderboards() {
  const context = useContext(LeaderboardContext);
  if (!context) throw new Error("LeaderboardProvider is missing");
  return context;
}
