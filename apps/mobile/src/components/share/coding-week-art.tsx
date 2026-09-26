import { formatDuration } from "@wakaboard/core";
import { Text, View, type TextStyle, type ViewStyle } from "react-native";
import type { CodingWeekReport } from "./coding-week-data";
import { ShareBrand } from "./share-brand";

export type CodingWeekStyle = "editorial" | "night" | "rhythm";

type Props = {
  report: CodingWeekReport;
  styleName: CodingWeekStyle;
  width: number;
  name: string | null;
  showName: boolean;
  showProject: boolean;
};

const colors = {
  paper: "#FAF9F3",
  pine: "#122B24",
  emerald: "#0D5C4D",
  amber: "#FEA619",
  mint: "#73D5A2",
  pale: "#E9F1E8",
  muted: "#536F62",
  white: "#F7FBF6",
};

function dateLabel(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en", { month: "short", day: "numeric" });
}

function period(report: CodingWeekReport): string {
  const start = dateLabel(report.start);
  const end = dateLabel(report.end);
  const year = report.end.slice(0, 4);
  return `${start} to ${end}, ${year}`;
}

function bestDayLabel(report: CodingWeekReport): string {
  if (!report.bestDay) return "No active day";
  const weekday = new Date(`${report.bestDay.date}T12:00:00`).toLocaleDateString("en", { weekday: "long" });
  return `${weekday} · ${formatDuration(report.bestDay.seconds)}`;
}

function PositionedText({ children, x, y, w, size, color, scale, weight = "700", font = "Outfit", style, lines = 1 }: {
  children: string;
  x: number;
  y: number;
  w: number;
  size: number;
  color: string;
  scale: number;
  weight?: TextStyle["fontWeight"];
  font?: "Outfit" | "Nunito";
  style?: TextStyle;
  lines?: number;
}) {
  return <Text numberOfLines={lines} adjustsFontSizeToFit minimumFontScale={0.55} style={[{
    position: "absolute", left: x * scale, top: y * scale, width: w * scale,
    fontSize: size * scale, lineHeight: size * 1.18 * scale,
    color, fontFamily: font, fontWeight: weight,
  }, style]}>{children}</Text>;
}

function Brand({ scale, light = false, x = 26, y = 24 }: { scale: number; light?: boolean; x?: number; y?: number }) {
  return <ShareBrand scale={scale} light={light} style={{ position: "absolute", left: x * scale, top: y * scale }} />;
}

function Rule({ x, y, w, scale, color }: { x: number; y: number; w: number; scale: number; color: string }) {
  return <View style={{ position: "absolute", left: x * scale, top: y * scale, width: w * scale, height: Math.max(1, scale), backgroundColor: color }} />;
}

