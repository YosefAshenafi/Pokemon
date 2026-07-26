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

    const readers = Array.from({ length: 8 }, () => renderHook(() => useReducedMotion()));
    await act(async () => {});

    expect(attached).toBe(1);
    expect(detached).toBe(0);

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

    await act(async () => {
      answer(true);
    });

    const second = renderHook(() => useReducedMotion());
    expect(second.result.current).toBe(false);
    second.unmount();
  });
});
