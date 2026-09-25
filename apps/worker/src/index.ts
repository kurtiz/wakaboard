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
  running_total?: { total_seconds?: number };
  user?: { id?: string; display_name?: string; username?: string; city?: { country_code?: string } };
};

type WakaTimeLeaders = {
  current_user?: { rank?: number | null; user?: { city?: { country_code?: string } } };
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/health") return json({ status: "ok" });
    if (!env.BETTER_AUTH_URL || !env.BETTER_AUTH_SECRET ||
      !env.WAKATIME_CLIENT_ID || !env.WAKATIME_CLIENT_SECRET) {
      return json({ error: "Authentication is not configured" }, 503);
    }
    const auth = createAuth(env);
    if (url.pathname.startsWith("/api/auth/")) return auth.handler(request);
    if (!(["/api/summaries", "/api/leaderboards"].includes(url.pathname)) || request.method !== "GET") {
      return json({ error: "Not found" }, 404);
    }

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return json({ error: "Sign in required" }, 401);

    const start = url.searchParams.get("start");
    const end = url.searchParams.get("end");
    if (!validDate(start) || !validDate(end) || start > end ||
      (new Date(`${end}T00:00:00Z`).getTime() - new Date(`${start}T00:00:00Z`).getTime()) / 86400000 > 30) {
      return json({ error: "Choose a valid range of up to 30 days" }, 400);
    }

    const account = await env.DB.prepare(
      'SELECT id FROM account WHERE userId = ? AND providerId = ? LIMIT 1',
    ).bind(session.user.id, "wakatime").first<{ id: string }>();
    if (!account) return json({ error: "WakaTime account not linked" }, 409);

    const tokens = await auth.api.getAccessToken({
      body: { accountId: account.id },
      headers: request.headers,
    });
    if (!tokens.accessToken) return json({ error: "WakaTime session expired" }, 401);

    if (url.pathname === "/api/leaderboards") {
      const scope = url.searchParams.get("scope");
      if (scope !== "global" && scope !== "country") return json({ error: "Invalid leaderboard scope" }, 400);
      const globalUrl = new URL("https://wakatime.com/api/v1/leaders");
      globalUrl.searchParams.set("page", "1");
      globalUrl.searchParams.set("board_type", "time");
      const headers = { Authorization: `Bearer ${tokens.accessToken}`, Accept: "application/json" };
      const globalResponse = await fetch(globalUrl, { headers });
      if (!globalResponse.ok) return json({ error: "WakaTime leaderboard is unavailable" }, 502);
      const globalBoard = await globalResponse.json() as WakaTimeLeaders;
      if (!Array.isArray(globalBoard.data)) return json({ error: "Invalid WakaTime leaderboard" }, 502);
      const countryCode = globalBoard.current_user?.user?.city?.country_code?.toUpperCase() ?? null;
      let board = globalBoard;
      if (scope === "country" && countryCode && /^[A-Z]{2}$/.test(countryCode)) {
        const countryUrl = new URL(globalUrl);
        countryUrl.searchParams.set("country_code", countryCode);
        const countryResponse = await fetch(countryUrl, { headers });
        if (!countryResponse.ok) return json({ error: "Country leaderboard is unavailable" }, 502);
        board = await countryResponse.json() as WakaTimeLeaders;
        if (!Array.isArray(board.data)) return json({ error: "Invalid country leaderboard" }, 502);
      }
      return json({
        scope,
        countryCode,
        rank: scope === "country" && !countryCode ? null : board.current_user?.rank ?? null,
        leaders: scope === "country" && !countryCode ? [] : (board.data ?? []).slice(0, 20).map((entry) => ({
          id: entry.user?.id ?? String(entry.rank),
          rank: entry.rank,
          name: entry.user?.display_name || entry.user?.username || "Anonymous User",
          seconds: entry.running_total?.total_seconds ?? 0,
          countryCode: entry.user?.city?.country_code ?? null,
        })),
        range: board.range?.text ?? "This week",
        updatedAt: board.modified_at ?? null,
      });
    }

    const upstream = new URL("https://wakatime.com/api/v1/users/current/summaries");
    upstream.searchParams.set("start", start);
    upstream.searchParams.set("end", end);
    const response = await fetch(upstream, {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        Accept: "application/json",
      },
    });
    if (!response.ok) return json({ error: "WakaTime is unavailable" }, 502);

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