function WeekBars({ report, x, y, w, h, scale, dark = false, compact = false }: {
  report: CodingWeekReport; x: number; y: number; w: number; h: number; scale: number; dark?: boolean; compact?: boolean;
}) {
  const maximum = Math.max(1, ...report.days.map((day) => day.seconds));
  const barWidth = compact ? 23 : 25;
  const labelWidth = 39;
  const slot = (w - labelWidth) / 7;
  const plotHeight = h - (compact ? 20 : 21);
  const plotTop = h - 16 - plotHeight;
  const trackColor = dark ? "#426F5B" : "#AAC2B3";
  return <View style={{ position: "absolute", left: x * scale, top: y * scale, width: w * scale, height: h * scale }}>
    {([1, 0.5] as const).map((fraction) => <View key={fraction} style={{ position: "absolute", top: (plotTop + (1 - fraction) * plotHeight) * scale, left: 0, right: 0, flexDirection: "row", alignItems: "flex-start" }}>
      <Text numberOfLines={1} adjustsFontSizeToFit style={{ width: (labelWidth - 5) * scale, marginTop: -5 * scale, textAlign: "right", color: dark ? "#B9D9C5" : colors.muted, fontFamily: "Outfit", fontWeight: "800", fontSize: 7 * scale }}>{formatDuration(maximum * fraction)}</Text>
      <View style={{ flex: 1, borderTopWidth: Math.max(1, scale), borderTopColor: trackColor, borderStyle: "dashed" }} />
    </View>)}
    {report.days.map((day, index) => {
      const peak = day.seconds > 0 && day.seconds === report.bestDay?.seconds;
      const height = day.seconds / maximum * plotHeight;
      const left = labelWidth + index * slot + (slot - barWidth) / 2;
      return <View key={day.date} style={{ position: "absolute", left: left * scale, top: 0, width: barWidth * scale, height: h * scale }}>
        {day.seconds > 0 ? <View style={{ position: "absolute", bottom: 16 * scale, left: 0, width: barWidth * scale, height: Math.max(3, height) * scale, borderRadius: (compact ? 5 : 8) * scale, backgroundColor: peak ? colors.amber : dark ? colors.mint : colors.emerald }} />
          : <View style={{ position: "absolute", bottom: 18 * scale, left: (barWidth / 2 - 2) * scale, width: 4 * scale, height: 4 * scale, borderRadius: 2 * scale, borderWidth: Math.max(1, scale), borderColor: trackColor }} />}
        <Text style={{ position: "absolute", top: (h - 12) * scale, left: -5 * scale, width: (barWidth + 10) * scale, textAlign: "center", color: dark ? "#E0F1E4" : colors.muted, fontFamily: "Outfit", fontWeight: "800", fontSize: 8.5 * scale }}>{day.label.slice(0, 1)}</Text>
      </View>;
    })}
  </View>;
}

