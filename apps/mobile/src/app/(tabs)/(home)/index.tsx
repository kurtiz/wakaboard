import { formatDuration, goalProgress, localDateKey } from "@wakaboard/core";
import { Link } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from "react-native";
import { BreakdownRows, DashboardCard } from "../../../components/dashboard-card";
import { GoalProgress } from "../../../components/goal-progress";
import { NativeAction } from "../../../components/native-action";
import { useDashboard } from "../../../data/dashboard-context";
import { authClient, wakatimeConnectionAvailable } from "../../../data/wakatime-client";
import { accent, usePalette } from "../../../theme";

export default function HomeScreen() {
  const palette = usePalette();
  const { summaries, goalSeconds, loading, error, syncing, syncError, addSample, refresh, syncWakaTime } = useDashboard();
  const today = useMemo(() => new Date(), []);
  const summary = summaries.find((day) => day.date === localDateKey(today));
  const sample = summaries.some((day) => day.source === "sample");
  const total = summary?.totalSeconds ?? 0;
  const progress = goalProgress(total, goalSeconds);
  const remaining = Math.max(0, goalSeconds - total);

  async function refreshActivity() {
    if (wakatimeConnectionAvailable && await authClient.getCookie()) {
      await syncWakaTime();
    } else {
      await refresh();
    }
  }

  return (
    <ScrollView
      className="flex-1"
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl refreshing={syncing} onRefresh={() => void refreshActivity()} tintColor={accent} />}
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={{ gap: 18, padding: 20, paddingBottom: 36 }}
    >
      <View className="gap-[5px]">
        <Text style={{ color: palette.muted, fontSize: 14, fontWeight: "600" }}>
          {today.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </Text>
        <Text style={{ color: palette.text, fontSize: 17 }}>
          A clear view of your coding day.
        </Text>
      </View>

      {syncError && (
        <Text accessibilityRole="alert" style={{ color: "#B33A3A", fontSize: 14 }}>
          {syncError}
        </Text>
      )}

      {loading ? (
        <ActivityIndicator color={accent} style={{ paddingVertical: 72 }} />
      ) : error ? (
        <DashboardCard title="Local data unavailable">
          <Text selectable style={{ color: palette.muted, lineHeight: 23 }}>{error}</Text>
          <NativeAction label="Try again" onPress={() => void refresh()} />
        </DashboardCard>
      ) : summaries.length === 0 ? (
        <DashboardCard title="Make your coding visible">
          <Text style={{ color: palette.muted, fontSize: 16, lineHeight: 24 }}>
            Your WakaTime activity will appear here after a sync. Explore the dashboard with
            clearly marked sample data in the meantime.
          </Text>
          {wakatimeConnectionAvailable && (
            <Link href="/(tabs)/(settings)" style={{ color: accent, fontSize: 15, fontWeight: "700" }}>
              Connect WakaTime in Settings
            </Link>
          )}
          <NativeAction label="Explore sample data" onPress={() => void addSample()} />
        </DashboardCard>
      ) : (
        <>
          {sample && (
            <View
              style={{
                alignSelf: "flex-start",
                backgroundColor: palette.track,
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
            >
              <Text style={{ color: palette.text, fontSize: 12, fontWeight: "700" }}>
                SAMPLE ACTIVITY
              </Text>
            </View>
          )}

          <View
            className="gap-[26px] rounded-[28px] p-6"
            style={{
              backgroundColor: palette.hero,
              borderCurve: "continuous",
            }}
          >
            <View className="gap-1.5">
              <Text style={{ color: "#A8D9BD", fontSize: 14, fontWeight: "700" }}>
                CODING TODAY
              </Text>
              <Text
                selectable
                style={{ color: "#FFFFFF", fontSize: 53, fontWeight: "800", fontVariant: ["tabular-nums"], letterSpacing: -2 }}
              >
                {formatDuration(total)}
              </Text>
              <Text style={{ color: "#B7D6C5", fontSize: 15 }}>
                {total === 0 ? "No activity recorded for today yet" : "Every focused moment adds up"}
              </Text>
            </View>

            <View className="gap-[11px]">
              <View className="flex-row justify-between">
                <Text style={{ color: "#E5F5EA", fontSize: 15, fontWeight: "600" }}>
                  Daily goal
                </Text>
                <Text
                  selectable
                  style={{ color: "#E5F5EA", fontSize: 15, fontVariant: ["tabular-nums"] }}
                >
                  {Math.round(progress * 100)}%
                </Text>
              </View>
              <GoalProgress progress={progress} />
              <Text style={{ color: "#B7D6C5", fontSize: 13 }}>
                {remaining > 0 ? `${formatDuration(remaining)} to reach ${formatDuration(goalSeconds)}` : "Goal reached for today"}
              </Text>
            </View>
          </View>

          <View className="flex-row justify-between px-[3px]">
            <Text style={{ color: palette.muted, fontSize: 14 }}>
              {sample ? "Previewing sample activity" : "Saved on this device"}
            </Text>
            <Link href="/(tabs)/(settings)" style={{ color: accent, fontSize: 14, fontWeight: "700" }}>
              Edit goal
            </Link>
          </View>

          {summary && (
            <>
              <DashboardCard title="Projects">
                <BreakdownRows rows={summary.projects} />
              </DashboardCard>
              <DashboardCard title="Languages">
                <BreakdownRows rows={summary.languages} />
              </DashboardCard>
              <DashboardCard title="Editors">
                <BreakdownRows rows={summary.editors} />
              </DashboardCard>
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}
