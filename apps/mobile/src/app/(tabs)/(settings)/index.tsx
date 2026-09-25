import { Button, FieldGroup, Host, Slider, Text } from "@expo/ui";
import { formatDuration } from "@wakaboard/core";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useDashboard } from "../../../data/dashboard-context";
import { useLeaderboards } from "../../../data/leaderboard-context";
import { authClient, wakatimeConnectionAvailable } from "../../../data/wakatime-client";
import { usePalette } from "../../../theme";

export default function SettingsScreen() {
  const palette = usePalette();
  const { goalSeconds, summaries, setGoalHours, clearSample, clearWakaTime, syncWakaTime, syncing, syncError } = useDashboard();
  const { refresh: refreshLeaderboards, clear: clearLeaderboards } = useLeaderboards();
  const [draftHours, setDraftHours] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [accountBusy, setAccountBusy] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const selectedHours = draftHours ?? goalSeconds / 3600;
  const hasSample = summaries.some((day) => day.source === "sample");

  useEffect(() => {
    if (wakatimeConnectionAvailable) {
      void authClient.getSession()
        .then(({ data }) => setAccountEmail(data?.user.email ?? null))
        .catch(() => setAccountEmail(null));
    }
  }, []);

  async function connect() {
    setAccountBusy(true);
    setAccountError(null);
    try {
      const { error } = await authClient.signIn.social({ provider: "wakatime", callbackURL: "/" });
      if (error) throw new Error(error.message);
      const { data } = await authClient.getSession();
      setAccountEmail(data?.user.email ?? null);
      if (data?.user) await Promise.all([syncWakaTime(), refreshLeaderboards()]);
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : "WakaTime sign-in failed.");
    } finally {
      setAccountBusy(false);
    }
  }

  async function signOut() {
    setAccountBusy(true);
    setAccountError(null);
    try {
      const { error } = await authClient.signOut();
      if (error) throw new Error(error.message);
      await clearWakaTime();
      clearLeaderboards();
      setAccountEmail(null);
      router.replace("/auth");
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : "Could not sign out.");
    } finally {
      setAccountBusy(false);
    }
  }

  async function saveGoal() {
    setSaving(true);
    try {
      await setGoalHours(selectedHours);
      setDraftHours(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Host style={{ flex: 1 }} seedColor={palette.accent} colorScheme={palette.scheme}>
      <FieldGroup>
        {wakatimeConnectionAvailable && (
          <FieldGroup.Section title="WakaTime">
            <Text textStyle={{ fontSize: 15, color: palette.text }}>
              {accountEmail ? `Connected as ${accountEmail}` : "Connect to see your real coding activity."}
            </Text>
            {accountEmail ? (
              <>
                <Button label={syncing ? "Syncing…" : "Sync activity"} disabled={syncing || accountBusy} onPress={() => void syncWakaTime()} />
                <Button label="Sign out" variant="text" disabled={accountBusy || syncing} onPress={() => void signOut()} />
              </>
            ) : (
              <Button label={accountBusy ? "Connecting…" : "Connect WakaTime"} disabled={accountBusy} onPress={() => void connect()} />
            )}
            {(accountError || syncError) && (
              <Text textStyle={{ fontSize: 13, color: palette.error }}>
                {accountError ?? syncError ?? ""}
              </Text>
            )}
          </FieldGroup.Section>
        )}
        <FieldGroup.Section title="Daily coding goal">
          <Text textStyle={{ fontSize: 28, fontWeight: "bold", color: palette.text }}>
            {formatDuration(selectedHours * 3600)}
          </Text>
          <Slider
            value={selectedHours}
            min={0.5}
            max={12}
            step={0.5}
            onValueChange={setDraftHours}
            disabled={saving}
            testID="daily-goal-slider"
          />
          <Button
            label={saving ? "Saving…" : "Save goal"}
            disabled={saving}
            onPress={() => void saveGoal()}
          />
          <FieldGroup.SectionFooter>
            <Text textStyle={{ fontSize: 13, color: palette.muted }}>
              Choose between 30 minutes and 12 hours. Your goal is saved on this device.
            </Text>
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>

        <FieldGroup.Section title="Your data">
          <Text textStyle={{ fontSize: 15, color: palette.text }}>
            Activity is saved on this device for quick, offline viewing.
          </Text>
          {hasSample && (
            <Button
              label="Remove sample activity"
              variant="outlined"
              onPress={() => void clearSample()}
            />
          )}
          <FieldGroup.SectionFooter>
            <Text textStyle={{ fontSize: 13, color: palette.muted }}>
              Sample activity is clearly marked and can be removed at any time.
            </Text>
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>
      </FieldGroup>
    </Host>
  );
}
