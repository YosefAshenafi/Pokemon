import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenHeaderProps {
  children: ReactNode;
}

/** Shared brand-blue header, with a clipped pokéball watermark top-right. */
export function ScreenHeader({ children }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="overflow-hidden rounded-b-[28px] bg-brand px-5 pb-6"
      style={{ paddingTop: insets.top + 8 }}
    >
      <View
        pointerEvents="none"
        importantForAccessibility="no-hide-descendants"
        style={{ position: 'absolute', top: -60, right: -60, opacity: 0.13 }}
      >
        <Image
          source={require('../../assets/images/logo-mark.png')}
          accessible={false}
          contentFit="contain"
          style={{ width: 250, height: 250 }}
        />
      </View>
      {children}
    </View>
  );
}
