import { formatDuration, localDateKey, type DailySummary } from "@wakaboard/core";
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import type { Leaderboard, LeaderboardScope } from "../../data/leaderboards";
import type { AnalyticsRange } from "../insights/analytics-data";
import { buildAnalytics } from "../insights/analytics-data";
import { ShareBrand } from "./share-brand";
import { DashedLine } from "../ui/dashed-line";

export type ShareStyle = "editorial" | "night" | "rhythm";
export type ShareContent =
  | { kind: "daily"; summary: DailySummary; showProject: boolean }
  | { kind: "analytics"; summaries: DailySummary[]; range: AnalyticsRange; today: Date; showProject: boolean }
  | { kind: "leaderboard"; board: Leaderboard; scope: LeaderboardScope; mode: "podium" | "personal" };

type Props = { content: ShareContent; styleName: ShareStyle; width: number; name: string | null; showName: boolean };
const themes = {
  editorial: { bg: "#FAF9F3", ink: "#122B24", muted: "#536F62", accent: "#0D5C4D", panel: "#E9F1E8", line: "#CBDACD", highlight: "#FEA619" },
  night: { bg: "#122B24", ink: "#F7FBF6", muted: "#B7D6C5", accent: "#73D5A2", panel: "#193D31", line: "#4B725F", highlight: "#FEA619" },
  rhythm: { bg: "#FEA619", ink: "#122B24", muted: "#36503F", accent: "#122B24", panel: "#F8E7B7", line: "#B98724", highlight: "#0D5C4D" },
};

function dateLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" });
}

function Frame({ children, styleName, width, name, showName, source }: { children: ReactNode; styleName: ShareStyle; width: number; name: string | null; showName: boolean; source: string }) {
  const s = width / 360;
  const c = themes[styleName];
  return <View style={{ width, height: 450 * s, backgroundColor: c.bg, overflow: "hidden", padding: 26 * s }}>
    {styleName === "night" ? <View style={{ position: "absolute", width: 250 * s, height: 250 * s, borderRadius: 125 * s, borderWidth: 1 * s, borderColor: c.line, top: -100 * s, right: -90 * s }} /> : null}
    {styleName === "rhythm" ? <View style={{ position: "absolute", width: 340 * s, height: 340 * s, borderRadius: 170 * s, borderWidth: 2 * s, borderColor: c.line, top: -165 * s, right: -140 * s }} /> : null}
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 25 * s }}>
      <ShareBrand scale={s} light={styleName === "night"} />
      <Text style={{ fontFamily: "Outfit", fontWeight: "800", fontSize: 8 * s, color: c.muted }}>CODING RECORD</Text>
    </View>
    {children}
    <View style={{ position: "absolute", left: 26 * s, right: 26 * s, bottom: 17 * s, borderTopWidth: 1 * s, borderColor: c.line, paddingTop: 8 * s, flexDirection: "row", justifyContent: "space-between", gap: 8 * s }}>
      <Text numberOfLines={1} style={{ flex: 1, fontFamily: "Outfit", fontWeight: "800", fontSize: 8 * s, color: c.muted }}>{showName && name ? name.toUpperCase() : "MY CODING RECORD"}</Text>
      <Text style={{ fontFamily: "Outfit", fontWeight: "800", fontSize: 8 * s, color: c.muted }}>{source}</Text>
    </View>
  </View>;
}

