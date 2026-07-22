import { useEffect, useRef } from 'react';
import { Animated, Easing, type ViewProps } from 'react-native';

/** Gently pulses its children — used by skeleton placeholders. */
export function Pulse({ style, children, ...rest }: ViewProps) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
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
  }, [opacity]);

  return (
    <Animated.View style={[{ opacity }, style]} {...rest}>
      {children}
    </Animated.View>
  );
}
