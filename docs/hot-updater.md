# Shipping a Hot Updater update

WakaBoard uses Hot Updater with Cloudflare D1, R2, and a Worker. The mobile app uses the `appVersion` strategy and the `production` channel. As of September 2026, the tested Android production build is app version **1.0.0**, native build **2**. Hot Updater targets `1.0.0`; the native build number does not change when an OTA update is installed. Replace the example target below when the installed app version changes.

## Before deploying

1. Use an installed production build that already contains Hot Updater. Older binaries cannot receive these updates.
2. Make only JavaScript or asset changes that work with that binary's native modules and configuration. For a new native dependency or native configuration change, [build a new binary](versioning.md) and target its app version instead.
3. Keep `apps/mobile/.env.hotupdater` on your machine. It contains the Cloudflare credentials used to upload bundles and metadata. Keep `apps/mobile/.env.local` configured with `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_HOT_UPDATER_URL` so the locally built bundle uses the production services. Both `EXPO_PUBLIC_` values are included in the app bundle, so they must not contain secrets.
4. From the repository root, run `pnpm lint` and `pnpm typecheck`. Commit the intended code before deploying so the bundle's recorded commit identifies its source. Check `git status --short` for unrelated edits: deployment bundles the current local files, including uncommitted changes.

## Deploy to Android

Run from the repository root:

```bash
pnpm --filter @wakaboard/mobile exec hot-updater deploy \
  -p android -t 1.0.0 -c production \
  -m "Describe the change"
```

This builds the current mobile JavaScript and assets, uploads them to R2, and records the bundle in D1. It does not create a new APK or change the app version shown in Settings. The default rollout is 100%; use `-r 25` for a 25% rollout. Do not use `-f` for a normal update: that flag applies it immediately instead of waiting for the next app launch.

Deploy iOS separately with `-p ios` only after an iOS production build containing Hot Updater is installed and tested. Keep `-t` equal to that binary's app version. Do not use a broad target such as `*` unless all targeted native binaries are compatible.

## Verify and recover

List the Android production bundles:

```bash
pnpm --filter @wakaboard/mobile exec hot-updater bundle list -p android -c production
```

Open the installed app while online to download the update, then fully close and reopen it to run the downloaded bundle. Confirm the changed behavior in the app. A normal update downloads in the background and applies on the next launch.

In the app, open **Settings → App updates** to open the standalone update page without the bottom tabs. It shows the installed OTA bundle ID, lets you check for an update, and offers a restart when a download is ready. The **Use mobile data for updates** switch is on by default. When switched off, new update checks require Wi-Fi or Ethernet. After connecting to Wi-Fi, reopen the app or tap **Check now**. The setting does not cancel a download already underway. The app version and native build number stay the same after an OTA update.

If an update causes a problem, open the local management console from the repository root and disable the affected bundle:

```bash
pnpm --filter @wakaboard/mobile exec hot-updater console
```

The console can roll back an enabled bundle. See the [Hot Updater deploy guide](https://hot-updater.dev/docs/guides/deploy), [app version targeting](https://hot-updater.dev/docs/guides/update-strategies/app-version), and [console guide](https://hot-updater.dev/docs/guides/console).
