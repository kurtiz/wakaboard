import { Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { usePalette } from "../../theme";


export function BrandMark({ compact = false }: { compact?: boolean }) {
  const palette = usePalette();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
      <View style={{ width: 35, height: 35, borderRadius: 9, backgroundColor: palette.primary, flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: 3, paddingBottom: 8 }}>
        {[8, 15, 11].map((height) => <View key={height} style={{ width: 4, height, borderRadius: 3, backgroundColor: palette.onPrimary }} />)}
      </View>
      <View style={{ gap: 1 }}>
        <Text style={{ color: palette.text, fontSize: 15, fontWeight: "800", letterSpacing: -0.35 }}>WakaBoard</Text>
        {!compact && <Text style={{ color: palette.muted, fontSize: 10 }}>Powered by WakaTime</Text>}
      </View>
    </View>
  );
}

function Pill({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "green" }) {
  const palette = usePalette();
  return (
    <View style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 9, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.border }}>
      {tone === "green" && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: palette.success }} />}
      <Text style={{ color: palette.muted, fontSize: 10, fontWeight: "600" }}>{label}</Text>
    </View>
  );
}

function TelemetryArt() {
  const palette = usePalette();
  const bars = [19, 31, 12, 8, 28, 39, 24];
  return (
    <View style={{ width: "100%", alignItems: "center", gap: 13 }}>
      <View style={{ flexDirection: "row", width: "100%", justifyContent: "space-between" }}>
        <Pill label="✦ Flow State" tone="green" />
        <Pill label="TypeScript 54%" />
      </View>
      <View style={{ width: 276, maxWidth: "100%", minHeight: 257, borderRadius: 24, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.border, alignItems: "center", paddingTop: 20, paddingBottom: 18, justifyContent: "space-between", boxShadow: `0 10px 30px ${palette.cardShadow}` }}>
        <View style={{ width: 148, height: 148, alignItems: "center", justifyContent: "center" }}>
          <Svg width={148} height={148} viewBox="0 0 148 148" accessibilityLabel="Illustrative 76 percent daily goal ring">
            <Circle cx="74" cy="74" r="57" fill="none" stroke={palette.track} strokeWidth="9" />
            <Circle cx="74" cy="74" r="57" fill="none" stroke={palette.primary} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${Math.round(2 * Math.PI * 57 * 0.76)} ${Math.round(2 * Math.PI * 57)}`} transform="rotate(-90 74 74)" />
            <Circle cx="74" cy="74" r="57" fill="none" stroke={palette.amber} strokeWidth="9" strokeLinecap="round" strokeDasharray="33 400" transform="rotate(183 74 74)" />
          </Svg>
          <View style={{ position: "absolute", alignItems: "center" }}>
            <Text style={{ color: palette.muted, fontSize: 10, fontWeight: "700", letterSpacing: 1 }}>TODAY</Text>
            <Text style={{ color: palette.text, fontSize: 24, fontWeight: "800", fontVariant: ["tabular-nums"] }}>4h 32m</Text>
            <Text style={{ color: palette.primary, fontSize: 10 }}>76% of goal</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-end" }}>
          {bars.map((height, index) => (
            <View key={index} style={{ width: 20, alignItems: "center", gap: 4 }}>
              <View style={{ width: 8, height, borderRadius: 8, backgroundColor: index === 5 ? palette.primary : palette.mint }} />
              <Text style={{ color: palette.muted, fontSize: 9 }}>{["M", "T", "W", "T", "F", "S", "S"][index]}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={{ flexDirection: "row", width: "100%", justifyContent: "space-between" }}>
        <Pill label="Streak: 12 days" />
        <Pill label="Sync on launch" tone="green" />
      </View>
    </View>
  );
}

function PrivacyArt() {
  const palette = usePalette();
  return (
    <View style={{ width: "100%", gap: 12 }}>
      <View style={{ height: 294, borderRadius: 26, backgroundColor: palette.privacyPanel, borderWidth: 1, borderColor: palette.border, padding: 14, justifyContent: "space-between", boxShadow: `0 10px 30px ${palette.cardShadow}` }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Pill label="Local cache ready" tone="green" />
          <Pill label="Offline access" />
        </View>
        <View style={{ alignSelf: "center", width: 112, height: 112, borderRadius: 56, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.border, alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: palette.privacyBadge, alignItems: "center", justifyContent: "center" }}>
            <Svg width={36} height={42} viewBox="0 0 36 42" accessibilityLabel="Protected local data">
              <Path d="M18 2 32 8v11c0 9-5.7 15.8-14 20C9.7 34.8 4 28 4 19V8L18 2Z" fill={palette.primary} />
              <Path d="M18 13c-2 0-3 1.6-3 3.4 0 1.3.6 2.3 1.5 2.9L16 25h4l-.5-5.7c.9-.6 1.5-1.6 1.5-2.9 0-1.8-1-3.4-3-3.4Z" fill={palette.onPrimary} />
            </Svg>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {[["Zero code", "inspection"], ["Saved for", "offline use"]].map(([top, bottom]) => (
            <View key={top} style={{ flex: 1, borderRadius: 12, backgroundColor: palette.card, padding: 10, flexDirection: "row", gap: 7, alignItems: "center" }}>
              <Text style={{ color: palette.primary, fontSize: 15 }}>✓</Text>
              <Text style={{ color: palette.text, fontSize: 10, lineHeight: 14 }}>{top}{"\n"}{bottom}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function ConnectionArt() {
  const palette = usePalette();
  return (
    <View style={{ width: "100%", gap: 12 }}>
      <View style={{ minHeight: 282, borderRadius: 26, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.border, padding: 18, gap: 18, boxShadow: `0 10px 30px ${palette.cardShadow}` }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 22 }}>
          <View style={{ alignItems: "center", gap: 6 }}>
            <View style={{ width: 52, height: 52, borderRadius: 13, backgroundColor: palette.wakatimeTile, alignItems: "center", justifyContent: "center" }}><Text style={{ color: palette.wakatimeMark, fontSize: 28 }}>◷</Text></View>
            <Text style={{ color: palette.text, fontSize: 11, fontWeight: "700" }}>WakaTime</Text>
          </View>
          <View style={{ flex: 1, alignItems: "center", gap: 7, paddingHorizontal: 9 }}>
            <View style={{ height: 2, width: "100%", borderStyle: "dashed", borderTopWidth: 2, borderColor: palette.primary }} />
            <Text style={{ color: palette.primary, fontSize: 9, fontWeight: "700" }}>HTTPS</Text>
          </View>
          <View style={{ alignItems: "center", gap: 6 }}>
            <View style={{ width: 52, height: 52, borderRadius: 13, backgroundColor: palette.primary, alignItems: "center", justifyContent: "center" }}><Text style={{ color: palette.onPrimary, fontSize: 25 }}>◇</Text></View>
            <Text style={{ color: palette.text, fontSize: 11, fontWeight: "700" }}>WakaBoard</Text>
          </View>
        </View>
        <View style={{ alignSelf: "center", borderWidth: 1, borderColor: palette.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}><Text style={{ color: palette.muted, fontSize: 10 }}>✓ Official API · Secure OAuth</Text></View>
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 8 }}>
          <View style={{ borderRadius: 7, backgroundColor: palette.readonlyBadge, padding: 7 }}><Text style={{ color: palette.primary, fontSize: 10 }}>✓ Read-only stats</Text></View>
          <View style={{ borderRadius: 7, backgroundColor: palette.noCodeBadge, padding: 7 }}><Text style={{ color: palette.primary, fontSize: 10 }}>✓ No source code access</Text></View>
        </View>
        <View style={{ borderRadius: 13, borderWidth: 1, borderColor: palette.border, padding: 10, flexDirection: "row", alignItems: "center", gap: 9 }}>
          <View style={{ width: 31, height: 31, borderRadius: 16, backgroundColor: palette.userBadge, alignItems: "center", justifyContent: "center" }}><Text style={{ color: palette.primary, fontSize: 10, fontWeight: "700" }}>YOU</Text></View>
          <View style={{ flex: 1 }}><Text style={{ color: palette.text, fontSize: 11, fontWeight: "700" }}>Your coding activity</Text><Text style={{ color: palette.muted, fontSize: 9 }}>Live data after connection</Text></View>
          <Text style={{ color: palette.primary, fontSize: 9, fontWeight: "700" }}>Ready to sync</Text>
        </View>
      </View>
    </View>
  );
}

export function OnboardingArt({ step }: { step: number }) {
  return step === 0 ? <TelemetryArt /> : step === 1 ? <PrivacyArt /> : <ConnectionArt />;
}
