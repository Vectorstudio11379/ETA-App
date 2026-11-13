import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

export function useScreenMotion() {
  const progress = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  useFocusEffect(
    useCallback(() => {
      progress.value = withTiming(1, {
        duration: reducedMotion ? 0 : 240,
        easing: Easing.out(Easing.cubic),
      });

      return () => {
        progress.value = withTiming(0, { duration: reducedMotion ? 0 : 120 });
      };
    }, [progress, reducedMotion])
  );

  return useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 8 }],
  }));
}

export { Animated };
