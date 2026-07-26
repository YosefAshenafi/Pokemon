import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Whether the system asks for reduced motion.
 *
 * Looping animations - the splash spinner, the skeleton pulse - are decoration,
 * and for users who get motion sickness or find movement distracting they are
 * the kind of decoration the OS setting exists to switch off. Defaults to
 * `false` so the first frame animates normally rather than flickering once the
 * asynchronous read resolves.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    // Only store an answer that differs from what we already assumed. Most
    // devices report `false`, so this skips a re-render on every mount - and
    // keeps the asynchronous read from scheduling work after the component,
    // or a test, has moved on.
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) =>
      setReduced((current) => (current === enabled ? current : enabled)),
    );
    return () => subscription.remove();
  }, []);

  return reduced;
}
