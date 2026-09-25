import { localDateKey, type DailySummary } from "@wakaboard/core";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  addSampleSummaries,
  clearSampleSummaries,
  clearWakaTimeSummaries,
  loadDashboard,
  saveOnboardingComplete,
  saveGoalSeconds,
  saveSummary,
} from "./dashboard-store";
import { authClient, fetchWakaTimeSummaries, wakatimeConnectionAvailable } from "./wakatime-client";

type DashboardState = {
  summaries: DailySummary[];
  goalSeconds: number;
  onboardingComplete: boolean;
  loading: boolean;
  error: string | null;
  syncing: boolean;
  syncError: string | null;
};

export type SyncOutcome = "success" | "partial" | "error";

type DashboardContextValue = DashboardState & {
  refresh: () => Promise<void>;
  addSample: () => Promise<void>;
  clearSample: () => Promise<void>;
  clearWakaTime: () => Promise<void>;
  setGoalHours: (hours: number) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  syncWakaTime: () => Promise<SyncOutcome>;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const syncInFlight = useRef<Promise<SyncOutcome> | null>(null);
  const [state, setState] = useState<DashboardState>({
    summaries: [],
    goalSeconds: 4 * 3600,
    onboardingComplete: false,
    loading: true,
    error: null,
    syncing: false,
    syncError: null,
  });

  const refresh = useCallback(async () => {
    try {
      const next = await loadDashboard();
      setState((current) => ({ ...current, ...next, loading: false, error: null }));
    } catch {
      setState((current) => ({
        ...current,
        loading: false,
        error: "Local data could not be opened. Please try again.",
      }));
    }
  }, []);

  const runSync = useCallback((showError: boolean): Promise<SyncOutcome> => {
    if (syncInFlight.current) return syncInFlight.current;
    const task = (async () => {
      setState((current) => ({ ...current, syncing: true, syncError: null }));
      try {
        const end = new Date();
        const windows = [0, 30, 60].map((offset) => {
          const windowEnd = new Date(end);
          windowEnd.setDate(end.getDate() - offset);
          const windowStart = new Date(windowEnd);
          windowStart.setDate(windowEnd.getDate() - 29);
          return [localDateKey(windowStart), localDateKey(windowEnd)] as const;
        });
        const results = await Promise.allSettled(windows.map(([start, finish]) => fetchWakaTimeSummaries(start, finish)));
        const summaries = results.flatMap((result) => result.status === "fulfilled" ? result.value : []);
        if (summaries.length === 0 && results.some((result) => result.status === "rejected")) {
          const failed = results.find((result) => result.status === "rejected");
          throw failed?.status === "rejected" ? failed.reason : new Error("Activity could not be synced.");
        }
        await clearSampleSummaries();
        await Promise.all(summaries.map((summary) => saveSummary(summary)));
        await refresh();
        const partial = results.some((result) => result.status === "rejected");
        if (showError && partial) {
          setState((current) => ({ ...current, syncError: "Recent activity was saved, but some older days could not be synced." }));
        }
        return partial ? "partial" : "success";
      } catch (error) {
        if (showError) {
          setState((current) => ({
            ...current,
            syncError: error instanceof Error ? error.message : "Activity could not be synced.",
          }));
        }
        return "error";
      } finally {
        setState((current) => ({ ...current, syncing: false }));
      }
    })();
    syncInFlight.current = task;
    void task.finally(() => { syncInFlight.current = null; });
    return task;
  }, [refresh]);

  useEffect(() => {
    void refresh().then(async () => {
      if (!wakatimeConnectionAvailable) return;
      try {
        if (await authClient.getCookie()) await runSync(false);
      } catch {
        // Cached activity remains available when sign-in storage cannot be read.
      }
    });
  }, [refresh, runSync]);

  const value = useMemo<DashboardContextValue>(
    () => ({
      ...state,
      refresh,
      addSample: async () => {
        await addSampleSummaries();
        await refresh();
      },
      clearSample: async () => {
        await clearSampleSummaries();
        await refresh();
      },
      clearWakaTime: async () => {
        await clearWakaTimeSummaries();
        await refresh();
      },
      setGoalHours: async (hours) => {
        await saveGoalSeconds(Math.round(hours * 3600));
        await refresh();
      },
      completeOnboarding: async () => {
        await saveOnboardingComplete();
        await refresh();
      },
      syncWakaTime: () => runSync(true),
    }),
    [state, refresh, runSync],
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard(): DashboardContextValue {
  const value = useContext(DashboardContext);
  if (!value) throw new Error("DashboardProvider is missing");
  return value;
}
