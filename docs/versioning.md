# Mobile app versioning

WakaBoard's current app version is **1.0.0**. This is the development baseline, not a claim that a store release has shipped. The version appears in Settings and is defined in `apps/mobile/app.json`. Keep `apps/mobile/package.json` at the same version.

## Three identifiers

| Identifier | Location | Purpose |
| --- | --- | --- |
| App version (`MAJOR.MINOR.PATCH`) | `app.json` `expo.version`, mobile `package.json` | The version people see and the key for release notes. |
| Native build number | `app.json` `ios.buildNumber`, `android.versionCode` | Unique number for each submitted binary on each platform. Start at `1`; increase before every later store upload. |
| Git commit | Release tag and build metadata | Identifies the exact source behind a binary or update. |

The app version and native build number are separate. A rejected or replacement store build can keep the same app version while receiving a higher build number. If an older build was already submitted under either bundle ID, first check its build number and continue above it.

## When to change the app version

- **Patch** (`1.0.0` → `1.0.1`): fixes and small refinements that preserve existing behavior.
- **Minor** (`1.0.0` → `1.1.0`): new user-facing features or meaningful improvements that keep existing workflows intact.
- **Major** (`1.x` → `2.0.0`): a substantial product or compatibility change that needs clear migration notes.

Every shipped version gets a section in `CHANGELOG.md` with Added, Changed, Fixed, and Removed entries as relevant. Keep work in **Unreleased** until the build has shipped. Record the version, date, platforms, features, fixes, and source tag. A feature is considered shipped only when it is in a distributed build or update, not merely merged.

## Release checklist

1. Decide the next app version from the changes in `CHANGELOG.md`; update `app.json` and the mobile `package.json` together.
2. Increase `ios.buildNumber` and `android.versionCode` above the last submitted build for each platform. The current GitHub Actions native build workflow uses the values in `app.json`; it does not increment them.
3. When mobile dependencies change, run `pnpm credits:generate` to refresh the direct and supporting package list. Review bundled font credits, then run `pnpm lint` (which checks the generated list) and `pnpm typecheck`.
4. Build and test both platforms. Record the commit and build numbers in the changelog entry before distribution.
5. After distribution, date the entry and tag the shipped commit `mobile-vMAJOR.MINOR.PATCH`. Leave later work under **Unreleased**.

If production builds move to EAS, decide whether to keep build numbers in Git or use EAS remote auto-increment. Synchronize the last submitted iOS and Android numbers before switching. For OTA updates, introduce a runtime version policy only when an updater is configured; an update must target compatible native builds. Until then, the app version and native build numbers describe binaries.
