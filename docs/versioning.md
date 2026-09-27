# Mobile app versioning

WakaBoard's current app version is **1.0.0**. This is the development baseline, not a claim that a store release has shipped. The version appears in Settings and is defined in `apps/mobile/app.json`. Keep `apps/mobile/package.json` at the same version.

## Three identifiers

| Identifier | Location | Purpose |
| --- | --- | --- |
| App version (`MAJOR.MINOR.PATCH`) | `app.json` `expo.version`, mobile `package.json` | The version people see and the key for release notes. |
| Native build number | EAS remote version source | Unique number for each production binary on each platform. EAS increments it on every production build. |
| Hot Updater bundle ID | Hot Updater deployment | Identifies an OTA bundle distributed to compatible native app versions. |
| Git commit | Release tag and build metadata | Identifies the exact source behind a binary or update. |

The app version and native build number are separate. A rejected or replacement store build can keep the same app version while receiving a higher build number. `apps/mobile/app.json` keeps `ios.buildNumber` and `android.versionCode` at `1` as local build defaults; EAS ignores them for production builds. Before the first EAS production build on a platform, check any previously submitted store build number and seed EAS above it if needed. Settings reads the installed values through `expo-application`.

Hot Updater currently uses the `appVersion` strategy. Deploy JavaScript-only updates to the installed app version and channel; keep the app version unchanged for these updates. Change the app version when a new native binary introduces a different native runtime so incompatible binaries cannot receive the same OTA bundle. Do not use a broad target such as `*` without checking native compatibility.

## When to change the app version

- **Patch** (`1.0.0` → `1.0.1`): fixes and small refinements that preserve existing behavior.
- **Minor** (`1.0.0` → `1.1.0`): new user-facing features or meaningful improvements that keep existing workflows intact.
- **Major** (`1.x` → `2.0.0`): a substantial product or compatibility change that needs clear migration notes.

Every shipped version gets a section in `CHANGELOG.md` with Added, Changed, Fixed, and Removed entries as relevant. Keep work in **Unreleased** until the build has shipped. Record the version, date, platforms, features, fixes, and source tag. A feature is considered shipped only when it is in a distributed build or update, not merely merged.

## Release checklist

1. Decide the next app version from the changes in `CHANGELOG.md`; update `app.json` and the mobile `package.json` together.
2. Build production binaries through EAS Build. The `production` profile increments Android `versionCode` and iOS `buildNumber` remotely. The GitHub Actions workflow produces only internal debug and simulator artifacts.
3. When mobile dependencies change, run `pnpm credits:generate` to refresh the direct and supporting package list. Review bundled font credits, then run `pnpm lint` (which checks the generated list) and `pnpm typecheck`.
4. Build and test both platforms. Record the commit and build numbers in the changelog entry before distribution.
5. Deploy OTA bundles only to compatible app versions and the intended Hot Updater channel. An OTA deployment does not change the installed native app or build number.
6. After distribution, date the entry and tag the shipped commit `mobile-vMAJOR.MINOR.PATCH`. Leave later work under **Unreleased**.

Do not derive the app version from every commit: JavaScript-only OTA changes must continue targeting the version embedded in installed native builds. Create a release tag only for source that was actually distributed.
