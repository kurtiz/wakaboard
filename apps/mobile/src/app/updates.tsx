import { HotUpdater, useHotUpdaterStore } from "@hot-updater/react-native";
import * as Application from "expo-application";
import * as Network from "expo-network";
import { ArrowsClockwiseIcon } from "phosphor-react-native/src/icons/ArrowsClockwise";
import { CloudArrowDownIcon } from "phosphor-react-native/src/icons/CloudArrowDown";
import { useState } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { AndroidLargeTitle, AndroidPageFrame, useAndroidPageScroll } from "../components/navigation/android-page-header";
import { SettingsButton, SettingsCard } from "../components/settings/settings-card";
import { SyncSwitch } from "../components/settings/sync-switch";
import { Text } from "../components/ui/app-text";
import { getInstalledOtaInfo } from "../data/ota-info";
import { canCheckForOtaUpdate, isOtaMobileDataEnabled, isOtaNetworkAllowed, setOtaMobileDataEnabled } from "../data/ota-preferences";
import { usePalette } from "../theme";

type CheckStatus = "idle" | "checking" | "downloading" | "up-to-date" | "waiting-for-wifi" | "error";

export default function UpdatesScreen() {
  const palette = usePalette();
  const { offset, onScroll } = useAndroidPageScroll();
  const network = Network.useNetworkState();
  const { progress, isUpdateDownloaded } = useHotUpdaterStore();
  const [allowMobileData, setAllowMobileData] = useState(isOtaMobileDataEnabled);
  const [savingPreference, setSavingPreference] = useState(false);
  const [status, setStatus] = useState<CheckStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const installed = getInstalledOtaInfo();
  const available = installed.id !== null;
  const waitingForWifi = !allowMobileData && (network.isConnected === false || !isOtaNetworkAllowed(network.type, false));
  const downloading = status === "downloading" || (progress > 0 && progress < 1);
  const statusLabel = !available ? "Available in production builds" : isUpdateDownloaded ? "Ready to restart" : waitingForWifi || status === "waiting-for-wifi" ? "Connect to Wi-Fi to check" : downloading ? "Downloading update" : status === "checking" ? "Checking for updates" : status === "up-to-date" ? "Up to date" : status === "error" ? "Update check failed" : "Checks automatically when the app opens";

  async function changeMobileData(enabled: boolean) {
    setSavingPreference(true);
    setError(null);
    try {
      await setOtaMobileDataEnabled(enabled);
      setAllowMobileData(enabled);
      setStatus("idle");
    } catch {
      setError("Could not save the mobile data setting.");
    } finally {
      setSavingPreference(false);
    }
  }

  async function checkNow() {
    if (!available || status === "checking" || status === "downloading") return;
    setError(null);
    setStatus("checking");
    try {
      if (!(await canCheckForOtaUpdate())) {
        setStatus("waiting-for-wifi");
        return;
      }
      const update = await HotUpdater.checkForUpdate({ updateStrategy: "appVersion" });
      if (!update) {
        setStatus("up-to-date");
        return;
      }
      setStatus("downloading");
      if (!(await update.updateBundle())) throw new Error("Update download could not be completed.");
      setStatus("idle");
      if (update.shouldForceUpdate) await HotUpdater.reload();
    } catch (cause) {
      setStatus("error");
      setError(cause instanceof Error ? cause.message : "Could not check for updates.");
    }
  }

  async function restartNow() {
    try {
      await HotUpdater.reload();
    } catch {
      setError("Could not restart the app. Close and reopen it to apply the update.");
    }
  }

  const content = <Animated.ScrollView
    contentInsetAdjustmentBehavior="automatic"
    onScroll={process.env.EXPO_OS === "android" ? onScroll : undefined}
    scrollEventThrottle={16}
    style={{ flex: 1, backgroundColor: palette.background }}
    contentContainerStyle={{ alignItems: "center", paddingHorizontal: 16, paddingBottom: 48 }}>
    <View style={{ width: "100%", maxWidth: 560, gap: 14 }}>
      {process.env.EXPO_OS === "android" && <AndroidLargeTitle title="App updates" offset={offset} back />}
      <Text style={{ color: palette.muted, fontSize: 13, lineHeight: 20 }}>WakaBoard can receive app improvements over the air without installing a new app build.</Text>

      <SettingsCard title="Installed version" icon={<CloudArrowDownIcon size={20} weight="duotone" color={palette.primary} />}>
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
            <Text style={{ color: palette.muted, fontSize: 13 }}>App version</Text>
            <Text selectable style={{ color: palette.text, fontSize: 13, fontWeight: "700" }}>{Application.nativeApplicationVersion ?? "—"}{Application.nativeBuildVersion != null ? ` (${Application.nativeBuildVersion})` : ""}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
            <Text style={{ color: palette.muted, fontSize: 13 }}>Installed update</Text>
            <Text style={{ color: palette.primary, fontSize: 13, fontWeight: "700" }}>{installed.label}</Text>
          </View>
          {installed.channel && <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
            <Text style={{ color: palette.muted, fontSize: 13 }}>Channel</Text>
            <Text style={{ color: palette.text, fontSize: 13, fontWeight: "700", textTransform: "capitalize" }}>{installed.channel}</Text>
          </View>}
          {installed.id && <Text selectable style={{ color: palette.muted, fontSize: 11, lineHeight: 17 }}>Update ID: {installed.id}</Text>}
          <Text style={{ color: palette.muted, fontSize: 12, lineHeight: 18 }}>Each OTA has its own ID. It does not change the app version or build number.</Text>
        </View>
      </SettingsCard>

      <SettingsCard title="Update status" icon={<ArrowsClockwiseIcon size={20} weight="duotone" color={palette.primary} />}>
        <Text accessibilityLiveRegion="polite" style={{ color: palette.text, fontSize: 14, fontWeight: "700" }}>{statusLabel}</Text>
        {downloading && <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }} style={{ height: 8, borderRadius: 4, backgroundColor: palette.homeSurface, overflow: "hidden" }}><View style={{ width: `${Math.round(progress * 100)}%`, height: "100%", backgroundColor: palette.primary }} /></View>}
        {error && <Text accessibilityRole="alert" style={{ color: palette.error, fontSize: 12 }}>{error}</Text>}
        {isUpdateDownloaded
          ? <SettingsButton label="Restart to update" onPress={() => void restartNow()} />
          : <SettingsButton label={status === "checking" ? "Checking…" : downloading ? "Downloading…" : "Check now"} disabled={!available || waitingForWifi || status === "checking" || downloading} onPress={() => void checkNow()} />}
        <Text style={{ color: palette.muted, fontSize: 12, lineHeight: 18 }}>Updates download in the background and normally apply the next time you open WakaBoard.</Text>
      </SettingsCard>

      <SettingsCard title="Network preference" icon={<CloudArrowDownIcon size={20} weight="duotone" color={palette.primary} />}>
        <View style={{ flexDirection: "row", alignItems: "center", minHeight: 52, gap: 12 }}>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={{ color: palette.text, fontSize: 14, fontWeight: "700" }}>Use mobile data for updates</Text>
            <Text style={{ color: palette.muted, fontSize: 12 }}>When off, updates check only on Wi-Fi.</Text>
          </View>
          <SyncSwitch value={allowMobileData} disabled={savingPreference} onValueChange={(enabled) => void changeMobileData(enabled)} testID="ota-mobile-data-switch" />
        </View>
        <Text style={{ color: palette.muted, fontSize: 12, lineHeight: 18 }}>After reconnecting to Wi-Fi, reopen WakaBoard or tap Check now. A download already in progress may finish after this setting changes.</Text>
      </SettingsCard>
    </View>
  </Animated.ScrollView>;

  return process.env.EXPO_OS === "android" ? <AndroidPageFrame title="App updates" offset={offset} back>{content}</AndroidPageFrame> : content;
}
