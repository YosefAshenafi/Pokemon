import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Pokeball } from './Pokeball';

interface ScreenHeaderProps {
  children: ReactNode;
}

/**
 * Shared brand-blue header: safe-area aware, rounded bottom edge, with a
 * half-clipped pokéball watermark in the top-right corner.
 */
export function ScreenHeader({ children }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="overflow-hidden rounded-b-[28px] bg-brand px-5 pb-6"
      style={{ paddingTop: insets.top + 8 }}
    >
      <Pokeball size={170} style={{ position: 'absolute', top: -40, right: -40 }} />
      {children}
    </View>
  );
}
