import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from "react-native-reanimated";
import type { Leaderboard, LeaderboardScope } from "../../data/leaderboards";
import { usePalette } from "../../theme";
import { StandingCard } from "./standing-card";

export function AnimatedStandingOverlay({ board, scope, countryCode, bottom, horizontalInset }: {
  board: Leaderboard | null;
  scope: LeaderboardScope;
  countryCode: string | null;
  bottom: number;
  horizontalInset: number;
}) {
  const palette = usePalette();
  const reducedMotion = useReducedMotion();
  const entryDistance = bottom + 100;
  const translateY = useSharedValue(entryDistance);
  const visible = !!board && (scope !== "country" || !!countryCode);

  useFocusEffect(useCallback(() => {
    cancelAnimation(translateY);
    translateY.set(entryDistance);
    if (visible) {
      translateY.set(reducedMotion ? 0 : withSpring(0, { damping: 24, stiffness: 180, mass: 1, overshootClamping: true }));
    }
    return () => {
      cancelAnimation(translateY);
      translateY.set(entryDistance);
    };
  }, [entryDistance, reducedMotion, translateY, visible]));

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  if (!visible || !board) return null;

  return <Animated.View pointerEvents="none" style={[{
    position: "absolute",
    left: horizontalInset,
    right: horizontalInset,
    bottom,
    borderRadius: 20,
    backgroundColor: palette.homeHero,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 9,
  }, animatedStyle]}>
    <StandingCard board={board} scope={scope} countryCode={countryCode} />
  </Animated.View>;
}
