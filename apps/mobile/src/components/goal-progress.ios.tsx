import { Host } from "@expo/ui";
import { ProgressView } from "@expo/ui/swift-ui";

export function GoalProgress({ progress }: { progress: number }) {
  return (
    <Host style={{ height: 12, width: "100%" }} seedColor="#70D8A5">
      <ProgressView value={progress} />
    </Host>
  );
}
