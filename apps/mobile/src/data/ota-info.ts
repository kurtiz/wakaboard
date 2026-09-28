import { HotUpdater } from "@hot-updater/react-native";

export function getInstalledOtaInfo(): { id: string | null; label: string; channel: string | null } {
  if (__DEV__ || !process.env.EXPO_PUBLIC_HOT_UPDATER_URL) return { id: null, label: "Unavailable", channel: null };
  try {
    const id = HotUpdater.getBundleId();
    return { id, label: id === HotUpdater.getMinBundleId() ? "Built-in" : `OTA ${id.slice(0, 8)}`, channel: HotUpdater.getChannel() };
  } catch {
    return { id: null, label: "Unavailable", channel: null };
  }
}
