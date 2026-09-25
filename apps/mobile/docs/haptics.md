# Haptic presets

The reusable preset definitions in [`src/constants/haptics.ts`](../src/constants/haptics.ts) are copied from `../yenzi/yenzi-mobile/src/constants/haptics.ts`. WakaBoard already depends on `expo-haptics`; no new dependency is needed.

| Preset | Expo haptics call | Feedback |
| --- | --- | --- |
| `back` | `impactAsync(Light)` | Light impact |
| `next` | `impactAsync(Medium)` | Medium impact |
| `confirm` | `notificationAsync(Success)` | Success notification |
| `error` | `notificationAsync(Error)` | Error notification |
| `warning` | `notificationAsync(Warning)` | Warning notification |
| `soft` | `impactAsync(Soft)` | Soft impact |
| `selection` | `selectionAsync()` | Selection change |
| `heavy` | `impactAsync(Heavy)` | Heavy impact |

Call a preset with `void HapticPreset.selection()` for a fire-and-forget response, or `await HapticPreset.confirm()` when a sequence needs to wait for it. `HapticPresetKey` is the union of the eight preset names and can type a reusable component's `haptic` prop.

`setHapticsGloballyEnabled(false)` makes every preset return a resolved promise without triggering feedback. `isHapticsGloballyEnabled()` reads that flag. It starts as `true` on every app launch; this module does not persist the setting or add a Settings control.

## WakaBoard mapping

| Moment | Preset |
| --- | --- |
| A route changes, including a tab visit or going back | `back` (light impact) |
| An onboarding slide moves forward or backward | `next` or `back` |
| A day, project, chart bar, range, leaderboard scope, or font choice changes | `selection` |
| A pull-to-refresh gesture is accepted by the native refresh control | `heavy` |
| A manual sync, sign-in, goal save, sample removal, or sign-out completes | `confirm` |
| A manual sync saves only some requested data | `warning` |
| A user-started action fails | `error` |

The pull cue fires from `RefreshControl.onRefresh`, after the system accepts the pull. This provides one firm release cue without vibrating during ordinary scrolling. A completed manual sync gives a separate success cue. Automatic background refreshes stay silent. The app does not play a cue when a selected value is tapped again.

The copied impact and notification calls use Expo's `impactAsync` and `notificationAsync` on both platforms. [Expo SDK 57 haptics documentation](https://docs.expo.dev/versions/v57.0.0/sdk/haptics/) recommends considering `performAndroidHapticsAsync` for Android in future tuning.
