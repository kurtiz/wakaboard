import { formatDuration, goalProgress, localDateKey } from "@wakaboard/core";
import { Link } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from "react-native";
import { BreakdownRows, DashboardCard } from "../../../components/dashboard-card";
import { GoalProgress } from "../../../components/goal-progress";
import { WeeklyChart } from "../../../components/weekly-chart";
import { NativeAction } from "../../../components/native-action";
import { useDashboard } from "../../../data/dashboard-context";
import { useLeaderboards } from "../../../data/leaderboard-context";
import { authClient, wakatimeConnectionAvailable } from "../../../data/wakatime-client";
import { usePalette } from "../../../theme";

export default function HomeScreen() {
  const palette = usePalette();
  const { summaries, goalSeconds, loading, error, syncing, syncError, addSample, refresh, syncWakaTime } = useDashboard();
  const { refresh: refreshLeaderboards } = useLeaderboards();
  const today = useMemo(() => new Date(), []);
  const summary = summaries.find((day) => day.date === localDateKey(today));
  const sample = summaries.some((day) => day.source === "sample");
  const total = summary?.totalSeconds ?? 0;
  const progress = goalProgress(total, goalSeconds);
  const remaining = Math.max(0, goalSeconds - total);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    const key = localDateKey(date);
    return { key, label: date.toLocaleDateString(undefined, { weekday: "short" }), seconds: summaries.find((day) => day.date === key)?.totalSeconds ?? 0 };
  });
  const weekTotal = days.reduce((sum, day) => sum + day.seconds, 0);

  async function refreshActivity() {
    if (wakatimeConnectionAvailable && await authClient.getCookie()) {
      await Promise.all([syncWakaTime(), refreshLeaderboards()]);
    } else {
      await refresh();
    }
  }

  return (
    <ScrollView
      className="flex-1"
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl refreshing={syncing} onRefresh={() => void refreshActivity()} tintColor={palette.accent} />}
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
        <Text accessibilityRole="alert" style={{ color: palette.error, fontSize: 14 }}>
          {syncError}
        </Text>
      )}

      {loading ? (
        <ActivityIndicator color={palette.accent} style={{ paddingVertical: 72 }} />
      ) : error ? (
        <DashboardCard title="Local data unavailable">
          <Text selectable style={{ color: palette.muted, lineHeight: 23 }}>{error}</Text>
          <NativeAction label="Try again" onPress={() => void refresh()} />
        </DashboardCard>
      ) : summaries.length === 0 ? (
        <>
          <DashboardCard title="Make your coding visible">
            <Text style={{ color: palette.muted, fontSize: 16, lineHeight: 24 }}>
              Your WakaTime activity will appear here after a sync. Explore the dashboard with
              clearly marked sample data in the meantime.
            </Text>
            {wakatimeConnectionAvailable && (
              <Link href="/(tabs)/(settings)" style={{ color: palette.accent, fontSize: 15, fontWeight: "700" }}>
                Connect WakaTime in Settings
              </Link>
            )}
            <NativeAction label="Explore sample data" onPress={() => void addSample()} />
          </DashboardCard>
          <StandingCard />
        </>
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
              <Text style={{ color: palette.heroKicker, fontSize: 14, fontWeight: "700" }}>
                CODING TODAY
              </Text>
              <Text
                selectable
                style={{ color: palette.onPrimary, fontSize: 53, fontWeight: "800", fontVariant: ["tabular-nums"], letterSpacing: -2 }}
              >
                {formatDuration(total)}
              </Text>
              <Text style={{ color: palette.heroMuted, fontSize: 15 }}>
                {total === 0 ? "No activity recorded for today yet" : "Every focused moment adds up"}
              </Text>
            </View>

            <View className="gap-[11px]">
              <View className="flex-row justify-between">
                <Text style={{ color: palette.heroDetail, fontSize: 15, fontWeight: "600" }}>
                  Daily goal
                </Text>
                <Text
                  selectable
                  style={{ color: palette.heroDetail, fontSize: 15, fontVariant: ["tabular-nums"] }}
                >
                  {Math.round(progress * 100)}%
                </Text>
              </View>
              <GoalProgress progress={progress} />
              <Text style={{ color: palette.heroMuted, fontSize: 13 }}>
                {remaining > 0 ? `${formatDuration(remaining)} to reach ${formatDuration(goalSeconds)}` : "Goal reached for today"}
              </Text>
            </View>
          </View>

          <StandingCard />

          <DashboardCard title="This week">
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
              <Text selectable style={{ color: palette.text, fontSize: 23, fontWeight: "700", fontVariant: ["tabular-nums"] }}>{formatDuration(weekTotal)}</Text>
              <Link href="/(tabs)/(insights)" style={{ color: palette.accent, fontSize: 13, fontWeight: "700" }}>Analytics →</Link>
            </View>
            <WeeklyChart days={days} />
          </DashboardCard>

          <View className="flex-row justify-between px-[3px]">
            <Text style={{ color: palette.muted, fontSize: 14 }}>
              {sample ? "Previewing sample activity" : "Saved on this device"}
            </Text>
            <Link href="/(tabs)/(settings)" style={{ color: palette.accent, fontSize: 14, fontWeight: "700" }}>
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

function StandingCard() {
  const palette = usePalette();
  const { boards, loading, error } = useLeaderboards();
  return (
    <DashboardCard title="Your standing">
      <Text style={{ color: palette.muted, fontSize: 13, lineHeight: 20 }}>
        Public WakaTime ranks refresh periodically. Your activity here may be more recent.
      </Text>
      <View style={{ flexDirection: "row", gap: 10 }}>
        {(["country", "global"] as const).map((scope) => (
          <View key={scope} style={{ flex: 1, gap: 6, borderRadius: 18, backgroundColor: palette.background, padding: 15 }}>
            <Text style={{ color: palette.muted, fontSize: 12, fontWeight: "700", textTransform: "uppercase" }}>{scope === "country" ? "Your country" : "Worldwide"}</Text>
            <Text selectable style={{ color: palette.text, fontSize: 27, fontWeight: "800", fontVariant: ["tabular-nums"] }}>
              {boards[scope] ? boards[scope].rank === null ? "—" : `#${boards[scope].rank}` : loading ? "…" : "—"}
            </Text>
            <Text style={{ color: palette.muted, fontSize: 12 }}>
              {boards[scope]?.rank != null ? "This week" : boards[scope] ? "Not ranked" : "Unavailable"}
            </Text>
          </View>
        ))}
      </View>
      {error ? <Text style={{ color: palette.muted, fontSize: 12 }}>{error}</Text> : null}
      <Link href="/(tabs)/(leaderboard)" style={{ color: palette.accent, fontSize: 14, fontWeight: "700", paddingVertical: 8 }}>
        Explore leaderboards →
      </Link>
    </DashboardCard>
  );
}
