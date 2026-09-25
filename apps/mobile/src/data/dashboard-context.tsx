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
  saveGoalSeconds,
  saveSummary,
} from "./dashboard-store";
import { authClient, fetchWakaTimeSummaries, wakatimeConnectionAvailable } from "./wakatime-client";

type DashboardState = {
  summaries: DailySummary[];
  goalSeconds: number;
  loading: boolean;
  error: string | null;
  syncing: boolean;
  syncError: string | null;
};

type DashboardContextValue = DashboardState & {
  refresh: () => Promise<void>;
  addSample: () => Promise<void>;
  clearSample: () => Promise<void>;
  clearWakaTime: () => Promise<void>;
  setGoalHours: (hours: number) => Promise<void>;
  syncWakaTime: () => Promise<void>;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const syncInFlight = useRef<Promise<void> | null>(null);
  const [state, setState] = useState<DashboardState>({
    summaries: [],
    goalSeconds: 4 * 3600,
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

  const runSync = useCallback((showError: boolean): Promise<void> => {
    if (syncInFlight.current) return syncInFlight.current;
    const task = (async () => {
      setState((current) => ({ ...current, syncing: true, syncError: null }));
      try {
        const end = new Date();
        const start = new Date(end);
        start.setDate(start.getDate() - 6);
        const summaries = await fetchWakaTimeSummaries(localDateKey(start), localDateKey(end));
        await clearSampleSummaries();
        for (const summary of summaries) await saveSummary(summary);
        await refresh();
      } catch (error) {
        if (showError) {
          setState((current) => ({
            ...current,
            syncError: error instanceof Error ? error.message : "Activity could not be synced.",
          }));
        }
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
