/**
 * Global test setup.
 *
 * The only substitutions made here are for native modules that have no
 * JavaScript implementation under Jest — the storage backend and the animation
 * driver. No module under `src/` is ever mocked: screens, hooks, components and
 * the PokeAPI client all run their real implementations, with the network faked
 * at the `fetch` boundary by `src/test/fakePokeApi.ts`.
 */

import { AccessibilityInfo } from 'react-native';

// AsyncStorage is a native SQLite/SharedPreferences module. This swaps the whole
// storage backend for the library's official in-memory one — the React Native
// equivalent of pointing an integration suite at an in-memory database.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Device appearance is a native capability, and jest-expo pins it to 'light'.
// This makes it settable so the dark scheme can be exercised; use the
// `setSystemColorScheme` helper in `src/test/appearance.ts` rather than this
// global directly. Only the device is faked — components still resolve their
// own colours through the real theme tokens.
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => (globalThis as { __colorScheme?: string }).__colorScheme ?? 'light',
}));

// The root layout resolves an AsyncStorage migration before it renders the app,
// and Paper's PortalManager mounts on its own schedule. Both settle after the
// synchronous render, which React reports as an un-acted update even though the
// tests await the resulting UI.
//
// React names the offending component in the message, so the filter is limited
// to these two. An un-acted update from anywhere else - the class of bug behind
// flaky tests and updates after unmount - still fails loudly, which a blanket
// `includes('act')` filter would have hidden.
const ACT_WARNING = 'was not wrapped in act';
const KNOWN_ACT_SOURCES = ['RootLayout', 'PortalManager', 'PortalHost'];

const originalError = console.error;
jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
  const message = String(args[0] ?? '');
  const isKnownActWarning =
    message.includes(ACT_WARNING) && KNOWN_ACT_SOURCES.some((name) => message.includes(name));
  if (isKnownActWarning) return;
  originalError(...args);
});

// Reduce-motion is a native accessibility setting with no implementation under
// Jest, where the real read resolves `undefined` after the render has settled.
// Defaulting it per test keeps that asynchronous answer from landing as an
// un-acted update; `src/test/motion.ts` overrides it where a test needs it on.
beforeEach(() => {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  jest
    .spyOn(AccessibilityInfo, 'addEventListener')
    .mockReturnValue({ remove: () => {} } as ReturnType<typeof AccessibilityInfo.addEventListener>);
});

// `useNativeDriver` has no native queue to write to under Jest.
const originalWarn = console.warn;
jest.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
  if (String(args[0] ?? '').includes('useNativeDriver')) return;
  originalWarn(...args);
});
