import { useEffect } from 'react';
import { Animated, Easing, useAnimatedValue, type ViewProps } from 'react-native';

import { useReducedMotion } from '@/hooks/useReducedMotion';

export function Pulse({ style, children, ...rest }: ViewProps) {
  const opacity = useAnimatedValue(1);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, reducedMotion]);

  return (
    <Animated.View style={[{ opacity }, style]} {...rest}>
      {children}
    </Animated.View>
  );
}
