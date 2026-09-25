import Storage from "expo-sqlite/kv-store";

const AUTO_SYNC_KEY = "sync-on-open";

export function isAutoSyncEnabled(): boolean {
  try {
    return Storage.getItemSync(AUTO_SYNC_KEY) !== "false";
  } catch {
    return true;
  }
}

export async function setAutoSyncEnabled(enabled: boolean): Promise<void> {
  await Storage.setItem(AUTO_SYNC_KEY, String(enabled));
}
