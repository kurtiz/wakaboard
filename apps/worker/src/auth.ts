import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins";

export type Env = {
  DB: D1Database;
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRET: string;
  WAKATIME_CLIENT_ID: string;
  WAKATIME_CLIENT_SECRET: string;
};

type WakaTimeUser = {
  data: {
    id: string;
    email: string;
    display_name: string;
    photo?: string;
  };
};

export function createAuth(env: Env) {
  return betterAuth({
    appName: "WakaBoard",
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: env.DB,
    trustedOrigins: ["wakaboard://"],
    plugins: [
      expo(),
      genericOAuth({
        config: [{
          providerId: "wakatime",
          clientId: env.WAKATIME_CLIENT_ID,
          clientSecret: env.WAKATIME_CLIENT_SECRET,
          authorizationUrl: "https://wakatime.com/oauth/authorize",
          tokenUrl: "https://wakatime.com/oauth/token",
          scopes: ["email", "read_summaries"],
          getToken: async ({ code, redirectURI, codeVerifier }) => {
            const body = new URLSearchParams({
              client_id: env.WAKATIME_CLIENT_ID,
              client_secret: env.WAKATIME_CLIENT_SECRET,
              code,
              redirect_uri: redirectURI,
              grant_type: "authorization_code",
            });
            if (codeVerifier) body.set("code_verifier", codeVerifier);
            const response = await fetch("https://wakatime.com/oauth/token", {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/x-www-form-urlencoded",
              },
              body,
            });
            if (!response.ok) throw new Error("WakaTime token exchange failed");
            const tokenBody = new URLSearchParams(await response.text());
            const accessToken = tokenBody.get("access_token");
            if (!accessToken) throw new Error("WakaTime returned no access token");
            const expiresIn = Number(tokenBody.get("expires_in"));
            return {
              accessToken,
              refreshToken: tokenBody.get("refresh_token") ?? undefined,
              accessTokenExpiresAt: Number.isFinite(expiresIn) && expiresIn > 0
                ? new Date(Date.now() + expiresIn * 1000)
                : undefined,
              scopes: (tokenBody.get("scope") ?? "").split(/[ ,]+/).filter(Boolean),
            };
          },
          getUserInfo: async (tokens) => {
            const response = await fetch("https://wakatime.com/api/v1/users/current", {
              headers: { Authorization: `Bearer ${tokens.accessToken}` },
            });
            if (!response.ok) return null;
            const { data } = await response.json() as WakaTimeUser;
            if (!data.id || !data.email) return null;
            return {
              id: data.id,
              email: data.email,
              emailVerified: false,
              name: data.display_name,
              image: data.photo,
            };
          },
        }],
      }),
    ],
  });
}
