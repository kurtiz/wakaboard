# WakaBoard

WakaBoard is an open source iOS and Android companion for [WakaTime](https://wakatime.com/). It turns coding activity
into a mobile dashboard with daily goals, insights, leaderboards, and locally cached data. Connect with WakaTime sign-in
or a WakaTime API key to get started.

The app uses Expo SDK 57, React Native, Expo Router, Expo UI, and Uniwind. A Cloudflare Worker handles WakaTime OAuth
and API requests. Cloudflare D1 stores OAuth records. An API key, when used, stays in Expo SecureStore on the device;
the mobile app caches downloaded activity separately in SQLite.

> **Status:** Active development. Native build verification, OAuth smoke testing, and some export work are still in
> progress. See the [master plan](WakaTime_Mobile_Master_Plan.md) for product direction.

## Contents

- [Features](#features)
- [Repository layout](#repository-layout)
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Deploy your own Worker](#deploy-your-own-worker)
- [Connect WakaTime](#connect-wakatime)
- [Local Worker development](#local-worker-development)
- [Mobile development and native builds](#mobile-development-and-native-builds)
- [Configuration reference](#configuration-reference)
- [Architecture and data](#architecture-and-data)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Features

- Open directly to a simple WakaTime connection screen.
- Connect a WakaTime account and sync coding summaries, including project, language, and editor breakdowns.
- Set a daily coding goal and review previously downloaded activity while offline.
- View WakaTime leaderboards and member profiles when connected.
- Change appearance and sync preferences, sign out, and remove downloaded activity in Settings.

Some screens and share features are still being refined. Please report reproducible problems in an issue.

## Repository layout

| Path                                 | Purpose                                                                                                                 |
|--------------------------------------|-------------------------------------------------------------------------------------------------------------------------|
| `apps/mobile/`                       | Expo Router app for iOS and Android. Routes live in `src/app/`.                                                         |
| `apps/worker/`                       | Worker source and a safe example config. The maintainer's production `wrangler.jsonc` remains local and ignored by Git. |
| `deploy/worker/`                     | Self-contained public Worker template for new installations. This directory is the Deploy button target.                |
| `packages/core/`                     | Shared dashboard data types and date helpers.                                                                           |
| `.github/workflows/native-build.yml` | GitHub Actions Android and iOS builds.                                                                                  |
| `WakaTime_Mobile_Master_Plan.md`     | Product direction and roadmap.                                                                                          |

## Prerequisites

- [Node.js 22.13 or newer](https://nodejs.org/) (Expo SDK 57's minimum Node version)
  and [pnpm 11](https://pnpm.io/installation). The repository specifies `pnpm@11.23.0`; `corepack enable` can activate
  it.
- Git and an Android device/emulator or an iOS device/simulator.
- A [Cloudflare account](https://dash.cloudflare.com/) for your own Worker and D1 database, and
  a [WakaTime account](https://wakatime.com/) for live activity.
- For local native compilation, the matching Android or Apple toolchain. EAS Build is a cloud alternative.

This app uses native modules. Use
an [Expo development build](https://docs.expo.dev/develop/development-builds/introduction/) for reliable testing; Expo
Go does not contain every native module used here.

## Quick start

Run these commands from the repository root:

```sh
git clone https://github.com/kurtiz/wakaboard.git
cd wakaboard
corepack enable
pnpm install --frozen-lockfile
cp apps/mobile/.env.example apps/mobile/.env.local
pnpm start
```

The copied mobile environment file leaves `EXPO_PUBLIC_API_URL` empty, so the app starts with local/sample data. **Set
it to your own Worker URL** after deploying your backend. Restart Metro after editing the file.

Install a development build on your device or emulator, then open the Metro URL from `pnpm start`. For local builds, use
`pnpm android` or `pnpm ios`. See [Mobile development and native builds](#mobile-development-and-native-builds) for
cloud build options.

## Deploy your own Worker

Each installation should use its **own Cloudflare Worker and D1 database**. WakaTime sign-in also needs a WakaTime OAuth app. The public template in
`deploy/worker` contains no maintainer account, database ID, or production auth URL. The maintainer's existing
`apps/worker/wrangler.jsonc` stays on their machine and is ignored by Git. Use the template for a new installation so
you cannot target the maintainer's deployment.

### Deploy to Cloudflare

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/kurtiz/wakaboard/tree/main/deploy/worker)

The button targets the self-contained `deploy/worker` directory. Cloudflare copies it to your GitHub account, provisions
a Worker and D1 database, then runs its deploy command. That command deploys the Worker and applies the D1
authentication migration. The maintainer's local `apps/worker` configuration is not part of that imported directory. See
Cloudflare's [Deploy button documentation](https://developers.cloudflare.com/workers/platform/deploy-buttons/) for the
import flow. The source repository must be public.

1. Sign in to Cloudflare and GitHub. Select the Worker and D1 names, then review the generated repository and build
   settings. Keep the `DB` binding name.
2. Set `BETTER_AUTH_SECRET` to a unique random value; generate one on your machine with `openssl rand -hex 32`.
   Cloudflare may also request `WAKATIME_CLIENT_ID` and `WAKATIME_CLIENT_SECRET` during setup. If you do not have an
   OAuth app yet, provision with temporary placeholders, then replace them before signing in.
3. Visit `https://<your-worker>.<your-subdomain>.workers.dev/health`. It should return `{"status":"ok"}`. Note the exact
   HTTPS origin without a trailing slash.
4. [Create a WakaTime OAuth app](#connect-wakatime) using that origin for its callback. Update the two WakaTime Worker
   secrets in Cloudflare if you used placeholders.
5. Set `EXPO_PUBLIC_API_URL` in `apps/mobile/.env.local` to your Worker origin, restart Metro, and connect from the
   app's first screen.

The button provisions the backend; OAuth sign-in still requires an OAuth app tied to the final callback URL. Keep secrets in
Cloudflare's secret settings, never in `wrangler.jsonc`, an Expo environment file, or a commit.

### Deploy from the command line

Use this route if you want to inspect each setup step. Run these commands inside the isolated template directory, either
in this repository or in the repository Cloudflare creates from the button:

```sh
cd deploy/worker
npm install
npx wrangler login
npm run deploy
```

If you are in the template's own generated repository, start at `npm install` because you are already in its root.
Wrangler provisions D1 from the template's `DB` binding. The template deploy script then applies migrations remotely.
Save the URL printed by Wrangler and set your three required Worker secrets:

```sh
npx wrangler secret put BETTER_AUTH_SECRET
npx wrangler secret put WAKATIME_CLIENT_ID
npx wrangler secret put WAKATIME_CLIENT_SECRET
```

Enter each value at Wrangler's prompt. Generate a random value for `BETTER_AUTH_SECRET` with `openssl rand -hex 32`. If
you use multiple Cloudflare accounts, choose the intended account during login or set `CLOUDFLARE_ACCOUNT_ID` in your
shell. The **template** config contains no account or database ID. If Wrangler writes a database ID into your imported
repository after provisioning, review that change before committing it. Later updates use `npm run deploy` there;
Wrangler tracks applied D1 migrations. Do not use `pnpm --filter @wakaboard/worker deploy` for a new installation: that
script uses the existing maintainer configuration.

## Connect WakaTime

1. Create an OAuth app on your [WakaTime applications page](https://wakatime.com/apps). Use this **exact** redirect URI,
   with your own Worker origin:

   ```text
   https://<your-worker>.<your-subdomain>.workers.dev/api/auth/callback/wakatime
   ```

2. Put its client ID and client secret in Worker secrets named `WAKATIME_CLIENT_ID` and `WAKATIME_CLIENT_SECRET`. The
   Worker requests the `email` and `read_summaries` scopes and exchanges authorization codes server-side.
3. Put your Worker origin in the mobile app's local environment file:

   ```dotenv
   EXPO_PUBLIC_API_URL=https://<your-worker>.<your-subdomain>.workers.dev
   ```

4. Restart Metro, open the app, and connect WakaTime. After sign-in, the app downloads recent summaries and supports
   later manual refreshes.

You can instead choose **Use an API key** on the first screen and paste the key from your
[WakaTime API key page](https://wakatime.com/api-key). The app checks it before saving it in Expo SecureStore. It is
sent over HTTPS to your Worker for WakaTime requests, and the Worker does not store it. Disconnecting in Settings
deletes it from the device. API key access requires an HTTPS Worker URL.

If you use a custom Worker domain, use it consistently for the OAuth redirect and mobile API URL. A different host,
path, or protocol will make WakaTime reject the redirect.
See [WakaTime's OAuth documentation](https://wakatime.com/developers).

## Local Worker development

In a fresh clone, copy the safe Wrangler example and the example secrets file. Replace the secret placeholders. Both
`wrangler.jsonc` and `.dev.vars` in `apps/worker` are ignored by Git:

```sh
cp apps/worker/wrangler.example.jsonc apps/worker/wrangler.jsonc
cp apps/worker/.dev.vars.example apps/worker/.dev.vars
pnpm --filter @wakaboard/worker exec wrangler d1 migrations apply DB --local
pnpm --filter @wakaboard/worker dev
```

The local Worker runs at `http://localhost:8787` by default. For local OAuth, register
`http://localhost:8787/api/auth/callback/wakatime` in a separate WakaTime OAuth app if WakaTime accepts the local URL. A
physical phone cannot reach your computer's `localhost`; use a reachable HTTPS Worker deployment for device sign-in. You
can test `http://localhost:8787/health` and local D1 migrations without OAuth.

The Worker exposes `GET /health`, Better Auth routes under `/api/auth/`, and authenticated `GET /api/summaries`,
`/api/leaderboards`, and `/api/profile` endpoints. WakaTime credentials and access tokens stay on the server side.

## Mobile development and native builds

| Command                                            | What it does                                                         |
|----------------------------------------------------|----------------------------------------------------------------------|
| `pnpm start`                                       | Starts the Expo development server.                                  |
| `pnpm android`                                     | Compiles a local Android development build and starts Metro.         |
| `pnpm ios`                                         | Compiles a local iOS development build on macOS and starts Metro.    |
| `pnpm lint`                                        | Lints the mobile app.                                                |
| `pnpm typecheck`                                   | Typechecks workspaces with a typecheck script, including the Worker. |
| `pnpm --filter @wakaboard/mobile exec expo-doctor` | Checks Expo dependencies and configuration.                          |

For cloud native builds, use [EAS Build](https://docs.expo.dev/build/introduction/) from `apps/mobile` after configuring
your own Expo project and signing credentials.
The [Native Build GitHub Actions workflow](.github/workflows/native-build.yml) runs automatically on pushes to `preview`
and `release`, with no automatic run for `main`. It can also be triggered manually for Android, iOS, or both. It uploads
an Android debug APK and an unsigned iOS simulator ZIP; it does not publish to an app store.

For a signed Android release APK in GitHub Actions, follow the [Android signing guide](docs/android-signing.md) to get
or generate a keystore and set the four required repository secrets. With no signing secrets, the release APK is
skipped; with only some, the workflow fails. The iOS ZIP is for a simulator, not a device or TestFlight; device
distribution requires Apple signing and export.

When adding a native library or changing native configuration, rebuild the development client. Configure native behavior
in `apps/mobile/app.json` and config plugins; generated `apps/mobile/ios` and `apps/mobile/android` directories are
ignored. OTA support via Hot Updater is planned but is **not included** in current native artifacts.

## Configuration reference

| Name                     | Where                                            | Purpose                                                                                                                 |
|--------------------------|--------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------|
| `EXPO_PUBLIC_API_URL`    | `apps/mobile/.env.local`                         | Public HTTPS origin of **your** Worker. Bundled into the app; never put a secret here. Omit for local/sample data only. |
| `BETTER_AUTH_URL`        | Optional in a local Worker config or `.dev.vars` | Fixed auth origin when set. The public examples omit it and use the request origin.                                     |
| `BETTER_AUTH_SECRET`     | Worker secret or local `.dev.vars`               | Unique random signing secret for Better Auth.                                                                           |
| `WAKATIME_CLIENT_ID`     | Worker secret or local `.dev.vars`               | WakaTime OAuth app client ID.                                                                                           |
| `WAKATIME_CLIENT_SECRET` | Worker secret or local `.dev.vars`               | WakaTime OAuth app client secret. Keep private.                                                                         |
| `DB`                     | Wrangler D1 binding                              | Auth users, sessions, accounts, and verification records. Keep this binding name.                                       |

The public template derives its Better Auth base URL from the incoming request origin, so a `workers.dev` hostname or
custom domain works without a checked-in URL. The maintainer's local Worker config retains its fixed `BETTER_AUTH_URL`,
preserving its callback behavior. The mobile URL is an Expo public variable; restart Metro or rebuild the app after
changing it.

## Architecture and data

```text
WakaBoard mobile app ── OAuth or API key requests ──▶ Cloudflare Worker ──▶ WakaTime API
        │                                                   │
        └── local SQLite cache and preferences              └── D1 auth records
```

The Worker stores OAuth authentication state in D1 and requests WakaTime data using an OAuth token or a device-held API key. The mobile app
caches downloaded daily summaries locally, so previously synced activity stays visible offline. Sample activity is
labeled and can be removed; a successful sync clears it. Settings can remove saved WakaTime activity from the device.
WakaBoard is an independent companion and is not affiliated with WakaTime or Cloudflare.

## Troubleshooting

| Symptom                                            | Check                                                                                                                                                                           |
|----------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `Connection unavailable` in the app                | Set `EXPO_PUBLIC_API_URL` in `apps/mobile/.env.local` to your Worker origin and restart Metro.                                                                                  |
| `Authentication is not configured` from the Worker | Add all three Worker secrets. `/health` works without them.                                                                                                                     |
| WakaTime rejects the redirect URI                  | Compare the registered callback with `<worker-origin>/api/auth/callback/wakatime` character for character.                                                                      |
| Sign-in works but data requests fail               | In your standalone template directory, ensure remote migrations completed (`npx wrangler d1 migrations apply DB --remote`), check WakaTime app scopes, and inspect Worker logs. |
| App cannot reach a local Worker on a phone         | `localhost` on a phone refers to the phone; use a deployed HTTPS Worker for device OAuth.                                                                                       |
| Native module or configuration error               | Install a fresh development build for the current dependencies and configuration.                                                                                               |
| Deploy button cannot import the source             | Confirm the source repo is public and use the `deploy/worker` subdirectory URL above.                                                                                           |

## Contributing

Issues and pull requests are welcome. Check existing issues and the [master plan](WakaTime_Mobile_Master_Plan.md) before
large behavior or architecture changes. Keep route files in `apps/mobile/src/app/` and reusable components and hooks
outside that directory. Never commit `apps/worker/wrangler.jsonc`, `.dev.vars`, `.env.local`, API tokens, signing keys,
or generated native projects. Use [the example Wrangler config](apps/worker/wrangler.example.jsonc) for a fresh clone.

Run `pnpm lint` and `pnpm typecheck` before opening a pull request. For Worker changes, verify local D1 migrations and
`GET /health`; for mobile UI changes, check Android and iOS when possible. Describe what changed, how you tested it, and
any remaining platform limitations.

When changing `apps/worker/src` or its migrations, run `pnpm worker:template:sync` and include the resulting
`deploy/worker` copies in the same pull request. `pnpm worker:template:check` verifies that the public template is
current. The two directories keep separate Wrangler and package configuration so new installations cannot inherit the
maintainer's deployment settings.

## License

WakaBoard's original code and documentation are released under the [MIT License](LICENSE). The bundled Nunito and Outfit
fonts retain their separate [SIL Open Font Licenses](apps/mobile/assets/fonts/Nunito-OFL.txt)
and [license notice](apps/mobile/assets/fonts/Outfit-OFL.txt). WakaTime and Cloudflare names and marks remain the
property of their respective owners.
