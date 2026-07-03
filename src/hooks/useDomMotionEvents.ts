import * as React from 'react';
import { useRef } from 'react';

import type { MotionEvent } from '../interface';
import { animationEndName, transitionEndName } from '../util/motion';

export default (
  onInternalMotionEnd: (event: MotionEvent) => void,
): [
  (element: HTMLElement | null) => void,
  (element: HTMLElement | null) => void,
] => {
  const cacheElementRef = useRef<HTMLElement | null>(null);

  // Remove events
  function removeMotionEvents(element: HTMLElement | null) {
    if (element) {
      element.removeEventListener(transitionEndName, onInternalMotionEnd);
      element.removeEventListener(animationEndName, onInternalMotionEnd);
    }
  }

  // Patch events
  function patchMotionEvents(element: HTMLElement | null) {
    if (cacheElementRef.current && cacheElementRef.current !== element) {
      removeMotionEvents(cacheElementRef.current);
    }

    if (element && element !== cacheElementRef.current) {
      element.addEventListener(transitionEndName, onInternalMotionEnd);
      element.addEventListener(animationEndName, onInternalMotionEnd);

      // Save as cache in case dom removed trigger by `motionDeadline`
      cacheElementRef.current = element;
    }
  }

  // Clean up when removed
  React.useEffect(
    () => () => {
      removeMotionEvents(cacheElementRef.current);
      cacheElementRef.current = null;
    },
    [],
  );

  return [patchMotionEvents, removeMotionEvents];
};
