import { View } from 'react-native';

import { SKELETON_COUNT } from '@/constants/ui';

import { SkeletonCard } from './SkeletonCard';

export function SkeletonGrid() {
  return (
    <View className="flex-row flex-wrap justify-between px-4 pt-4">
      {Array.from({ length: SKELETON_COUNT }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}
