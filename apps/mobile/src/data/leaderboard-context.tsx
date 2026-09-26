import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
  const boardsRef = useRef(boards);
  const profileRef = useRef(currentProfile);
  const generation = useRef(0);

  const showBoards = useCallback((next: Boards) => {
    boardsRef.current = next;
    setBoards(next);
  }, []);
  const showProfile = useCallback((next: MemberProfile | null) => {
    profileRef.current = next;
    setCurrentProfile(next);
  }, []);

  const refresh = useCallback(async () => {
    const requestGeneration = generation.current;
    setLoading(true);
    setError(null);
    try {
      const { data: session } = await authClient.getSession();
      if (!session?.user) throw new Error("Connect WakaTime to see the leaderboards.");
      if (requestGeneration !== generation.current) return false;
      if (session.user.image && !profileRef.current) showProfile({
        id: session.user.id, name: session.user.name, username: null,
        photo: session.user.image, bio: null, website: null, countryCode: null, location: null,
      });
      const [globalResult, countryResult, profileResult] = await Promise.allSettled([
        fetchLeaderboard("global"),
        fetchLeaderboard("country"),
        fetchMemberProfile("current"),
      ]);
      if (requestGeneration !== generation.current) return false;
      const profile = profileResult.status === "fulfilled" ? profileResult.value : null;
      if (profile) showProfile(profile);
      if (profile) void saveCachedMemberProfile(session.user.id, "current", profile).catch(() => {});
      if (profile?.photo) void Image.prefetch(profile.photo, "disk").catch(() => {});
      const next = { ...boardsRef.current };
      const successful = [globalResult, countryResult].filter((result) => result.status === "fulfilled");
      for (const result of successful) {
        const previousPhotos = new Map(boardsRef.current[result.value.scope]?.leaders.map((leader) => [leader.id, leader.photo]));
        next[result.value.scope] = {
          ...result.value,
          leaders: result.value.leaders.map((leader) => leader.photoLookupFailed
            ? { ...leader, photo: previousPhotos.get(leader.id) ?? null }
            : leader),
        };
      }
      if (successful.length) showBoards(next);
      const photos = [...new Set(successful.flatMap((result) => next[result.value.scope]?.leaders.map((leader) => leader.photo) ?? []).filter((photo): photo is string => !!photo))];
      if (photos.length) void Image.prefetch(photos, "disk").catch(() => {});
      await Promise.allSettled([
        SecureStore.setItemAsync(CACHED_USER_KEY, session.user.id),
        ...successful.map((result) => saveCachedLeaderboard(session.user.id, next[result.value.scope]!)),
      ]);
      const failure = [globalResult, countryResult].find((result) => result.status === "rejected");
      if (failure?.status === "rejected") {
        setError(failure.reason instanceof Error ? failure.reason.message : "Some rankings could not be loaded.");
      }
      return successful.length === 2;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The leaderboard could not be loaded.");
      return false;
    } finally {
      setLoading(false);
    }
  }, [showBoards, showProfile]);

  useEffect(() => {
    let active = true;
    void SecureStore.getItemAsync(CACHED_USER_KEY).catch(() => null).then(async (userId) => {
      if (userId) {
        const [cached, profile] = await Promise.allSettled([
          loadCachedLeaderboards(userId),
          loadCachedMemberProfile(userId, "current"),
        ]);
        if (!active) return;
        if (cached.status === "fulfilled") showBoards({ country: cached.value.country ?? null, global: cached.value.global ?? null });
        if (profile.status === "fulfilled") showProfile(profile.value);
      }
      if (!active) return;
      if (wakatimeConnectionAvailable) await refresh();
    }).catch(() => {});
    return () => { active = false; };
  }, [refresh, showBoards, showProfile]);

  const clear = useCallback(() => {
    generation.current += 1;
    showBoards({ country: null, global: null });
    showProfile(null);
    setError(null);
    void SecureStore.deleteItemAsync(CACHED_USER_KEY);
  }, [showBoards, showProfile]);

  const value = useMemo(() => ({ boards, currentProfile, loading, error, refresh, clear }), [boards, currentProfile, loading, error, refresh, clear]);
  return <LeaderboardContext.Provider value={value}>{children}</LeaderboardContext.Provider>;
}

export function useLeaderboards() {
  const context = useContext(LeaderboardContext);
  if (!context) throw new Error("LeaderboardProvider is missing");
  return context;
}
