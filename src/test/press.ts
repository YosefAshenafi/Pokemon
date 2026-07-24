import { act, fireEvent } from '@testing-library/react-native';
import type { ReactTestInstance } from 'react-test-renderer';

const TOUCH_EVENT = {
  nativeEvent: {
    touches: [],
    changedTouches: [],
    identifier: 1,
    locationX: 1,
    locationY: 1,
    pageX: 1,
    pageY: 1,
    target: 1,
    timestamp: 0,
  },
  persist: () => {},
};

/**
 * Holds an element down and leaves it held, so the pressed-state styling can be
 * asserted.
 *
 * `fireEvent(el, 'pressIn')` invokes the `onPressIn` prop directly, which never
 * reaches Pressability's internal pressed state — granting the touch responder
 * does, exactly as a real finger would.
 */
export function holdDown(element: ReactTestInstance): void {
  act(() => {
    fireEvent(element, 'responderGrant', TOUCH_EVENT);
  });
}
