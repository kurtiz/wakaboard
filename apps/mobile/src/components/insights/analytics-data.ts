import { localDateKey, type Breakdown, type DailySummary } from "@wakaboard/core";

export type AnalyticsRange = 7 | 30 | 90 | 365 | "all";

export type CadenceBucket = {
  key: string;
  label: string;
  dateLabel: string;
  seconds: number;
};

function dateBefore(today: Date, days: number): Date {
  const date = new Date(today);
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date;
}

function breakdown(days: DailySummary[], field: "projects" | "languages" | "editors"): Breakdown[] {
  const totals = new Map<string, number>();
  for (const day of days) {
    for (const row of day[field]) totals.set(row.name, (totals.get(row.name) ?? 0) + row.seconds);
  }
  return [...totals].map(([name, seconds]) => ({ name, seconds })).sort((a, b) => b.seconds - a.seconds);
}

export function buildAnalytics(summaries: DailySummary[], range: AnalyticsRange, today: Date) {
  const sorted = [...summaries].sort((a, b) => a.date.localeCompare(b.date));
  const oldest = sorted[0]?.date;
  const elapsed = oldest ? Math.round((dateBefore(today, 0).getTime() - new Date(`${oldest}T12:00:00`).getTime()) / 86_400_000) + 1 : 0;
  const days = range === "all" ? Math.max(1, elapsed) : range;
  const first = localDateKey(dateBefore(today, days - 1));
  const todayKey = localDateKey(today);
  const current = sorted.filter((day) => day.date >= first && day.date <= todayKey);
  const priorFirst = localDateKey(dateBefore(today, days * 2 - 1));
  const priorLast = localDateKey(dateBefore(today, days));
  const previous = range === "all" ? [] : sorted.filter((day) => day.date >= priorFirst && day.date <= priorLast);
  const total = current.reduce((sum, day) => sum + day.totalSeconds, 0);
  const previousTotal = previous.reduce((sum, day) => sum + day.totalSeconds, 0);
  const active = new Set(current.filter((day) => day.totalSeconds > 0).map((day) => day.date));
  let streak = 0;
  let peakStreak = 0;
  for (let offset = days - 1; offset >= 0; offset--) {
    streak = active.has(localDateKey(dateBefore(today, offset))) ? streak + 1 : 0;
    peakStreak = Math.max(peakStreak, streak);
  }
  const bestDay = current.reduce<DailySummary | null>((best, day) => !best || day.totalSeconds > best.totalSeconds ? day : best, null);
  const bucketCount = Math.min(days, range === 7 ? 7 : range === 30 ? 10 : 12);
  const secondsByDate = new Map(current.map((day) => [day.date, day.totalSeconds]));
  const buckets: CadenceBucket[] = Array.from({ length: bucketCount }, (_, index) => {
    const recentOffset = Math.floor((bucketCount - index - 1) * days / bucketCount);
    const oldestOffset = Math.floor((bucketCount - index) * days / bucketCount) - 1;
    const newestDate = dateBefore(today, recentOffset);
    const oldestDate = dateBefore(today, oldestOffset);
    let seconds = 0;
    for (let offset = oldestOffset; offset >= recentOffset; offset--) seconds += secondsByDate.get(localDateKey(dateBefore(today, offset))) ?? 0;
    const short = (date: Date) => date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return {
      key: localDateKey(newestDate),
      label: range === 7 ? newestDate.toLocaleDateString(undefined, { weekday: "short" }) : short(newestDate),
      dateLabel: recentOffset === oldestOffset ? newestDate.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) : `${short(oldestDate)}–${short(newestDate)}`,
      seconds,
    };
  });
  return {
    days,
    current,
    total,
    previousTotal,
    hasPrevious: previous.length > 0,
    activeDays: active.size,
    peakStreak,
    bestDay,
    buckets,
    projects: breakdown(current, "projects"),
    languages: breakdown(current, "languages"),
    editors: breakdown(current, "editors"),
  };
}
