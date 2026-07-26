import { act, renderHook } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

import { setReducedMotion } from '@/test/motion';

import { useReducedMotion } from '../useReducedMotion';

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useReducedMotion', () => {
  it('assumes motion is fine until the system says otherwise', () => {
    const { result } = renderHook(() => useReducedMotion());

    // Defaulting to false means the first frame animates rather than flickering
    // once the asynchronous read lands.
    expect(result.current).toBe(false);
  });

  it('reports the setting once it has been read', async () => {
    setReducedMotion(true);

    const { result } = renderHook(() => useReducedMotion());
    await act(async () => {});

    expect(result.current).toBe(true);
  });

  it('costs one native subscription however many components read it', async () => {
    let attached = 0;
    let detached = 0;
    jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation(() => {
      attached += 1;
      return {
        remove: () => {
          detached += 1;
        },
      } as ReturnType<typeof AccessibilityInfo.addEventListener>;
    });

    // A skeleton screen mounts eight pulses at once. That must be one listener
    // on the device-wide setting, not eight - and it must not thrash as each
    // one arrives.
    const readers = Array.from({ length: 8 }, () => renderHook(() => useReducedMotion()));
    await act(async () => {});

    expect(attached).toBe(1);
    expect(detached).toBe(0);

    // ...and it is released once, when the last of them goes.
    readers.forEach((reader) => reader.unmount());
    expect(detached).toBe(1);
  });

  it('ignores an answer that arrives after the last reader has gone', async () => {
    let answer: (enabled: boolean) => void = () => {};
    jest
      .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
      .mockReturnValue(new Promise<boolean>((resolve) => { answer = resolve; }));
    jest
      .spyOn(AccessibilityInfo, 'addEventListener')
      .mockReturnValue({ remove: () => {} } as ReturnType<typeof AccessibilityInfo.addEventListener>);

    const first = renderHook(() => useReducedMotion());
    first.unmount();

    // The read belongs to a subscription that no longer exists. Publishing it
    // would leave the store holding an answer nobody asked for, which the next
    // reader would then see before its own read landed.
    await act(async () => {
      answer(true);
    });

    const second = renderHook(() => useReducedMotion());
    expect(second.result.current).toBe(false);
    second.unmount();
  });
});
