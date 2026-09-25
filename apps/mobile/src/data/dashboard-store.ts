import { localDateKey, type DailySummary } from "@wakaboard/core";
import * as SQLite from "expo-sqlite";

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
}> {
  const db = await database();
  const [rows, goal] = await Promise.all([
    db.getAllAsync<SummaryRow>(
      "SELECT * FROM daily_summaries ORDER BY date DESC LIMIT 90",
    ),
    db.getFirstAsync<{ value: string }>(
      "SELECT value FROM preferences WHERE key = ?",
      ["daily_goal_seconds"],
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
  };
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