function Editorial({ report, scale, name, showName, showProject }: Omit<Props, "styleName" | "width"> & { scale: number }) {
  const total = formatDuration(report.totalSeconds);
  return <>
    <Brand scale={scale} />
    <PositionedText x={254} y={26} w={78} size={8} color={colors.muted} scale={scale} style={{ textAlign: "right", letterSpacing: 1 * scale }}>WEEKLY RECORD</PositionedText>
    <PositionedText x={27} y={63} w={300} size={10} color={colors.emerald} scale={scale} style={{ letterSpacing: 1.2 * scale }}>{period(report).toUpperCase()}</PositionedText>
    <PositionedText x={26} y={78} w={310} size={33} color={colors.pine} scale={scale} font="Nunito" weight="800">My coding week</PositionedText>
    <PositionedText x={24} y={116} w={310} size={57} color={colors.pine} scale={scale} weight="800" style={{ letterSpacing: -2 * scale }}>{total}</PositionedText>
    <PositionedText x={28} y={174} w={294} size={10} color={colors.muted} scale={scale}>A week in code, day by day.</PositionedText>
    <Rule x={27} y={202} w={306} scale={scale} color="#CBDACD" />
    <PositionedText x={27} y={215} w={160} size={9} color={colors.emerald} scale={scale} weight="700" style={{ letterSpacing: 1 * scale }}>DAILY ACTIVITY</PositionedText>
    <PositionedText x={185} y={215} w={148} size={7.5} color={colors.muted} scale={scale} style={{ textAlign: "right" }}>{`BEST DAY ${report.bestDay?.label.toUpperCase() ?? ""}`}</PositionedText>
    <WeekBars report={report} x={27} y={242} w={306} h={86} scale={scale} />
    <View style={{ position: "absolute", left: 27 * scale, top: 344 * scale, right: 27 * scale, flexDirection: "row", gap: 8 * scale }}>
      {([[
        "ACTIVE DAYS", `${report.activeDays} of 7`, 85,
      ], ["TOP LANGUAGE", report.topLanguage ?? "Unavailable", 106], ["BEST DAY", bestDayLabel(report), 99]] as const).map(([label, value, width]) => <View key={label} style={{ width: width * scale, borderTopWidth: Math.max(1, scale), borderColor: colors.pine, paddingTop: 5 * scale }}>
        <Text style={{ fontFamily: "Outfit", color: colors.muted, fontWeight: "800", fontSize: 8 * scale, letterSpacing: .3 * scale }}>{label}</Text>
        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.55} style={{ fontFamily: "Outfit", color: colors.pine, fontSize: 11 * scale, fontWeight: "800", marginTop: 4 * scale }}>{value}</Text>
      </View>)}
    </View>
    {showProject && report.topProject ? <View style={{ position: "absolute", left: 27 * scale, top: 389 * scale, width: 306 * scale, height: 27 * scale, borderRadius: 7 * scale, paddingHorizontal: 9 * scale, backgroundColor: "#E6EEE6", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      <Text style={{ fontFamily: "Outfit", color: colors.pine, fontSize: 9 * scale, fontWeight: "700" }}>Top project</Text><Text numberOfLines={1} style={{ fontFamily: "Outfit", color: colors.pine, fontSize: 10 * scale, fontWeight: "800", maxWidth: 180 * scale }}>{report.topProject}</Text>
    </View> : null}
    <Rule x={27} y={423} w={306} scale={scale} color="#CBDACD" />
    <PositionedText x={27} y={431} w={155} size={8.5} color={colors.muted} scale={scale}>{showName && name ? name.toUpperCase() : "MY CODING WEEK"}</PositionedText>
    <PositionedText x={181} y={431} w={152} size={7.5} color={colors.muted} scale={scale} style={{ textAlign: "right" }}>YOUR TIME, MADE VISIBLE.</PositionedText>
  </>;
}

function Night({ report, scale, name, showName, showProject }: Omit<Props, "styleName" | "width"> & { scale: number }) {
  const hours = Math.floor(Math.round(report.totalSeconds / 60) / 60);
  const minutes = Math.round(report.totalSeconds / 60) % 60;
  const primaryValue = hours > 0 ? hours : minutes;
  const primaryUnit = hours > 0 ? "hours" : "minutes";
  const primaryDigits = String(primaryValue).length;
  const longPrimary = primaryDigits >= 3;
  const primaryUnitX = primaryDigits === 1 ? 92 : primaryDigits === 2 ? 143 : primaryDigits === 3 ? 174 : 214;
  return <>
    <View style={{ position: "absolute", left: 205 * scale, top: -64 * scale, width: 284 * scale, height: 284 * scale, borderWidth: Math.max(1, scale), borderColor: "#285646", borderRadius: 142 * scale, opacity: .55 }} />
    <View style={{ position: "absolute", left: 180 * scale, top: -89 * scale, width: 334 * scale, height: 334 * scale, borderWidth: Math.max(1, scale), borderColor: "#285646", borderRadius: 167 * scale, opacity: .45 }} />
    <Brand scale={scale} light />
    <PositionedText x={220} y={28} w={113} size={8} color="#BDD5C6" scale={scale} style={{ textAlign: "right" }}>{period(report).toUpperCase()}</PositionedText>
    <PositionedText x={27} y={65} w={260} size={10} color="#8EE4B4" scale={scale} style={{ letterSpacing: 1.2 * scale }}>MY CODING WEEK</PositionedText>
    <PositionedText x={21} y={79} w={longPrimary ? 245 : 205} size={longPrimary ? 86 : 108} color={colors.white} scale={scale} weight="800" style={{ letterSpacing: -6 * scale }}>{String(primaryValue)}</PositionedText>
    <PositionedText x={primaryUnitX} y={longPrimary ? 133 : 139} w={longPrimary ? 118 : 150} size={longPrimary ? 24 : 30} color={colors.amber} scale={scale} font="Nunito" weight="800">{primaryUnit}</PositionedText>
    {hours > 0 && minutes > 0 ? <>
      <PositionedText x={28} y={197} w={60} size={29} color={colors.amber} scale={scale} weight="800">{String(minutes)}</PositionedText>
      <PositionedText x={minutes < 10 ? 49 : 65} y={203} w={150} size={20} color={colors.white} scale={scale} font="Nunito" weight="800">minutes</PositionedText>
    </> : null}
    <PositionedText x={29} y={227} w={285} size={10} color="#B7D6C5" scale={scale}>{`${report.activeDays} active days across the last 7.`}</PositionedText>
    <View style={{ position: "absolute", left: 27 * scale, top: 253 * scale, width: 306 * scale, height: 97 * scale, backgroundColor: "#193D31", borderWidth: Math.max(1, scale), borderColor: "#3A6856", borderRadius: 11 * scale }} />
    <PositionedText x={37} y={263} w={130} size={8} color="#B7D6C5" scale={scale} style={{ letterSpacing: .8 * scale }}>DAILY RHYTHM</PositionedText>
    <PositionedText x={178} y={263} w={143} size={8} color="#B7D6C5" scale={scale} style={{ textAlign: "right" }}>{`PEAK ${report.bestDay?.label.toUpperCase() ?? ""} ${report.bestDay ? formatDuration(report.bestDay.seconds).toUpperCase() : ""}`}</PositionedText>
    <WeekBars report={report} x={38} y={282} w={284} h={58} scale={scale} dark compact />
    <Rule x={27} y={360} w={306} scale={scale} color="#4B725F" />
    <View style={{ position: "absolute", left: 27 * scale, top: 368 * scale, width: 306 * scale, flexDirection: "row" }}>
      {([["LANGUAGE", report.topLanguage ?? "Unavailable"], showProject && report.topProject ? ["PROJECT", report.topProject] : ["SOURCE", "WakaTime"], ["BEST DAY", report.bestDay ? new Date(`${report.bestDay.date}T12:00:00`).toLocaleDateString("en", { weekday: "long" }) : "None"]] as const).map(([label, value], index) => <View key={label} style={{ flex: 1, paddingLeft: index ? 9 * scale : 0, borderLeftWidth: index ? Math.max(1, scale) : 0, borderColor: "#4B725F" }}>
        <Text style={{ fontFamily: "Outfit", fontWeight: "800", fontSize: 8 * scale, color: "#D8EBDD" }}>{label}</Text>
        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.55} style={{ fontFamily: "Outfit", fontSize: 10 * scale, fontWeight: "800", color: colors.white, marginTop: 3 * scale }}>{value}</Text>
      </View>)}
    </View>
    <Rule x={27} y={405} w={306} scale={scale} color="#4B725F" />
    <PositionedText x={27} y={428} w={165} size={8} color="#B7D6C5" scale={scale}>{showName && name ? name.toUpperCase() : "MY CODING WEEK"}</PositionedText>
    <PositionedText x={184} y={428} w={149} size={8} color="#B7D6C5" scale={scale} style={{ textAlign: "right" }}>WAKABOARD · CODING TIME</PositionedText>
  </>;
}

