import { AccessibilityInfo } from 'react-native';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => (globalThis as { __colorScheme?: string }).__colorScheme ?? 'light',
}));

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

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    addEventListener: (listener: (state: unknown) => void) => {
      const { netInfoListeners, netInfoState } = require('./src/test/network');
      netInfoListeners().add(listener);
      listener(netInfoState());
      return () => netInfoListeners().delete(listener);
    },
  },
}));

beforeEach(() => {
  require('./src/test/network').resetNetwork();
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  jest
    .spyOn(AccessibilityInfo, 'addEventListener')
    .mockReturnValue({ remove: () => {} } as ReturnType<typeof AccessibilityInfo.addEventListener>);
});

const originalWarn = console.warn;
jest.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
  if (String(args[0] ?? '').includes('useNativeDriver')) return;
  originalWarn(...args);
});
