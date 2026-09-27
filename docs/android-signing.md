# Android release signing for WakaBoard

Signed Android release APKs are built through EAS Build with the `production` profile. The GitHub Actions Native Build workflow produces a debug APK for internal checks and does not use an Android release keystore.

Run `pnpm build:android` from the repository root to start a signed production APK build. EAS manages the Android signing credentials and increments the production build number remotely. The local `android.versionCode` in `app.json` is a default for local builds; it is not the EAS production build number.

When updating an installed Android app, use the same signing identity and a higher build number. Check the EAS build details for the generated build number before distributing the APK. If an app was previously submitted to Google Play with a higher build number, initialize EAS remote versioning above that value before the next build.

Manage or download the EAS keystore with `npx --yes eas-cli@24.8.0 credentials -p android` from `apps/mobile`. Keep downloaded credentials private and outside Git. See [Expo's credential download instructions](https://docs.expo.dev/app-signing/syncing-credentials/) for credential management.
