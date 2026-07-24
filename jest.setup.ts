/**
 * Global test setup.
 *
 * The only substitutions made here are for native modules that have no
 * JavaScript implementation under Jest — the storage backend and the animation
 * driver. No module under `src/` is ever mocked: screens, hooks, components and
 * the PokeAPI client all run their real implementations, with the network faked
 * at the `fetch` boundary by `src/test/fakePokeApi.ts`.
 */

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
// tests await the resulting UI. Filter only that message; everything else still
// surfaces, so genuine errors are not hidden.
const originalError = console.error;
jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
  if (String(args[0] ?? '').includes('was not wrapped in act')) return;
  originalError(...args);
});

// `useNativeDriver` has no native queue to write to under Jest.
const originalWarn = console.warn;
jest.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
  if (String(args[0] ?? '').includes('useNativeDriver')) return;
  originalWarn(...args);
});
