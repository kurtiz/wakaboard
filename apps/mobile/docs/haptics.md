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

These are available building blocks. WakaBoard actions are not assigned to presets yet; that mapping will be decided separately. The copied impact and notification calls use Expo's `impactAsync` and `notificationAsync` on both platforms. [Expo SDK 57 haptics documentation](https://docs.expo.dev/versions/v57.0.0/sdk/haptics/) recommends considering `performAndroidHapticsAsync` for Android when the action mapping is designed.
