# Android release signing for WakaBoard

This guide sets up the four GitHub Actions secrets used by
the [Native Build workflow](../.github/workflows/native-build.yml) to produce a signed Android release APK. The Android
debug APK needs no setup. The workflow's iOS artifact is an **unsigned simulator build**; these Android secrets do not
sign iOS builds.

## 1. Check for an existing key

Before creating anything, find out whether an Android release of `com.kompyler.wakaboard` has already been signed or
published. **Reuse its existing release keystore and passwords** for updates. Do not generate a replacement just to
configure CI: Android updates must use the appropriate signing identity. If Google Play manages the app signing key, the
keystore you hold is usually the *upload
key*. [Android's app-signing guide](https://developer.android.com/studio/publish/app-signing) explains the distinction.

If EAS Build created the keystore, retrieve it through Expo's credentials flow:

```sh
cd apps/mobile
pnpm dlx eas-cli credentials -p android
```

Select the relevant Android build profile, then **credentials.json: Upload/Download credentials between EAS servers and
your local json** → **Download credentials from EAS to credentials.json**. The repository ignores `credentials.json` and
common keystore extensions, but keep the downloaded credentials private and backed up outside
Git. [Expo's credential download instructions](https://docs.expo.dev/app-signing/syncing-credentials/) describe this
flow.

If this is the **first** Android release and you have no existing key, continue to the next step.

## 2. Generate a new upload keystore

Run `keytool` on your own computer. Choose a location **outside this repository** for the `.jks` file; the example uses
your home directory. The command prompts for a keystore password, certificate details, and a key password. Save both
passwords in a password manager.

```sh
keytool -genkeypair -v -storetype JKS \
  -keystore ~/wakaboard-upload.jks \
  -alias wakaboard-upload \
  -keyalg RSA -keysize 2048 -validity 10000
```

You will use the alias `wakaboard-upload` in GitHub. If you press Enter to reuse the keystore password for the key, the
two password secrets will have the same value. Back up the keystore and passwords securely; do not place them in the
repository or send them in
chat. [Expo's local Android credentials guide](https://docs.expo.dev/app-signing/local-credentials/) documents keystore
generation.

## 3. Add the GitHub Actions secrets

In the WakaBoard GitHub repository, open **Settings → Secrets and variables → Actions → New repository secret**. Create
all four secrets below. For `ANDROID_KEYSTORE_BASE64`, run this command and copy its single-line output:

```sh
base64 < ~/wakaboard-upload.jks | tr -d '\n'
```

[GitHub's instructions](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets)
show the repository secret UI.

| Secret name                 | Value                                                                 |
|-----------------------------|-----------------------------------------------------------------------|
| `ANDROID_KEYSTORE_BASE64`   | The output of the Base64 command above.                               |
| `ANDROID_KEYSTORE_PASSWORD` | The keystore password entered in `keytool`.                           |
| `ANDROID_KEY_ALIAS`         | `wakaboard-upload`, or the alias of the existing key you are reusing. |
| `ANDROID_KEY_PASSWORD`      | The key password entered in `keytool`.                                |

Use the actual keystore path in the Base64 command if you stored it elsewhere. Base64 is an **encoding, not
encryption**: treat its output as private key material. Do not save that output in a tracked file or paste it into an
issue or pull request.

## 4. Verify the build

Open **Actions → Native Build → Run workflow** and choose **Android**. The `android-release-apk` artifact should appear
alongside `android-debug-apk` when all four secrets are present. With none of them, the workflow skips the release APK.
With only some, it stops with a setup error.

The current workflow produces a signed **APK**. Google Play's publishing path for new apps uses an **Android App
Bundle (AAB)**, so producing a Play Store release will require a separate bundle build or an EAS production
build. [Android's app-signing guide](https://developer.android.com/studio/publish/app-signing) covers Play App Signing
and upload keys.

## iOS signing

The current GitHub workflow does not create a signed iOS device or TestFlight build. For iOS distribution, configure an
Apple Developer account, distribution certificate, and provisioning profile
through [EAS Build](https://docs.expo.dev/build/introduction/) or a separate signed archive workflow. No iOS credential
is needed for the existing simulator ZIP.
