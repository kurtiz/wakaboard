import { expoClient } from "@better-auth/expo/client";
import type { DailySummary } from "@wakaboard/core";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");
export const wakatimeConnectionAvailable = !!configuredUrl;
export const apiKeyStorageAvailable = process.env.EXPO_OS !== "web";
const API_KEY_STORAGE_KEY = "wakatime_api_key";

export type ConnectionMode = "oauth" | "api-key";

export const authClient = createAuthClient({
  baseURL: configuredUrl ?? "https://wakaboard.invalid",
  plugins: [expoClient({
    scheme: "wakaboard",
    storagePrefix: "wakaboard",
    storage: SecureStore,
  })],
});

export async function getConnectionMode(): Promise<ConnectionMode | null> {
  if (apiKeyStorageAvailable && await SecureStore.getItemAsync(API_KEY_STORAGE_KEY)) return "api-key";
  return await authClient.getCookie() ? "oauth" : null;
}

export async function getWakaTimeAuthHeaders(): Promise<Record<string, string>> {
  const apiKey = apiKeyStorageAvailable ? await SecureStore.getItemAsync(API_KEY_STORAGE_KEY) : null;
  if (apiKey) {
    if (!configuredUrl || new URL(configuredUrl).protocol !== "https:") throw new Error("API key connection requires a secure HTTPS Worker URL.");
    return { "X-WakaTime-API-Key": apiKey };
  }
  const cookie = await authClient.getCookie();
  if (cookie) return { Cookie: cookie };
  throw new Error("Connect WakaTime to sync activity.");
}

export async function validateWakaTimeApiKey(value: string): Promise<void> {
  if (!configuredUrl) throw new Error("WakaTime connection is not configured on this build.");
  if (new URL(configuredUrl).protocol !== "https:") throw new Error("API key connection requires a secure HTTPS Worker URL.");
  const apiKey = value.trim();
  if (!apiKey || apiKey.length > 256 || /\s/.test(apiKey)) throw new Error("Enter a valid WakaTime API key.");
  const url = new URL("/api/profile", configuredUrl);
  url.searchParams.set("id", "current");
  const response = await fetch(url, { headers: { "X-WakaTime-API-Key": apiKey }, credentials: "omit" });
  if (response.status === 401) throw new Error("That API key was not accepted. Check it and try again.");
  if (!response.ok) throw new Error("Could not check the API key right now. Try again later.");
  const profile = await response.json() as { id?: string };
  if (!profile.id) throw new Error("WakaTime returned an invalid account.");
}

export async function saveWakaTimeApiKey(value: string): Promise<void> {
  if (!apiKeyStorageAvailable) throw new Error("API key sign-in is available in the mobile app.");
  await SecureStore.setItemAsync(API_KEY_STORAGE_KEY, value.trim());
}

export async function disconnectWakaTime(): Promise<void> {
  if (apiKeyStorageAvailable) await SecureStore.deleteItemAsync(API_KEY_STORAGE_KEY);
  if (await authClient.getCookie()) {
    const { error } = await authClient.signOut();
    if (error) throw new Error(error.message);
  }
}

export async function getConnectedUser(): Promise<{ id: string; name: string; email: string | null; image: string | null } | null> {
  if (apiKeyStorageAvailable && await SecureStore.getItemAsync(API_KEY_STORAGE_KEY)) {
    if (!configuredUrl) return null;
    const url = new URL("/api/profile", configuredUrl);
    url.searchParams.set("id", "current");
    const response = await fetch(url, { headers: await getWakaTimeAuthHeaders(), credentials: "omit" });
    if (!response.ok) return null;
    const profile = await response.json() as { id?: string; name?: string; photo?: string | null };
    return profile.id && profile.name ? { id: profile.id, name: profile.name, email: null, image: profile.photo ?? null } : null;
  }
  const { data } = await authClient.getSession();
  return data?.user ? { id: data.user.id, name: data.user.name, email: data.user.email, image: data.user.image ?? null } : null;
}

export async function fetchWakaTimeSummaries(start: string, end: string): Promise<DailySummary[]> {
  if (!configuredUrl) throw new Error("WakaTime connection is not configured yet.");
  const headers = await getWakaTimeAuthHeaders();
  const url = new URL("/api/summaries", configuredUrl);
  url.searchParams.set("start", start);
  url.searchParams.set("end", end);
  const response = await fetch(url, {
    headers,
    credentials: "omit",
  });
  if (response.status === 401) throw new Error("WakaTime rejected this connection. Disconnect and sign in again.");
  if (!response.ok) throw new Error("WakaTime activity could not be synced. Try again later.");
  const payload = await response.json() as { summaries?: DailySummary[] };
  if (!Array.isArray(payload.summaries)) throw new Error("WakaTime sent an invalid response.");
  return payload.summaries;
}
