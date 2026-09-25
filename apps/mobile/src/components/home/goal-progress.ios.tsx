import { usePalette } from "../../theme";
import { Host } from "@expo/ui";
import { ProgressView } from "@expo/ui/swift-ui";

export function GoalProgress({ progress }: { progress: number }) {
  const palette = usePalette();
  return (
    <Host style={{ height: 12, width: "100%" }} seedColor={palette.progress}>
      <ProgressView value={progress} />
    </Host>
  );
}
