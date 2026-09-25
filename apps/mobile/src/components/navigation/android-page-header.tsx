import { ProgressiveBlurView } from "expo-backdrop";
import { requireOptionalNativeModule } from "expo";
import { router } from "expo-router";
import { ArrowLeftIcon } from "phosphor-react-native/src/icons/ArrowLeft";
import { type ReactNode } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePalette } from "../../theme";
import { Text } from "../ui/app-text";

const nativeBlurAvailable = requireOptionalNativeModule("BlurView") != null;

export function useAndroidPageScroll() {
  const offset = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      offset.value = Math.max(0, event.contentOffset.y);
    },
  });
  return { offset, onScroll };
}

export function AndroidLargeTitle({ title, offset, back = false }: {
  title: string;
  offset: SharedValue<number>;
  back?: boolean
}) {
  const insets = useSafeAreaInsets();
  const palette = usePalette();
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(offset.value, [0, 60], [1, 0], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(offset.value, [0, 60], [0, -10], Extrapolation.CLAMP) }],
  }));
  if (process.env.EXPO_OS !== "android") return null;
  return <Animated.View
    style={[{ paddingTop: insets.top + (back ? 68 : 18), paddingBottom: 7 }, style]}>
    <Text accessibilityRole="header" style={{
      color: palette.text,
      fontSize: 34,
      lineHeight: 42,
      fontWeight: "800",
    }}>{title}</Text>
  </Animated.View>;
}

export function AndroidPageFrame({ title, offset, children, back = false }: {
  title: string; offset: SharedValue<number>; children: ReactNode; back?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const palette = usePalette();
  const barStyle = useAnimatedStyle(() => ({
    opacity: interpolate(offset.value, [28, 86], [0, 1], Extrapolation.CLAMP),
  }));

  if (process.env.EXPO_OS !== "android") return <>{children}</>;
  return <View style={{ flex: 1, backgroundColor: palette.background }}>
    {children}
    <Animated.View
      pointerEvents="none"
      style={[{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: insets.top + 76,
      }, barStyle]}>
      {nativeBlurAvailable
        ? <ProgressiveBlurView
          edge="top" intensity={85} startOffset={0.3}
          tintColor={`${palette.background}B3`}
          fallbackColor={palette.background} style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}/>
        : <View style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: palette.background,
        }}/>}
      <View style={{
        height: insets.top + 56,
        paddingTop: insets.top,
        paddingLeft: back ? 62 : 18,
        justifyContent: "center",
      }}>
        <Text
          numberOfLines={1}
          style={{ color: palette.text, fontSize: 18, fontWeight: "800" }}>
          {title}
        </Text>
      </View>
    </Animated.View>
    {back ?
      <Pressable
        accessibilityRole="button" accessibilityLabel="Go back"
        onPress={() => router.back()} style={{
        position: "absolute",
        top: insets.top + 6,
        left: 12,
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 22,
        backgroundColor: palette.homeSurface,
      }}>
        <ArrowLeftIcon size={22} color={palette.text} weight="bold"/>
      </Pressable> : null}
  </View>;
}
