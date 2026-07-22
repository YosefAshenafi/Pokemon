import { View } from 'react-native';

import { Pulse } from './Pulse';

/** Loading placeholder matching the geometry of a PokemonCard. */
export function SkeletonCard() {
  return (
    <Pulse className="mb-3 w-[48%] rounded-2xl border border-[#ECEEF6] bg-surface p-3">
      <View className="flex-row items-center justify-between">
        <View className="h-3 w-20 rounded-full bg-track" />
        <View className="h-3 w-8 rounded-full bg-track" />
      </View>
      <View className="mt-3 h-24 w-full rounded-xl bg-track" />
      <View className="mt-3 flex-row gap-1.5">
        <View className="h-[22px] w-14 rounded-full bg-track" />
        <View className="h-[22px] w-14 rounded-full bg-track" />
      </View>
    </Pulse>
  );
}
