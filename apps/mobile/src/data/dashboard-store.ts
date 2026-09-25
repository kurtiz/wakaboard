import { localDateKey, type DailySummary } from "@wakaboard/core";
import * as SQLite from "expo-sqlite";
import type { Leaderboard, LeaderboardScope } from "./leaderboards";

const DATABASE_NAME = "wakaboard.db";
const DEFAULT_GOAL_SECONDS = 4 * 60 * 60;

type SummaryRow = {
  date: string;
  total_seconds: number;
  projects_json: string;
  languages_json: string;
  editors_json: string;
  source: DailySummary["source"];
};

let databasePromise: Promise<SQLite.SQLiteDatabase> | undefined;

async function database(): Promise<SQLite.SQLiteDatabase> {
  databasePromise ??= SQLite.openDatabaseAsync(DATABASE_NAME)
    .then(async (db) => {
      await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS daily_summaries (
        date TEXT PRIMARY KEY NOT NULL,
        total_seconds INTEGER NOT NULL,
        projects_json TEXT NOT NULL,
        languages_json TEXT NOT NULL,
        editors_json TEXT NOT NULL,
        source TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS preferences (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS leaderboard_cache (
        user_id TEXT NOT NULL,
        scope TEXT NOT NULL,
        payload TEXT NOT NULL,
        PRIMARY KEY (user_id, scope)
      );
      `);
      return db;
    })
    .catch((error) => {
      databasePromise = undefined;
      throw error;
    });
  return databasePromise;
}

export async function loadDashboard(): Promise<{
  summaries: DailySummary[];
  goalSeconds: number;
  onboardingComplete: boolean;
}> {
  const db = await database();
  const [rows, goal, onboarding] = await Promise.all([
    db.getAllAsync<SummaryRow>(
      "SELECT * FROM daily_summaries ORDER BY date DESC LIMIT 90",
    ),
    db.getFirstAsync<{ value: string }>(
      "SELECT value FROM preferences WHERE key = ?",
      ["daily_goal_seconds"],
    ),
    db.getFirstAsync<{ value: string }>(
      "SELECT value FROM preferences WHERE key = ?",
      ["onboarding_complete"],
    ),
  ]);

  return {
    summaries: rows.map((row) => ({
      date: row.date,
      totalSeconds: row.total_seconds,
      projects: JSON.parse(row.projects_json),
      languages: JSON.parse(row.languages_json),
      editors: JSON.parse(row.editors_json),
      source: row.source,
    })),
    goalSeconds: goal ? Number(goal.value) : DEFAULT_GOAL_SECONDS,
    onboardingComplete: onboarding?.value === "true" || rows.length > 0,
  };
}

export async function saveOnboardingComplete(): Promise<void> {
  const db = await database();
  await db.runAsync("INSERT INTO preferences (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", ["onboarding_complete", "true"]);
}

export async function loadCachedLeaderboards(userId: string): Promise<Partial<Record<LeaderboardScope, Leaderboard>>> {
  const db = await database();
  const rows = await db.getAllAsync<{ scope: LeaderboardScope; payload: string }>(
    "SELECT scope, payload FROM leaderboard_cache WHERE user_id = ?", [userId],
  );
  const result: Partial<Record<LeaderboardScope, Leaderboard>> = {};
  for (const row of rows) {
    if (row.scope !== "country" && row.scope !== "global") continue;
    try {
      const board = JSON.parse(row.payload) as Leaderboard;
      if (board.scope === row.scope && Array.isArray(board.leaders)) result[row.scope] = board;
    } catch { /* Ignore damaged cache rows; the next refresh replaces them. */ }
  }
  return result;
}

export async function saveCachedLeaderboard(userId: string, board: Leaderboard): Promise<void> {
  const db = await database();
  await db.runAsync(
    "INSERT INTO leaderboard_cache (user_id, scope, payload) VALUES (?, ?, ?) ON CONFLICT(user_id, scope) DO UPDATE SET payload = excluded.payload",
    [userId, board.scope, JSON.stringify(board)],
  );
}

export async function saveGoalSeconds(seconds: number): Promise<void> {
  const db = await database();
  await db.runAsync(
    "INSERT INTO preferences (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    ["daily_goal_seconds", String(seconds)],
  );
}

export async function saveSummary(summary: DailySummary): Promise<void> {
  const db = await database();
  await db.runAsync(
    `INSERT INTO daily_summaries
      (date, total_seconds, projects_json, languages_json, editors_json, source)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET
        total_seconds = excluded.total_seconds,
        projects_json = excluded.projects_json,
        languages_json = excluded.languages_json,
        editors_json = excluded.editors_json,
        source = excluded.source`,
    [
      summary.date,
      summary.totalSeconds,
      JSON.stringify(summary.projects),
      JSON.stringify(summary.languages),
      JSON.stringify(summary.editors),
      summary.source,
    ],
  );
}

export async function addSampleSummaries(): Promise<void> {
  const today = new Date();
  const durations = [1.8, 3.2, 2.5, 4.1, 3.6, 2.9, 3.75];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const totalSeconds = Math.round(durations[6 - offset] * 3600);
    await saveSummary({
      date: localDateKey(date),
      totalSeconds,
      projects: [
        { name: "WakaBoard", seconds: Math.round(totalSeconds * 0.55) },
        { name: "Client work", seconds: Math.round(totalSeconds * 0.3) },
        { name: "Other", seconds: Math.round(totalSeconds * 0.15) },
      ],
      languages: [
        { name: "TypeScript", seconds: Math.round(totalSeconds * 0.62) },
        { name: "Go", seconds: Math.round(totalSeconds * 0.24) },
        { name: "Other", seconds: Math.round(totalSeconds * 0.14) },
      ],
      editors: [
        { name: "VS Code", seconds: Math.round(totalSeconds * 0.79) },
        { name: "Other", seconds: Math.round(totalSeconds * 0.21) },
      ],
      source: "sample",
    });
  }
}

export async function clearSampleSummaries(): Promise<void> {
  const db = await database();
  await db.runAsync("DELETE FROM daily_summaries WHERE source = ?", ["sample"]);
}

export async function clearWakaTimeSummaries(): Promise<void> {
  const db = await database();
  await db.runAsync("DELETE FROM daily_summaries WHERE source = ?", ["wakatime"]);
}
