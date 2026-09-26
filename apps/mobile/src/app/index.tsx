import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { LoadingIndicator } from "../components/ui/loading-indicator";
import { getConnectionMode } from "../data/wakatime-client";
import { usePalette } from "../theme";

export default function Index() {
  const palette = usePalette();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    void getConnectionMode()
      .then((mode) => { if (active) setSignedIn(Boolean(mode)); })
      .catch(() => { if (active) setSignedIn(false); });
    return () => { active = false; };
  }, []);

  if (signedIn === null) {
    return <View style={{ flex: 1, justifyContent: "center", backgroundColor: palette.background }}><LoadingIndicator color={palette.primary} /></View>;
  }
  return <Redirect href={signedIn ? "/(tabs)/(home)" : "/auth"} />;
}
