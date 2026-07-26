import { useSyncExternalStore } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Whether the system asks for reduced motion.
 *
 * Looping animations - the splash spinner, the skeleton pulse - are decoration,
 * and for users who get motion sickness or find movement distracting they are
 * the kind of decoration the OS setting exists to switch off.
 *
 * One device setting, so one native subscription however many components read
 * it. A skeleton screen mounts eight pulses at once, on the cold-start path;
 * subscribing per component would open eight listeners and fire eight native
 * reads for a single answer.
 */

let reduced = false;
let nativeSubscription: { remove: () => void } | null = null;
const listeners = new Set<() => void>();

function publish(next: boolean): void {
  if (next === reduced) return;
  reduced = next;
  listeners.forEach((notify) => notify());
}

function subscribe(onStoreChange: () => void): () => void {
  const isFirstReader = listeners.size === 0;
  listeners.add(onStoreChange);

  if (isFirstReader) {
    nativeSubscription = AccessibilityInfo.addEventListener('reduceMotionChanged', publish);
    AccessibilityInfo.isReduceMotionEnabled().then(publish);
  }

  return () => {
    listeners.delete(onStoreChange);
    if (listeners.size > 0) return;

    nativeSubscription?.remove();
    nativeSubscription = null;
    // With nothing listening, the setting can change without us hearing it, so
    // the cached answer stops being trustworthy the moment the last reader
    // leaves. Dropping it makes the next reader ask again rather than trust it.
    reduced = false;
  };
}

function getSnapshot(): boolean {
  return reduced;
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot);
}
