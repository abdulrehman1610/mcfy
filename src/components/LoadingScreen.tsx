import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Rect, Circle, G, Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '../constants/theme';

export default function LoadingScreen() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.7);

  useEffect(() => {
    // Subtle pulsing animation
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1, // Infinite repeat
      true // Reverse
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.7, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.imageContainer, animatedStyle]}>
        <Svg width="100%" height="100%" viewBox="0 0 24 24" fill="none">
          <Rect width={24} height={24} fill="#000000" />
          <Circle cx={12} cy={12} r={10} fill="#121212" stroke="#262626" strokeWidth={0.2} />
          <G transform="translate(4, 4) scale(0.66)">
            <Path d="M12 18V5" stroke="#fbbf24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4" stroke="#fbbf24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5" stroke="#fbbf24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M17.997 5.125a4 4 0 0 1 2.526 5.77" stroke="#fbbf24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M18 18a4 4 0 0 0 2-7.464" stroke="#fbbf24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517" stroke="#fbbf24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M6 18a4 4 0 0 1-2-7.464" stroke="#fbbf24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M6.003 5.125a4 4 0 0 0-2.526 5.77" stroke="#fbbf24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: 150,
    height: 150,
  },
});
