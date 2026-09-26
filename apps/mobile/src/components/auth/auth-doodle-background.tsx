import { useMemo } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import Svg, { Circle, G, Path, Rect } from "react-native-svg";
import { usePalette } from "../../theme";

const TILE_WIDTH = 220;
const TILE_HEIGHT = 260;

function DoodleTile({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <G transform={`translate(${x} ${y})`} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {/* Coding time */}
      <Circle cx={34} cy={34} r={16} />
      <Path d="M34 18v-5m-5 0h10M34 34l7-7m-7 7v-9" />

      {/* Code brackets */}
      <Path d="m146 24-10 9 10 9m18-18 10 9-10 9m-4-22-9 26" />

      {/* Daily progress */}
      <Path d="M70 112v-13m11 13V89m11 23V95m11 17V79M64 113h45" />
      <Path d="m95 76 8 3-3 8" />

      {/* Terminal window */}
      <Rect x={139} y={116} width={46} height={34} rx={6} />
      <Path d="M139 125h46m-38 8 5 4-5 4m10 0h12" />

      {/* Goal ring */}
      <Circle cx={37} cy={204} r={17} />
      <Circle cx={37} cy={204} r={8} />
      <Path d="m37 204 17-17m-1 0h7m-7 0v-7" />

      {/* Activity pulse */}
      <Path d="M132 211h11l5-9 7 18 6-12 4 3h17" />
      <Circle cx={121} cy={181} r={2} fill={color} stroke="none" />
      <Circle cx={187} cy={73} r={2} fill={color} stroke="none" />
    </G>
  );
}

export function AuthDoodleBackground() {
  const palette = usePalette();
  const { width, height } = useWindowDimensions();
  const tiles = useMemo(() => {
    const columns = Math.ceil(width / TILE_WIDTH) + 1;
    const rows = Math.ceil(height / TILE_HEIGHT) + 1;
    return Array.from({ length: columns * rows }, (_, index) => ({
      x: (index % columns) * TILE_WIDTH - 45,
      y: Math.floor(index / columns) * TILE_HEIGHT - 38,
    }));
  }, [width, height]);

  return (
    <View pointerEvents="none" accessible={false} style={StyleSheet.absoluteFill}>
      <Svg width={width} height={height} style={{ opacity: palette.scheme === "dark" ? 0.24 : 0.27 }}>
        {tiles.map(({ x, y }) => <DoodleTile key={`${x}-${y}`} x={x} y={y} color={palette.primary} />)}
      </Svg>
    </View>
  );
}