function MiniBars({ values, labels, styleName, scale, height = 80 }: { values: number[]; labels: string[]; styleName: ShareStyle; scale: number; height?: number }) {
  const c = themes[styleName];
  const max = Math.max(1, ...values);
  const plot = height - 18;
  return <View style={{ height: height * scale, marginTop: 12 * scale }}>
    {[1, 0.5].map((part) => <View key={part} style={{ position: "absolute", top: (1 - part) * plot * scale, left: 0, right: 0, flexDirection: "row", alignItems: "center" }}>
      <Text numberOfLines={1} adjustsFontSizeToFit style={{ width: 39 * scale, paddingRight: 4 * scale, textAlign: "right", fontFamily: "Outfit", fontWeight: "800", fontSize: 7 * scale, color: c.muted }}>{formatDuration(max * part)}</Text>
      <DashedLine color={c.line} thickness={Math.max(1, scale)} dash={4 * scale} style={{ flex: 1 }} />
    </View>)}
    <View style={{ position: "absolute", left: 39 * scale, right: 0, bottom: 0, height: height * scale, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>{values.map((value, index) => <View key={index} style={{ width: `${100 / values.length}%`, alignItems: "center", justifyContent: "flex-end", height: height * scale }}>
      <View style={{ width: Math.min(25, 210 / values.length) * scale, height: Math.max(3, value / max * plot) * scale, backgroundColor: index === values.indexOf(max) ? c.highlight : c.accent, borderTopLeftRadius: 5 * scale, borderTopRightRadius: 5 * scale }} />
      <Text numberOfLines={1} style={{ fontFamily: "Outfit", fontWeight: "800", fontSize: 8 * scale, color: c.muted, height: 17 * scale }}>{labels[index]}</Text>
    </View>)}</View>
  </View>;
}

function Stat({ label, value, c, scale }: { label: string; value: string; c: typeof themes.editorial; scale: number }) {
  return <View style={{ flex: 1, minWidth: 0, borderTopWidth: 1 * scale, borderColor: c.line, paddingTop: 7 * scale }}>
    <Text style={{ fontFamily: "Outfit", fontWeight: "800", fontSize: 8 * scale, letterSpacing: .5 * scale, color: c.muted }}>{label}</Text>
    <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.6} style={{ fontFamily: "Outfit", fontWeight: "800", fontSize: 13 * scale, marginTop: 4 * scale, color: c.ink }}>{value}</Text>
  </View>;
}

export function StatShareArt({ content, styleName, width, name, showName }: Props) {
  const s = width / 360;
  const c = themes[styleName];
  if (content.kind === "daily") {
    const day = content.summary;
    const languages = [...day.languages].sort((a, b) => b.seconds - a.seconds);
    const projects = [...day.projects].sort((a, b) => b.seconds - a.seconds);
    const top = languages.slice(0, 3);
    const max = Math.max(1, ...top.map((row) => row.seconds));
    return <Frame styleName={styleName} width={width} name={name} showName={showName} source="WAKATIME DATA">
      <Text style={{ fontFamily: "Outfit", fontWeight: "800", letterSpacing: 1 * s, fontSize: 10 * s, color: c.accent }}>{dateLabel(day.date).toUpperCase()}</Text>
      <Text style={{ fontFamily: "Nunito", fontWeight: "800", fontSize: 33 * s, color: c.ink, marginTop: 3 * s }}>My coding day</Text>
      <Text numberOfLines={1} adjustsFontSizeToFit style={{ fontFamily: "Outfit", fontWeight: "800", fontSize: 58 * s, color: c.ink, marginTop: 5 * s }}>{formatDuration(day.totalSeconds)}</Text>
      <Text style={{ fontFamily: "Nunito", fontWeight: "700", fontSize: 11 * s, color: c.muted, marginTop: 1 * s }}>Recorded coding time</Text>
      <View style={{ marginTop: 24 * s, padding: 15 * s, borderRadius: 12 * s, backgroundColor: c.panel, minHeight: 114 * s }}>
        <Text style={{ fontFamily: "Outfit", fontWeight: "800", letterSpacing: 1 * s, fontSize: 9 * s, color: c.muted, marginBottom: 11 * s }}>LANGUAGE MIX</Text>
        {top.length ? top.map((row) => <View key={row.name} style={{ flexDirection: "row", alignItems: "center", gap: 7 * s, marginBottom: 8 * s }}>
          <Text numberOfLines={1} style={{ fontFamily: "Outfit", fontWeight: "800", width: 82 * s, fontSize: 10 * s, color: c.ink }}>{row.name}</Text>
          <View style={{ flex: 1, height: 6 * s, borderRadius: 3 * s, backgroundColor: c.line }}><View style={{ width: `${Math.max(2, row.seconds / max * 100)}%`, height: 6 * s, borderRadius: 3 * s, backgroundColor: c.accent }} /></View>
          <Text style={{ fontFamily: "Outfit", fontWeight: "800", width: 48 * s, textAlign: "right", fontSize: 9 * s, color: c.ink }}>{formatDuration(row.seconds)}</Text>
        </View>) : <Text style={{ fontFamily: "Nunito", fontWeight: "700", color: c.muted, fontSize: 11 * s }}>No language breakdown saved</Text>}
      </View>
      <View style={{ flexDirection: "row", gap: 10 * s, marginTop: 20 * s }}>
        <Stat label="LANGUAGES" value={String(day.languages.length)} c={c} scale={s} />
        <Stat label="PROJECTS" value={String(day.projects.length)} c={c} scale={s} />
        <Stat label="TOP LANGUAGE" value={top[0]?.name ?? "Unavailable"} c={c} scale={s} />
      </View>
      {content.showProject && projects[0] ? <Text numberOfLines={1} style={{ fontFamily: "Nunito", fontWeight: "800", fontSize: 10 * s, color: c.muted, marginTop: 12 * s }}>Top project: {projects[0].name}</Text> : null}
    </Frame>;
  }
  if (content.kind === "analytics") {
    const data = buildAnalytics(content.summaries, content.range, content.today);
    const start = new Date(content.today);
    start.setDate(start.getDate() - data.days + 1);
    const period = `${dateLabel(localDateKey(start))} to ${dateLabel(localDateKey(content.today))}`;
    return <Frame styleName={styleName} width={width} name={name} showName={showName} source="WAKATIME DATA">
      <Text numberOfLines={1} style={{ fontFamily: "Outfit", fontWeight: "800", letterSpacing: .5 * s, fontSize: 9 * s, color: c.accent }}>{period.toUpperCase()}</Text>
      <Text style={{ fontFamily: "Nunito", fontWeight: "800", fontSize: 32 * s, color: c.ink, marginTop: 4 * s }}>My coding report</Text>
      <Text numberOfLines={1} adjustsFontSizeToFit style={{ fontFamily: "Outfit", fontWeight: "800", fontSize: 54 * s, color: c.ink, marginTop: 5 * s }}>{formatDuration(data.total)}</Text>
      <Text style={{ fontFamily: "Nunito", fontWeight: "700", fontSize: 11 * s, color: c.muted }}>Total coding time across {data.days} days</Text>
      <View style={{ marginTop: 20 * s, padding: 14 * s, borderRadius: 12 * s, backgroundColor: c.panel }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}><Text style={{ fontFamily: "Outfit", fontWeight: "800", fontSize: 9 * s, color: c.muted }}>CODING CADENCE</Text><Text style={{ fontFamily: "Outfit", fontWeight: "800", fontSize: 8 * s, color: c.muted }}>PEAK {formatDuration(Math.max(...data.buckets.map((bucket) => bucket.seconds)))}</Text></View>
        <MiniBars values={data.buckets.map((bucket) => bucket.seconds)} labels={data.buckets.map((bucket) => bucket.label.slice(0, 1))} styleName={styleName} scale={s} />
      </View>
      <View style={{ flexDirection: "row", gap: 10 * s, marginTop: 19 * s }}>
        <Stat label="ACTIVE DAYS" value={`${data.activeDays} of ${data.days}`} c={c} scale={s} />
        <Stat label="DAILY PACE" value={formatDuration(data.total / data.days)} c={c} scale={s} />
        <Stat label="PEAK STREAK" value={`${data.peakStreak} days`} c={c} scale={s} />
      </View>
      {content.showProject && data.projects[0] ? <Text numberOfLines={1} style={{ fontFamily: "Nunito", fontWeight: "800", fontSize: 10 * s, color: c.muted, marginTop: 12 * s }}>Top project: {data.projects[0].name}</Text> : null}
    </Frame>;
  }
  const { board, scope, mode } = content;
  const scopeLabel = scope === "global" ? "GLOBAL" : (board.countryCode ?? "COUNTRY");
  const current = board.currentUser;
  const podium = board.leaders.slice(0, 3);
  const updated = board.updatedAt ? new Date(board.updatedAt) : null;
  const updatedText = updated && !Number.isNaN(updated.getTime()) ? `Updated ${updated.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}` : "Saved leaderboard snapshot";
  return <Frame styleName={styleName} width={width} name={name} showName={showName} source="WAKATIME RANKINGS">
    <Text style={{ fontFamily: "Outfit", fontWeight: "800", letterSpacing: 1 * s, fontSize: 10 * s, color: c.accent }}>{scopeLabel} LEADERBOARD · {board.range.toUpperCase()}</Text>
    <Text style={{ fontFamily: "Nunito", fontWeight: "800", fontSize: 30 * s, color: c.ink, marginTop: 5 * s }}>{mode === "podium" ? board.rank && board.rank <= 3 ? "I made the top 3" : scope === "country" ? "Country top 3" : "Global top 3" : "My leaderboard spot"}</Text>
    {mode === "podium" ? <>
      <View style={{ marginTop: 20 * s, gap: 8 * s }}>
        {podium.map((leader) => <View key={leader.id} style={{ minHeight: 56 * s, borderRadius: 12 * s, paddingHorizontal: 13 * s, flexDirection: "row", alignItems: "center", backgroundColor: leader.rank === board.rank ? c.highlight : c.panel }}>
          <Text style={{ width: 42 * s, fontFamily: "Outfit", fontWeight: "800", fontSize: 23 * s, color: c.ink }}>#{leader.rank}</Text>
          <View style={{ flex: 1 }}><Text numberOfLines={1} style={{ fontFamily: "Outfit", fontWeight: "800", fontSize: 13 * s, color: c.ink }}>{leader.rank === board.rank && !showName ? "You" : leader.name}</Text><Text style={{ fontFamily: "Nunito", fontWeight: "800", fontSize: 9 * s, color: c.muted }}>{leader.rank === board.rank ? "YOUR RANK" : "TOP MEMBER"}</Text></View>
          <Text style={{ fontFamily: "Outfit", fontWeight: "800", fontSize: 13 * s, color: c.ink }}>{formatDuration(leader.seconds)}</Text>
        </View>)}
      </View>
      <Text style={{ fontFamily: "Nunito", fontWeight: "800", fontSize: 11 * s, color: c.muted, marginTop: 18 * s }}>Ranked by recorded coding time</Text>
    </> : <>
      <Text style={{ fontFamily: "Outfit", fontWeight: "800", fontSize: 91 * s, lineHeight: 105 * s, color: c.ink, marginTop: 6 * s }}>#{board.rank}</Text>
      <Text style={{ fontFamily: "Nunito", fontWeight: "800", fontSize: 12 * s, color: c.muted }}>My rank for this leaderboard</Text>
      {current ? <View style={{ flexDirection: "row", gap: 10 * s, marginTop: 24 * s, padding: 15 * s, backgroundColor: c.panel, borderRadius: 12 * s }}>
        <Stat label="CODING TIME" value={formatDuration(current.seconds)} c={c} scale={s} />
        <Stat label="DAILY AVERAGE" value={formatDuration(current.dailyAverage)} c={c} scale={s} />
      </View> : <Text style={{ fontFamily: "Nunito", fontWeight: "800", fontSize: 12 * s, color: c.muted, marginTop: 29 * s }}>Ranked by recorded coding time</Text>}
      {current?.languages[0] ? <Text numberOfLines={1} style={{ fontFamily: "Nunito", fontWeight: "800", fontSize: 11 * s, color: c.muted, marginTop: 18 * s }}>Top language: {current.languages[0].name}</Text> : null}
    </>}
    <Text style={{ fontFamily: "Outfit", fontWeight: "800", fontSize: 9 * s, color: c.muted, marginTop: mode === "podium" ? 13 * s : 20 * s }}>{updatedText}</Text>
  </Frame>;
}
