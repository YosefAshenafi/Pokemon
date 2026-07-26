import { useSyncExternalStore } from 'react';
import { AccessibilityInfo } from 'react-native';

let reduced = false;
let nativeSubscription: { remove: () => void } | null = null;
const listeners = new Set<() => void>();

let generation = 0;

function publish(next: boolean): void {
  if (next === reduced) return;
  reduced = next;
  listeners.forEach((notify) => notify());
}

function subscribe(onStoreChange: () => void): () => void {
  const isFirstReader = listeners.size === 0;
  listeners.add(onStoreChange);

  if (isFirstReader) {
    const attachment = (generation += 1);
    nativeSubscription = AccessibilityInfo.addEventListener('reduceMotionChanged', publish);
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (attachment === generation) publish(enabled);
    });
  }

  return () => {
    listeners.delete(onStoreChange);
    if (listeners.size > 0) return;

    generation += 1;
    nativeSubscription?.remove();
    nativeSubscription = null;
    reduced = false;
  };
}

function getSnapshot(): boolean {
  return reduced;
}

/** Whether the system asks for reduced motion; one shared native subscription. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot);
}
