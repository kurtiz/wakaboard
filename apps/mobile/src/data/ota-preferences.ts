import * as Network from "expo-network";
import Storage from "expo-sqlite/kv-store";

const MOBILE_DATA_KEY = "ota-use-mobile-data";

export function isOtaMobileDataEnabled(): boolean {
  try {
    return Storage.getItemSync(MOBILE_DATA_KEY) !== "false";
  } catch {
    return true;
  }
}

export async function setOtaMobileDataEnabled(enabled: boolean): Promise<void> {
  await Storage.setItem(MOBILE_DATA_KEY, String(enabled));
}

export function isOtaNetworkAllowed(type: Network.NetworkStateType | undefined, allowMobileData: boolean): boolean {
  return allowMobileData || type === Network.NetworkStateType.WIFI || type === Network.NetworkStateType.ETHERNET;
}

export async function canCheckForOtaUpdate(): Promise<boolean> {
  if (isOtaMobileDataEnabled()) return true;
  try {
    const state = await Network.getNetworkStateAsync();
    return state.isConnected !== false && isOtaNetworkAllowed(state.type, false);
  } catch {
    return false;
  }
}
