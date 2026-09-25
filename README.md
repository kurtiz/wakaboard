# WakaBoard

A mobile companion for WakaTime, built with Expo Router, Expo UI, and Uniwind. See the [master plan](WakaTime_Mobile_Master_Plan.md) for the product direction.

The Expo app is in `apps/mobile`, shared dashboard types are in `packages/core`, and the WakaTime sign-in API is in `apps/worker`.

## Run locally

```sh
pnpm install
pnpm start
```

Use `pnpm lint` and `pnpm typecheck` to check the app and Worker. Build development clients when native dependencies or app configuration change; the user runs those builds.

The mobile app opens immediately with local SQLite data. The home screen can add clearly labeled sample activity, and Settings can set a local daily goal. WakaTime sign-in is configured through the deployed Worker. Once signed in, the app refreshes the last seven days after loading cached data and also supports manual sync.

## WakaTime connection

The deployed Worker is `https://wakaboard-api.papiliocurtis.workers.dev`. Register this exact callback URL in the WakaTime OAuth app:

```text
https://wakaboard-api.papiliocurtis.workers.dev/api/auth/callback/wakatime
```

Put the WakaTime client ID and secret in the ignored `apps/worker/.dev.vars` file for local development. The production Worker uses Cloudflare secrets with the same names. Do not put the client secret in the Expo app. The local mobile API URL is in the ignored `apps/mobile/.env.local`; copy `apps/mobile/.env.example` if it is missing. Restart Metro after changing Expo environment variables.

For Worker development, run `pnpm --filter @wakaboard/worker dev` from the repository root. The D1 migration is in `apps/worker/migrations`; apply it locally with `pnpm --filter @wakaboard/worker exec wrangler d1 migrations apply DB --local`. Deployments use the account and D1 binding in `apps/worker/wrangler.jsonc`.
