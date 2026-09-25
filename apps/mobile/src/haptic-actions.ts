import { HapticPreset } from "./constants/haptics";

export type RefreshOutcome = "success" | "partial" | "error" | "local";

/** The native refresh control calls this only after its pull gesture is accepted. */
export async function runManualRefresh(
  refresh: () => Promise<RefreshOutcome>,
  fromPull = false,
): Promise<void> {
  if (fromPull) void HapticPreset.heavy();
  try {
    const outcome = await refresh();
    if (outcome === "success") void HapticPreset.confirm();
    else if (outcome === "partial") void HapticPreset.warning();
    else if (outcome === "error") void HapticPreset.error();
  } catch {
    void HapticPreset.error();
  }
}
