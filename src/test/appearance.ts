type ColorSchemeGlobal = { __colorScheme?: 'light' | 'dark' };

/** Forces the system colour scheme for a test. */
export function setSystemColorScheme(scheme: 'light' | 'dark'): void {
  (globalThis as ColorSchemeGlobal).__colorScheme = scheme;
}

export function resetSystemColorScheme(): void {
  delete (globalThis as ColorSchemeGlobal).__colorScheme;
}
