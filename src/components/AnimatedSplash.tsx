import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, useColorScheme } from 'react-native';

import { darkColors, lightColors } from '@/theme/paperTheme';

const LOGO_SIZE = 140;
const SPIN_MS = 1100; // one full rotation
const MIN_VISIBLE_MS = 1400;
const FADE_MS = 350;

interface AnimatedSplashProps {
  onFinish: () => void;
}

/** Full-screen splash that spins the pokéball logo, then fades into the app. */
export function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
  const isDark = useColorScheme() === 'dark';
  const backgroundColor = isDark ? darkColors.bg : lightColors.bg;

  const [spin] = useState(() => new Animated.Value(0));
  const [opacity] = useState(() => new Animated.Value(1));

  const onLayout = useCallback(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: SPIN_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();

    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_MS,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(({ finished }) => {
        loop.stop();
        if (finished) onFinish();
      });
    }, MIN_VISIBLE_MS);

    return () => {
      clearTimeout(timer);
      loop.stop();
      // Also stop the fade: clearing the timer only helps before it starts, so
      // without this an unmount mid-fade would still run the completion
      // callback and call `onFinish` on a component that is already gone.
      opacity.stopAnimation();
    };
  }, [spin, opacity, onFinish]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View
      testID="animated-splash"
      onLayout={onLayout}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, styles.center, { backgroundColor, opacity }]}
    >
      <Animated.View style={{ transform: [{ rotate }] }}>
        <Image
          source={require('../../assets/images/logo-mark.png')}
          accessible={false}
          contentFit="contain"
          style={{ width: LOGO_SIZE, height: LOGO_SIZE }}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', zIndex: 10 },
});
