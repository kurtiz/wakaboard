import { createAuth, type Env } from "./auth";

type WakaTimeSummary = {
  range: { date: string };
  grand_total: { total_seconds: number };
  projects?: { name: string; total_seconds: number }[];
  languages?: { name: string; total_seconds: number }[];
  editors?: { name: string; total_seconds: number }[];
};

type WakaTimeLeader = {
  rank: number;
  running_total?: { total_seconds?: number; daily_average?: number; languages?: { name: string; total_seconds: number }[] };
  user?: { id?: string; display_name?: string; username?: string; is_photo_public?: boolean; city?: { country_code?: string } };
};

type WakaTimeProfile = {
  id?: string;
  display_name?: string;
  username?: string;
  photo?: string;
  is_photo_public?: boolean;
  bio?: string;
  website?: string;
  city?: { country_code?: string; title?: string };
};

type WakaTimeLeaders = {
  current_user?: { rank?: number | null; page?: number | null; user?: { id?: string; city?: { country_code?: string } } };
  data?: WakaTimeLeader[];
  page?: number;
  total_pages?: number;
  modified_at?: string;
  range?: { text?: string };
};

function validDate(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function json(value: unknown, status = 200): Response {
  return Response.json(value, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function publicPhoto(profile: WakaTimeProfile, ownProfile = false): string | null {
  if (!ownProfile && !profile.is_photo_public) return null;
  if (!profile.photo) return null;
  try {
    const url = new URL(profile.photo);
    return url.protocol === "https:" ? url.toString() : null;
  } catch { return null; }
}

async function getWakaTimeProfile(id: string, headers: Record<string, string>): Promise<WakaTimeProfile | null> {
  if (!/^[\w-]{1,80}$/.test(id)) return null;
  try {
    const response = await fetch(`https://wakatime.com/api/v1/users/${encodeURIComponent(id)}`, { headers });
    if (!response.ok) return null;
    const result = await response.json() as { data?: WakaTimeProfile };
    return result.data?.id === id ? result.data : null;
  } catch { return null; }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/health") return json({ status: "ok" });
    const authConfigured = !!(env.BETTER_AUTH_SECRET && env.WAKATIME_CLIENT_ID && env.WAKATIME_CLIENT_SECRET);
    if (url.pathname.startsWith("/api/auth/")) {
      if (!authConfigured) return json({ error: "Authentication is not configured" }, 503);
      return createAuth(env, url.origin).handler(request);
    }
    if (!(["/api/summaries", "/api/leaderboards", "/api/profile"].includes(url.pathname)) || request.method !== "GET") {
      return json({ error: "Not found" }, 404);
    }

    const apiKey = request.headers.get("X-WakaTime-API-Key");
    if (apiKey && (apiKey.length > 256 || /[\x00-\x1f\x7f]/.test(apiKey))) return json({ error: "Invalid API key" }, 400);
    let sessionUserId: string | null = null;
    let authorization: string;
    if (apiKey) {
      authorization = `Basic ${btoa(apiKey)}`;
    } else {
      if (!authConfigured) return json({ error: "Authentication is not configured" }, 503);
      const auth = createAuth(env, url.origin);
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session) return json({ error: "Sign in required" }, 401);
      sessionUserId = session.user.id;
      const account = await env.DB.prepare(
        'SELECT id FROM account WHERE userId = ? AND providerId = ? LIMIT 1',
      ).bind(session.user.id, "wakatime").first<{ id: string }>();
      if (!account) return json({ error: "WakaTime account not linked" }, 409);
      const tokens = await auth.api.getAccessToken({
        body: { accountId: account.id },
        headers: request.headers,
      });
      if (!tokens.accessToken) return json({ error: "WakaTime session expired" }, 401);
      authorization = `Bearer ${tokens.accessToken}`;
    }
    const headers = { Authorization: authorization, Accept: "application/json" };

    if (url.pathname === "/api/profile") {
      const id = url.searchParams.get("id");
      if (!id || (id !== "current" && !/^[\w-]{1,80}$/.test(id))) return json({ error: "Invalid profile" }, 400);
      const response = await fetch(`https://wakatime.com/api/v1/users/${encodeURIComponent(id)}`, { headers });
      if (!response.ok) return json({ error: "WakaTime profile is unavailable" }, response.status === 401 || response.status === 403 ? 401 : response.status === 404 ? 404 : 502);
      const { data } = await response.json() as { data?: WakaTimeProfile };
      if (!data?.id) return json({ error: "Invalid WakaTime profile" }, 502);
      const ownProfile = id === "current" || data.id === sessionUserId;
      return json({
        id: data.id,
        name: data.display_name || data.username || "Anonymous User",
        username: data.username ?? null,
        photo: publicPhoto(data, ownProfile),
        bio: data.bio ?? null,
        website: data.website ?? null,
        countryCode: data.city?.country_code ?? null,
        location: data.city?.title ?? null,
      });
    }

    if (url.pathname === "/api/leaderboards") {
      const scope = url.searchParams.get("scope");
      if (scope !== "global" && scope !== "country") return json({ error: "Invalid leaderboard scope" }, 400);
      const globalUrl = new URL("https://wakatime.com/api/v1/leaders");
      globalUrl.searchParams.set("page", "1");
      globalUrl.searchParams.set("board_type", "time");
      const globalResponse = await fetch(globalUrl, { headers });
      if (!globalResponse.ok) return json({ error: "WakaTime leaderboard is unavailable" }, globalResponse.status === 401 || globalResponse.status === 403 ? 401 : 502);
      const globalBoard = await globalResponse.json() as WakaTimeLeaders;
      if (!Array.isArray(globalBoard.data)) return json({ error: "Invalid WakaTime leaderboard" }, 502);
      const countryCode = globalBoard.current_user?.user?.city?.country_code?.toUpperCase() ?? null;
      let board = globalBoard;
      let boardUrl = globalUrl;
      if (scope === "country" && countryCode && /^[A-Z]{2}$/.test(countryCode)) {
        const countryUrl = new URL(globalUrl);
        countryUrl.searchParams.set("country_code", countryCode);
        const countryResponse = await fetch(countryUrl, { headers });
        if (!countryResponse.ok) return json({ error: "Country leaderboard is unavailable" }, 502);
        board = await countryResponse.json() as WakaTimeLeaders;
        if (!Array.isArray(board.data)) return json({ error: "Invalid country leaderboard" }, 502);
        boardUrl = countryUrl;
      }
      const entries = scope === "country" && !countryCode ? [] : (board.data ?? []).slice(0, 20);
      const ownId = board.current_user?.user?.id ?? globalBoard.current_user?.user?.id;
      let ownEntry = ownId ? board.data?.find((entry) => entry.user?.id === ownId) : undefined;
      if (!ownEntry && ownId && (scope === "global" || countryCode)) {
        const ownPageUrl = new URL(boardUrl);
        const ownPage = board.current_user?.page;
        if (ownPage && Number.isInteger(ownPage) && ownPage > 0) ownPageUrl.searchParams.set("page", String(ownPage));
        else ownPageUrl.searchParams.delete("page");
        try {
          const ownPageResponse = await fetch(ownPageUrl, { headers });
          if (ownPageResponse.ok) {
            const ownBoard = await ownPageResponse.json() as WakaTimeLeaders;
            ownEntry = ownBoard.data?.find((entry) => entry.user?.id === ownId);
          }
        } catch { /* Keep the first-page rankings available if the user's page cannot load. */ }
      }
      const currentRunningTotal = ownEntry?.running_total;
      const photos = new Map<string, string>();
      const failedPhotos = new Set<string>();
      for (let index = 0; index < Math.min(entries.length, 10); index += 4) {
        const group = entries.slice(index, Math.min(index + 4, 10));
        const resolved = await Promise.all(group.map(async (entry) => {
          if (!entry.user?.id || !entry.user.is_photo_public) return null;
          const profile = await getWakaTimeProfile(entry.user.id, headers);
          if (!profile) failedPhotos.add(entry.user.id);
          return profile ? [entry.user.id, publicPhoto(profile)] as const : null;
        }));
        for (const result of resolved) if (result?.[1]) photos.set(result[0], result[1]);
      }
      return json({
        scope,
        countryCode,
        rank: scope === "country" && !countryCode ? null : board.current_user?.rank ?? ownEntry?.rank ?? null,
        currentUser: currentRunningTotal ? {
          seconds: currentRunningTotal.total_seconds ?? 0,
          dailyAverage: currentRunningTotal.daily_average ?? 0,
          languages: (currentRunningTotal.languages ?? []).map((language) => ({ name: language.name, seconds: language.total_seconds })),
        } : null,
        leaders: entries.map((entry) => ({
          id: entry.user?.id ?? String(entry.rank),
          rank: entry.rank,
          name: entry.user?.display_name || entry.user?.username || "Anonymous User",
          username: entry.user?.username ?? null,
          photo: entry.user?.id ? photos.get(entry.user.id) ?? null : null,
          photoLookupFailed: entry.user?.id ? failedPhotos.has(entry.user.id) : false,
          seconds: entry.running_total?.total_seconds ?? 0,
          dailyAverage: entry.running_total?.daily_average ?? 0,
          languages: (entry.running_total?.languages ?? []).map((language) => ({ name: language.name, seconds: language.total_seconds })),
          countryCode: entry.user?.city?.country_code ?? null,
        })),
        range: board.range?.text ?? "This week",
        updatedAt: board.modified_at ?? null,
      });
    }

    const start = url.searchParams.get("start");
    const end = url.searchParams.get("end");
    if (!validDate(start) || !validDate(end) || start > end ||
      (new Date(`${end}T00:00:00Z`).getTime() - new Date(`${start}T00:00:00Z`).getTime()) / 86400000 > 30) {
      return json({ error: "Choose a valid range of up to 30 days" }, 400);
    }

    const upstream = new URL("https://wakatime.com/api/v1/users/current/summaries");
    upstream.searchParams.set("start", start);
    upstream.searchParams.set("end", end);
    const response = await fetch(upstream, {
      headers: {
        Authorization: authorization,
        Accept: "application/json",
      },
    });
    if (!response.ok) return json({ error: "WakaTime is unavailable" }, response.status === 401 || response.status === 403 ? 401 : 502);

    const result = await response.json() as { data?: WakaTimeSummary[] };
    if (!Array.isArray(result.data)) return json({ error: "Invalid WakaTime response" }, 502);
    const summaries = result.data.map((day) => ({
      date: day.range.date,
      totalSeconds: day.grand_total.total_seconds,
      projects: (day.projects ?? []).map(({ name, total_seconds }) => ({ name, seconds: total_seconds })),
      languages: (day.languages ?? []).map(({ name, total_seconds }) => ({ name, seconds: total_seconds })),
      editors: (day.editors ?? []).map(({ name, total_seconds }) => ({ name, seconds: total_seconds })),
      source: "wakatime" as const,
    }));
    return json({ summaries });
  },
} satisfies ExportedHandler<Env>;
