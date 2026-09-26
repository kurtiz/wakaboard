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

## Native builds on GitHub Actions

The [Native Build workflow](.github/workflows/native-build.yml) runs on pushes to `main` and from Actions → Native Build → Run workflow. Manual runs can build Android, iOS, or both. It installs the pnpm workspace, generates native projects with Expo Prebuild, and compiles on GitHub's runners. Generated `apps/mobile/android` and `apps/mobile/ios` directories stay ignored.

Every Android run uploads a debug APK. To also upload a signed release APK, add these four repository Actions secrets:

- `ANDROID_KEYSTORE_BASE64`: base64-encoded release keystore, for example `base64 < release.keystore | tr -d '\n'`
- `ANDROID_KEYSTORE_PASSWORD`: keystore password
- `ANDROID_KEY_ALIAS`: signing key alias
- `ANDROID_KEY_PASSWORD`: signing key password

Keep the keystore and passwords backed up; future Android updates must use the same signing key. If all four secrets are absent, the release build is skipped. If only some are set, the workflow fails with a setup error.

The iOS job uploads an unsigned Release simulator app as a ZIP. Unzip it before installing in a simulator. A device or TestFlight IPA will need Apple signing credentials and a separate archive/export step.

Hot Updater is planned for OTA updates. Its Expo config plugin must be added before producing an OTA-capable native baseline; the current artifacts do not include Hot Updater. The native projects are regenerated on every run, so that plugin can be applied during Prebuild when configured.
