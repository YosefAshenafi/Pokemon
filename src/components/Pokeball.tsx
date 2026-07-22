import { View, type StyleProp, type ViewStyle } from 'react-native';

interface PokeballProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
}

const WHITE_16 = 'rgba(255, 255, 255, 0.16)';

/** Decorative pokéball watermark drawn with plain Views (no image asset). */
export function Pokeball({ size = 150, style }: PokeballProps) {
  const ring = Math.round(size * 0.09);
  const innerHeight = size - ring * 2;

  return (
    <View
      pointerEvents="none"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: ring,
          borderColor: WHITE_16,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: innerHeight / 2 - ring / 2,
          height: ring,
          backgroundColor: WHITE_16,
        }}
      />
      <View
        style={{
          width: size * 0.3,
          height: size * 0.3,
          borderRadius: (size * 0.3) / 2,
          borderWidth: Math.max(ring - 2, 2),
          borderColor: WHITE_16,
        }}
      />
    </View>
  );
}
