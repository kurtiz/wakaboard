import { Host } from "@expo/ui";
import { LinearProgressIndicator } from "@expo/ui/jetpack-compose";
import { fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";

export function GoalProgress({ progress }: { progress: number }) {
  return (
    <Host style={{ height: 12, width: "100%" }} seedColor="#42B78B">
      <LinearProgressIndicator
        progress={progress}
        color="#70D8A5"
        trackColor="#315448"
        modifiers={[fillMaxWidth()]}
      />
    </Host>
  );
}
