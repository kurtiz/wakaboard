import * as Haptics from "expo-haptics";

let _enabled = true;

export function setHapticsGloballyEnabled(enabled: boolean) {
  _enabled = enabled;
}

export function isHapticsGloballyEnabled(): boolean {
  return _enabled;
}

export const HapticPreset = {
  back: () => _enabled ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) : Promise.resolve(),
  next: () => _enabled ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium) : Promise.resolve(),
  confirm: () => _enabled ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success) : Promise.resolve(),
  error: () => _enabled ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error) : Promise.resolve(),
  warning: () => _enabled ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning) : Promise.resolve(),
  soft: () => _enabled ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft) : Promise.resolve(),
  /** A value ticked past a step — a scrub grabbing, a detent catching. */
  selection: () => _enabled ? Haptics.selectionAsync() : Promise.resolve(),
  heavy: () => _enabled ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy) : Promise.resolve(),
} as const;

export type HapticPresetKey = keyof typeof HapticPreset;