function Rhythm({ report, scale, name, showName, showProject }: Omit<Props, "styleName" | "width"> & { scale: number }) {
  return <>
    <View style={{ position: "absolute", left: 0, top: 0, right: 0, height: 49 * scale, backgroundColor: colors.paper }} />
    <Brand scale={scale} y={17} />
    <PositionedText x={242} y={21} w={91} size={8} color={colors.pine} scale={scale} style={{ textAlign: "right", letterSpacing: .7 * scale }}>{showName && name ? name.toUpperCase() : "MY WEEK"}</PositionedText>
    <View style={{ position: "absolute", left: 0, top: 49 * scale, right: 0, height: 205 * scale, backgroundColor: colors.amber, overflow: "hidden" }}>
      <View style={{ position: "absolute", left: 191 * scale, top: -37 * scale, width: 300 * scale, height: 300 * scale, borderWidth: Math.max(1, scale), borderColor: "#D98B17", opacity: .5, borderRadius: 150 * scale }} />
      <View style={{ position: "absolute", left: 218 * scale, top: -11 * scale, width: 246 * scale, height: 246 * scale, borderWidth: Math.max(1, scale), borderColor: "#D98B17", opacity: .5, borderRadius: 123 * scale }} />
    </View>
    <PositionedText x={24} y={70} w={312} size={9} color={colors.pine} scale={scale} style={{ letterSpacing: .7 * scale }}>{`MY CODING WEEK · ${period(report).toUpperCase()}`}</PositionedText>
    <PositionedText x={18} y={92} w={320} size={67} color={colors.pine} scale={scale} weight="700" style={{ letterSpacing: -3 * scale }}>{formatDuration(report.totalSeconds)}</PositionedText>
    <PositionedText x={24} y={181} w={306} size={20} color={colors.pine} scale={scale} font="Nunito" weight="800">Made time to make things.</PositionedText>
    <View style={{ position: "absolute", left: 24 * scale, top: 219 * scale, paddingHorizontal: 9 * scale, height: 27 * scale, backgroundColor: colors.pine, borderRadius: 6 * scale, justifyContent: "center" }}><Text style={{ fontFamily: "Outfit", fontSize: 11 * scale, fontWeight: "800", color: colors.white }}>{report.activeDays} active days</Text></View>
    <View style={{ position: "absolute", left: 0, top: 254 * scale, right: 0, height: 108 * scale, backgroundColor: colors.pine }} />
    <PositionedText x={24} y={261} w={170} size={9} color="#D8EBDD" scale={scale} style={{ letterSpacing: .7 * scale }}>THE WEEK, IN HOURS</PositionedText>
    <WeekBars report={report} x={24} y={279} w={312} h={77} scale={scale} dark compact />
    <View style={{ position: "absolute", left: 0, top: 362 * scale, right: 0, bottom: 0, backgroundColor: colors.pale }} />
    <View style={{ position: "absolute", top: 372 * scale, left: 24 * scale, right: 24 * scale, flexDirection: "row", gap: 14 * scale }}>
      {([["TOP LANGUAGE", report.topLanguage ?? "Unavailable"], ["STRONGEST DAY", bestDayLabel(report)]] as const).map(([label, value]) => <View key={label} style={{ flex: 1, borderLeftWidth: 2 * scale, borderColor: colors.amber, paddingLeft: 8 * scale }}>
        <Text style={{ fontFamily: "Outfit", fontSize: 8 * scale, fontWeight: "800", color: colors.muted }}>{label}</Text>
        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.55} style={{ fontFamily: "Outfit", fontSize: 11 * scale, fontWeight: "800", color: colors.pine, marginTop: 3 * scale }}>{value}</Text>
      </View>)}
    </View>
    {showProject && report.topProject ? <PositionedText x={24} y={408} w={300} size={8} color={colors.muted} scale={scale}>{`TOP PROJECT  ${report.topProject}`}</PositionedText> : null}
    <Rule x={24} y={427} w={312} scale={scale} color="#AAC0B0" />
    <PositionedText x={24} y={433} w={145} size={7.5} color={colors.muted} scale={scale}>{period(report).toUpperCase()}</PositionedText>
    <PositionedText x={184} y={433} w={152} size={7.5} color={colors.muted} scale={scale} style={{ textAlign: "right" }}>WAKABOARD / CODING WEEK</PositionedText>
  </>;
}

export function CodingWeekArt({ report, styleName, width, name, showName, showProject }: Props) {
  const scale = width / 360;
  const background = styleName === "night" ? colors.pine : styleName === "rhythm" ? colors.pale : colors.paper;
  const content = { report, scale, name, showName, showProject };
  return <View collapsable={false} style={{ width, height: 450 * scale, overflow: "hidden", backgroundColor: background } as ViewStyle}>
    {styleName === "editorial" ? <Editorial {...content} /> : styleName === "night" ? <Night {...content} /> : <Rhythm {...content} />}
  </View>;
}
