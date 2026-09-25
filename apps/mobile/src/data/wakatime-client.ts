import { expoClient } from "@better-auth/expo/client";
import type { DailySummary } from "@wakaboard/core";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");
export const wakatimeConnectionAvailable = !!configuredUrl;

export const authClient = createAuthClient({
  baseURL: configuredUrl ?? "https://wakaboard.invalid",
  plugins: [expoClient({
    scheme: "wakaboard",
    storagePrefix: "wakaboard",
    storage: SecureStore,
  })],
});

export async function fetchWakaTimeSummaries(start: string, end: string): Promise<DailySummary[]> {
  if (!configuredUrl) throw new Error("WakaTime connection is not configured yet.");
  const cookie = await authClient.getCookie();
  if (!cookie) throw new Error("Sign in to WakaTime to sync activity.");
  const url = new URL("/api/summaries", configuredUrl);
  url.searchParams.set("start", start);
  url.searchParams.set("end", end);
  const response = await fetch(url, {
    headers: { Cookie: cookie },
    credentials: "omit",
  });
  if (response.status === 401) throw new Error("Your WakaTime session expired. Sign in again.");
  if (!response.ok) throw new Error("WakaTime activity could not be synced. Try again later.");
  const payload = await response.json() as { summaries?: DailySummary[] };
  if (!Array.isArray(payload.summaries)) throw new Error("WakaTime sent an invalid response.");
  return payload.summaries;
}
