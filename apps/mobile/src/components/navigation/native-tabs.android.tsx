import { NativeTabs } from "expo-router/unstable-native-tabs";
import { HapticPreset } from "../../constants/haptics";
import { usePalette } from "../../theme";

export function NativeTabNavigation() {
  const palette = usePalette();
  const dark = palette.scheme === "dark";
  return <NativeTabs tintColor={palette.primary} backgroundColor={palette.card} indicatorColor={palette.mint} rippleColor={palette.secondaryRipple} labelVisibilityMode="labeled" screenListeners={{ tabPress: (event) => { if (!event.data.isPrevented) void HapticPreset.selection(); } }}>
    <NativeTabs.Trigger name="(home)">
      <NativeTabs.Trigger.Icon src={dark
        ? { default: require("../../../assets/icons/native-tabs/home-regular-dark.png"), selected: require("../../../assets/icons/native-tabs/home-fill-dark.png") }
        : { default: require("../../../assets/icons/native-tabs/home-regular-light.png"), selected: require("../../../assets/icons/native-tabs/home-fill-light.png") }} />
      <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
    <NativeTabs.Trigger name="(insights)">
      <NativeTabs.Trigger.Icon src={dark
        ? { default: require("../../../assets/icons/native-tabs/insights-regular-dark.png"), selected: require("../../../assets/icons/native-tabs/insights-fill-dark.png") }
        : { default: require("../../../assets/icons/native-tabs/insights-regular-light.png"), selected: require("../../../assets/icons/native-tabs/insights-fill-light.png") }} />
      <NativeTabs.Trigger.Label>Insights</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
    <NativeTabs.Trigger name="(leaderboard)">
      <NativeTabs.Trigger.Icon src={dark
        ? { default: require("../../../assets/icons/native-tabs/leaders-regular-dark.png"), selected: require("../../../assets/icons/native-tabs/leaders-fill-dark.png") }
        : { default: require("../../../assets/icons/native-tabs/leaders-regular-light.png"), selected: require("../../../assets/icons/native-tabs/leaders-fill-light.png") }} />
      <NativeTabs.Trigger.Label>Leaders</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
    <NativeTabs.Trigger name="(settings)">
      <NativeTabs.Trigger.Icon src={dark
        ? { default: require("../../../assets/icons/native-tabs/settings-regular-dark.png"), selected: require("../../../assets/icons/native-tabs/settings-fill-dark.png") }
        : { default: require("../../../assets/icons/native-tabs/settings-regular-light.png"), selected: require("../../../assets/icons/native-tabs/settings-fill-light.png") }} />
      <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
  </NativeTabs>;
}
