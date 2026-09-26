import { useEffect } from "react";
import { View, type ViewStyle } from "react-native";
import Animated, { Easing, useAnimatedProps, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { Circle, Svg } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const timing = { duration: 360, easing: Easing.out(Easing.cubic) };

function useProgress(value: number) {
  const reducedMotion = useReducedMotion();
  const target = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  const progress = useSharedValue(target);

  useEffect(() => {
    progress.value = reducedMotion ? target : withTiming(target, timing);
  }, [progress, reducedMotion, target]);

  return progress;
}

export function AnimatedProgressRing({ value, size, radius, strokeWidth, trackColor, color, label }: {
  value: number;
  size: number;
  radius: number;
  strokeWidth: number;
  trackColor: string;
  color: string;
  label: string;
}) {
  const progress = useProgress(value);
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: circumference * (1 - progress.value) }));

  return <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} accessibilityLabel={label}>
    <Circle cx={center} cy={center} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
    <AnimatedCircle cx={center} cy={center} r={radius} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={`${circumference} ${circumference}`} transform={`rotate(-90 ${center} ${center})`} fill="none" animatedProps={animatedProps} />
  </Svg>;
}

export function AnimatedProgressBar({ value, color, height, style }: {
  value: number;
  color: string;
  height: number;
  style?: ViewStyle;
}) {
  const progress = useProgress(value);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: progress.value }] }));

  return <View style={[{ height, borderRadius: height / 2, overflow: "hidden" }, style]}>
    <Animated.View style={[{ width: "100%", height, borderRadius: height / 2, backgroundColor: color, transformOrigin: "left center" }, animatedStyle]} />
  </View>;
}

export function AnimatedHeightBar({ height, color, style, accessibilityLabel }: { height: number; color: string; style?: ViewStyle; accessibilityLabel?: string }) {
  const reducedMotion = useReducedMotion();
  const animatedHeight = useSharedValue(height);

  useEffect(() => {
    animatedHeight.value = reducedMotion ? height : withTiming(height, timing);
  }, [animatedHeight, height, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({ height: animatedHeight.value }));
  return <Animated.View accessibilityLabel={accessibilityLabel} style={[{ backgroundColor: color }, style, animatedStyle]} />;
}
