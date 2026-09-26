import { localDateKey, type DailySummary } from "@wakaboard/core";

export type CodingWeekDay = {
  date: string;
  label: string;
  seconds: number;
};

export type CodingWeekReport = {
  start: string;
  end: string;
  days: CodingWeekDay[];
  totalSeconds: number;
  activeDays: number;
  bestDay: CodingWeekDay | null;
  topLanguage: string | null;
  topProject: string | null;
};

function topName(days: DailySummary[], field: "languages" | "projects"): string | null {
  const totals = new Map<string, number>();
  for (const day of days) {
    for (const item of day[field]) {
      if (item.name && item.seconds > 0) totals.set(item.name, (totals.get(item.name) ?? 0) + item.seconds);
    }
  }
  return [...totals].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? null;
}

export function buildCodingWeekReport(summaries: DailySummary[], today: Date): CodingWeekReport | null {
  const saved = summaries.filter((day) => day.source === "wakatime");
  const byDate = new Map(saved.map((day) => [day.date, day]));
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const key = localDateKey(date);
    return {
      date: key,
      label: date.toLocaleDateString(undefined, { weekday: "short" }),
      seconds: Math.max(0, byDate.get(key)?.totalSeconds ?? 0),
    };
  });
  const current = days.map((day) => byDate.get(day.date)).filter((day): day is DailySummary => !!day);
  const totalSeconds = days.reduce((total, day) => total + day.seconds, 0);
  if (totalSeconds <= 0) return null;
  const bestDay = days.reduce<CodingWeekDay | null>((best, day) => day.seconds > 0 && (!best || day.seconds > best.seconds) ? day : best, null);
  return {
    start: days[0].date,
    end: days[6].date,
    days,
    totalSeconds,
    activeDays: days.filter((day) => day.seconds > 0).length,
    bestDay,
    topLanguage: topName(current, "languages"),
    topProject: topName(current, "projects"),
  };
}
