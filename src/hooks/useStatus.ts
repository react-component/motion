import * as React from 'react';
import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import raf from 'rc-util/lib/raf';
import canUseDom from 'rc-util/lib/Dom/canUseDom';
import {
  STATUS_APPEAR,
  STATUS_NONE,
  MotionStatus,
  STATUS_LEAVE,
  STATUS_ENTER,
  MotionEvent,
} from '../interface';
import { animationEndName, transitionEndName } from '../util/motion';
import { CSSMotionProps } from '../CSSMotion';

// It's safe to use `useLayoutEffect` but the warning is annoying
const useIsomorphicLayoutEffect = canUseDom ? useLayoutEffect : useEffect;

export default function useStatus(
  supportMotion: boolean,
  visible: boolean,
  getElement: () => HTMLElement,
  {
    motionEnter = true,
    motionAppear = true,
    motionLeave = true,
    motionDeadline,
    motionLeaveImmediately,
    onAppearStart,
    onEnterStart,
    onLeaveStart,
    onAppearActive,
    onEnterActive,
    onLeaveActive,
    onAppearEnd,
    onEnterEnd,
    onLeaveEnd,
  }: CSSMotionProps,
): [MotionStatus, boolean, React.CSSProperties] {
  const [status, setStatus] = useState<MotionStatus>(STATUS_NONE);
  const [active, setActive] = useState(false);
  const [style, setStyle] = useState<React.CSSProperties | undefined>(null);

  const mountedRef = useRef(false);
  const nextFrameRef = useRef(null);
  const deadlineRef = useRef(null);

  // =========================== Dom Node ===========================
  const cacheElementRef = useRef<HTMLElement>(null);

  function getDomElement() {
    const element = getElement();

    return element || cacheElementRef.current;
  }

  // ========================== Next Frame ==========================
  function cancelNextFrame() {
    raf.cancel(nextFrameRef.current);
  }

  /** `useLayoutEffect` will render in the closest frame which motion may not ready */
  function nextFrame(callback: () => void, delay = 2) {
    cancelNextFrame();

    nextFrameRef.current = raf(() => {
      if (delay <= 1) {
        callback();
      } else {
        nextFrame(callback, delay - 1);
      }
    });
  }

  // ============================ Motion ============================
  const motionEndRef = useRef({
    status,
    active,
    onAppearEnd,
    onEnterEnd,
    onLeaveEnd,
  });
  motionEndRef.current = {
    status,
    active,
    onAppearEnd,
    onEnterEnd,
    onLeaveEnd,
  };

  const onInternalMotionEnd = React.useCallback((event: MotionEvent) => {
    const element = getDomElement();
    if (event && !event.deadline && event.target !== element) {
      // event exists
      // not initiated by deadline
      // transitionEnd not fired by inner elements
      return;
    }

    let canEnd: boolean | void;
    const cache = motionEndRef.current;
    if (cache.status === STATUS_APPEAR && cache.active) {
      canEnd = cache.onAppearEnd?.(element, event);
    } else if (cache.status === STATUS_ENTER && cache.active) {
      canEnd = cache.onEnterEnd?.(element, event);
    } else if (cache.status === STATUS_LEAVE && cache.active) {
      canEnd = cache.onLeaveEnd?.(element, event);
    }

    if (canEnd !== false) {
      setStatus(STATUS_NONE);
    }
  }, []);

  function removeMotionEvents(element: HTMLElement) {
    if (element) {
      element.removeEventListener(transitionEndName, onInternalMotionEnd);
      element.removeEventListener(animationEndName, onInternalMotionEnd);
    }
  }

  function patchMotionEvents(element: HTMLElement) {
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

  // =========================== Clean Up ===========================
  function cleanUp() {
    cancelNextFrame();
    clearTimeout(deadlineRef.current);
  }

  // ============================ Status ============================
  // Update with new status
  useIsomorphicLayoutEffect(() => {
    if (!supportMotion) {
      return;
    }

    const isMounted = mountedRef.current;
    mountedRef.current = true;

    // nextFrame(() => {
    let nextStatus: MotionStatus;
    let nextStyle: React.CSSProperties | void;

    // Appear
    if (!isMounted && visible && motionAppear) {
      nextStatus = STATUS_APPEAR;
      nextStyle = onAppearStart?.(getDomElement(), null);
    }

    // Enter
    if (isMounted && visible && motionEnter) {
      nextStatus = STATUS_ENTER;
      nextStyle = onEnterStart?.(getDomElement(), null);
    }

    // Leave
    if (
      (isMounted && !visible && motionLeave) ||
      (!isMounted && motionLeaveImmediately && !visible && motionLeave)
    ) {
      nextStatus = STATUS_LEAVE;
      nextStyle = onLeaveStart?.(getDomElement(), null);
    }

    // Merge status
    if (nextStatus) {
      // Clean up when status changed
      cleanUp();

      setStatus(nextStatus);
      setActive(false);
      setStyle(nextStyle as React.CSSProperties);
    }
    // });
  }, [visible]);

  // Update active status
  useIsomorphicLayoutEffect(() => {
    if (!supportMotion) {
      return;
    }

    if (status && status !== STATUS_NONE && !active) {
      // Delay one frame for motion active change
      nextFrame(() => {
        let nextStyle: React.CSSProperties | void;
        const element = getDomElement();

        switch (status) {
          case 'appear': {
            nextStyle = onAppearActive?.(element, null);
            break;
          }

          case 'enter': {
            nextStyle = onEnterActive?.(element, null);
            break;
          }

          case 'leave': {
            nextStyle = onLeaveActive?.(element, null);
            break;
          }
        }

        // Add event handler with element
        patchMotionEvents(element);

        setActive(true);
        setStyle(nextStyle as React.CSSProperties);

        if (motionDeadline > 0) {
          deadlineRef.current = setTimeout(() => {
            onInternalMotionEnd({
              deadline: true,
            } as MotionEvent);
          }, motionDeadline);
        }
      });
    }
  }, [status, active]);

  // Clean up status if prop set to false
  useEffect(() => {
    if (
      (status === STATUS_APPEAR && !motionAppear) ||
      (status === STATUS_ENTER && !motionEnter) ||
      (status === STATUS_LEAVE && !motionLeave)
    ) {
      cancelNextFrame();
      setStatus(STATUS_NONE);
      setActive(false);
    }
  }, [status, motionAppear, motionEnter, motionLeave]);

  // Clean up when removed
  useEffect(
    () => () => {
      removeMotionEvents(cacheElementRef.current);
      cleanUp();
    },
    [],
  );

  return [status, status !== STATUS_NONE ? active : false, style];
}
