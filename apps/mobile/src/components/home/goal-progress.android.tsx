import { Host } from "@expo/ui";
import { usePalette } from "../../theme";
import { LinearProgressIndicator } from "@expo/ui/jetpack-compose";
import { fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";

export function GoalProgress({ progress }: { progress: number }) {
  const palette = usePalette();
  return (
    <Host style={{ height: 12, width: "100%" }} seedColor={palette.accent}>
      <LinearProgressIndicator
        progress={progress}
        color={palette.progress}
        trackColor={palette.progressTrack}
        modifiers={[fillMaxWidth()]}
      />
    </Host>
  );
}
