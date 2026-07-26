import { AccessibilityInfo } from 'react-native';

/**
 * Forces the system "reduce motion" setting for a test.
 *
 * The setting is a native capability with no implementation under Jest, so the
 * two `AccessibilityInfo` calls `useReducedMotion` makes are stubbed here. Only
 * the device preference is faked - the hook, and every component reading it,
 * run their real implementations.
 */
export function setReducedMotion(enabled: boolean): void {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(enabled);
  jest
    .spyOn(AccessibilityInfo, 'addEventListener')
    .mockReturnValue({ remove: () => {} } as ReturnType<typeof AccessibilityInfo.addEventListener>);
}
