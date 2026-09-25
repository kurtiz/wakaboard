import { useSegments } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { StandingAccessory } from "../leaderboard/standing-accessory.ios";
import { usePalette } from "../../theme";

export function NativeTabNavigation() {
  const palette = usePalette();
  const segments = useSegments();
  const leaderboardOpen = segments.includes("(leaderboard)");
  return <NativeTabs tintColor={palette.primary} minimizeBehavior="never">
    {leaderboardOpen ? <NativeTabs.BottomAccessory><StandingAccessory /></NativeTabs.BottomAccessory> : null}
    <NativeTabs.Trigger name="(home)">
      <NativeTabs.Trigger.Icon sf={{ default: "house", selected: "house.fill" }} />
      <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
    <NativeTabs.Trigger name="(insights)">
      <NativeTabs.Trigger.Icon sf={{ default: "chart.bar", selected: "chart.bar.fill" }} />
      <NativeTabs.Trigger.Label>Insights</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
    <NativeTabs.Trigger name="(leaderboard)">
      <NativeTabs.Trigger.Icon sf={{ default: "trophy", selected: "trophy.fill" }} />
      <NativeTabs.Trigger.Label>Leaders</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
    <NativeTabs.Trigger name="(settings)">
      <NativeTabs.Trigger.Icon sf={{ default: "gearshape", selected: "gearshape.fill" }} />
      <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
  </NativeTabs>;
}
