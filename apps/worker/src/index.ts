import { createAuth, type Env } from "./auth";

type WakaTimeSummary = {
  range: { date: string };
  grand_total: { total_seconds: number };
  projects?: { name: string; total_seconds: number }[];
  languages?: { name: string; total_seconds: number }[];
  editors?: { name: string; total_seconds: number }[];
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
    if (url.pathname !== "/api/summaries" || request.method !== "GET") {
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
