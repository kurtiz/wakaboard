export type Breakdown = {
  name: string;
  seconds: number;
};

export type DailySummary = {
  date: string;
  totalSeconds: number;
  projects: Breakdown[];
  languages: Breakdown[];
  editors: Breakdown[];
  source: "sample" | "wakatime";
};

export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDuration(seconds: number): string {
  const minutes = Math.round(Math.max(0, seconds) / 60);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

export function goalProgress(totalSeconds: number, goalSeconds: number): number {
  if (goalSeconds <= 0) return 0;
  return Math.min(1, Math.max(0, totalSeconds / goalSeconds));
}

export function weeklyTotal(summaries: DailySummary[]): number {
  return summaries.reduce((total, day) => total + day.totalSeconds, 0);
}
