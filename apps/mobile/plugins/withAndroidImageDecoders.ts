import { withGradleProperties, type ConfigPlugin } from "expo/config-plugins";

/**
 * React Native's `<Image>` is Fresco-backed, and the template ships GIF + WebP
 * decoders for it by default (`expo.gif.enabled`, `expo.webp.enabled`).
 *
 * This app renders every image through `expo-image`, which uses Glide on
 * Android with its own bundled decoders, so the Fresco decoders are dead weight
 * that get packaged once per ABI.
 *
 * `expo-build-properties` only grew `gifEnabled` / `webpEnabled` in SDK 58, so
 * on SDK 57 the gradle properties have to be set directly.
 */
const DISABLED_DECODERS: Record<string, string> = {
  "expo.gif.enabled": "false",
  "expo.webp.enabled": "false",
};

const withAndroidImageDecoders: ConfigPlugin = (config) =>
  withGradleProperties(config, (props) => {
    for (const [key, value] of Object.entries(DISABLED_DECODERS)) {
      const existing = props.modResults.find(
        (item): item is { type: "property"; key: string; value: string } =>
          item.type === "property" && item.key === key,
      );

      if (existing) {
        existing.value = value;
      } else {
        props.modResults.push({ type: "property", key, value });
      }
    }

    return props;
  });

export default withAndroidImageDecoders;
