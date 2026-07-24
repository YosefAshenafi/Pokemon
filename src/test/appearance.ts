type ColorSchemeGlobal = { __colorScheme?: 'light' | 'dark' };

/**
 * Forces the system colour scheme for a test.
 *
 * Device appearance is a native capability with no implementation under Jest —
 * `Appearance.setColorScheme` is a no-op and jest-expo pins `useColorScheme()`
 * to 'light'. `jest.setup.ts` makes that hook read this value instead. Only the
 * device is faked: every screen and component still resolves its own colours
 * through the real `paperTheme` and `typeColors` tokens.
 */
export function setSystemColorScheme(scheme: 'light' | 'dark'): void {
  (globalThis as ColorSchemeGlobal).__colorScheme = scheme;
}

/** Restores the default light scheme. Call from `afterEach`. */
export function resetSystemColorScheme(): void {
  delete (globalThis as ColorSchemeGlobal).__colorScheme;
}
