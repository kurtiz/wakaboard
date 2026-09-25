import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { LeaderboardScope } from "../../data/leaderboards";

type LeaderboardScopeValue = {
  scope: LeaderboardScope;
  setScope: (scope: LeaderboardScope) => void;
};

const Context = createContext<LeaderboardScopeValue | null>(null);

export function LeaderboardScopeProvider({ children }: { children: ReactNode }) {
  const [scope, setScope] = useState<LeaderboardScope>("global");
  const value = useMemo(() => ({ scope, setScope }), [scope]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useLeaderboardScope() {
  const value = useContext(Context);
  if (!value) throw new Error("LeaderboardScopeProvider is missing");
  return value;
}
