import Svg, { Path } from "react-native-svg";
import { usePalette } from "../../theme";

export function BrandMark({ size = 32 }: { size?: number }) {
  const palette = usePalette();
  const center = palette.scheme === "dark" ? "#FFFFFF" : palette.primary;
  return <Svg width={size} height={size} viewBox="0 0 96 96" accessibilityLabel="WakaBoard logo">
    <Path d="M22.08 36.48c4.7685 0 8.64 3.8715 8.64 8.64v23.04c0 4.7685-3.8715 8.64-8.64 8.64s-8.64-3.8715-8.64-8.64V45.12c0-4.7685 3.8715-8.64 8.64-8.64Z" fill={palette.accent} />
    <Path d="M48 15.36c4.7685 0 8.64 3.8715 8.64 8.64v44.16c0 4.7685-3.8715 8.64-8.64 8.64s-8.64-3.8715-8.64-8.64V24c0-4.7685 3.8715-8.64 8.64-8.64Z" fill={center} />
    <Path d="M73.92 27.84c4.7685 0 8.64 3.8715 8.64 8.64v31.68c0 4.7685-3.8715 8.64-8.64 8.64s-8.64-3.8715-8.64-8.64V36.48c0-4.7685 3.8715-8.64 8.64-8.64Z" fill={palette.accent} />
    <Path d="M69.6 68.16a4.32 4.32 0 1 0 8.64 0 4.32 4.32 0 0 0-8.64 0Z" fill={palette.homeAmber} />
  </Svg>;
}
