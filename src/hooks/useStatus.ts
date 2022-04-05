import * as React from 'react';
import { useRef, useEffect } from 'react';
import useState from 'rc-util/lib/hooks/useState';
import {
  STATUS_APPEAR,
  STATUS_NONE,
  STATUS_LEAVE,
  STATUS_ENTER,
  STEP_PREPARE,
  STEP_START,
  STEP_ACTIVE,
} from '../interface';
import type {
  MotionStatus,
  MotionEventHandler,
  MotionEvent,
  MotionPrepareEventHandler,
  StepStatus,
} from '../interface';
import type { CSSMotionProps } from '../CSSMotion';
import useIsomorphicLayoutEffect from './useIsomorphicLayoutEffect';
import useStepQueue, { DoStep, SkipStep, isActive } from './useStepQueue';
import useDomMotionEvents from './useDomMotionEvents';

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
    onAppearPrepare,
    onEnterPrepare,
    onLeavePrepare,
    onAppearStart,
    onEnterStart,
    onLeaveStart,
    onAppearActive,
    onEnterActive,
    onLeaveActive,
    onAppearEnd,
    onEnterEnd,
    onLeaveEnd,
    onVisibleChanged,
  }: CSSMotionProps,
): [MotionStatus, StepStatus, React.CSSProperties, boolean] {
  // Used for outer render usage to avoid `visible: false & status: none` to render nothing
  const [asyncVisible, setAsyncVisible] = useState<boolean>();
  const [status, setStatus] = useState<MotionStatus>(STATUS_NONE);
  const [style, setStyle] = useState<React.CSSProperties | undefined>(null);

  const mountedRef = useRef(false);
  const deadlineRef = useRef(null);

  // =========================== Dom Node ===========================
  const cacheElementRef = useRef<HTMLElement>(null);

  function getDomElement() {
    const element = getElement();

    return element || cacheElementRef.current;
  }

  // ========================== Motion End ==========================
  const activeRef = useRef(false);

  function onInternalMotionEnd(event: MotionEvent) {
    const element = getDomElement();
    if (event && !event.deadline && event.target !== element) {
      // event exists
      // not initiated by deadline
      // transitionEnd not fired by inner elements
      return;
    }

    const currentActive = activeRef.current;

    let canEnd: boolean | void;
    if (status === STATUS_APPEAR && currentActive) {
      canEnd = onAppearEnd?.(element, event);
    } else if (status === STATUS_ENTER && currentActive) {
      canEnd = onEnterEnd?.(element, event);
    } else if (status === STATUS_LEAVE && currentActive) {
      canEnd = onLeaveEnd?.(element, event);
    }

    // Only update status when `canEnd` and not destroyed
    if (status !== STATUS_NONE && currentActive && canEnd !== false) {
      setStatus(STATUS_NONE, true);
      setStyle(null, true);
    }
  }

  const [patchMotionEvents] = useDomMotionEvents(onInternalMotionEnd);

  // ============================= Step =============================
  const eventHandlers = React.useMemo<{
    [STEP_PREPARE]?: MotionPrepareEventHandler;
    [STEP_START]?: MotionEventHandler;
    [STEP_ACTIVE]?: MotionEventHandler;
  }>(() => {
    switch (status) {
      case STATUS_APPEAR:
        return {
          [STEP_PREPARE]: onAppearPrepare,
          [STEP_START]: onAppearStart,
          [STEP_ACTIVE]: onAppearActive,
        };

      case STATUS_ENTER:
        return {
          [STEP_PREPARE]: onEnterPrepare,
          [STEP_START]: onEnterStart,
          [STEP_ACTIVE]: onEnterActive,
        };

      case STATUS_LEAVE:
        return {
          [STEP_PREPARE]: onLeavePrepare,
          [STEP_START]: onLeaveStart,
          [STEP_ACTIVE]: onLeaveActive,
        };

      default:
        return {};
    }
  }, [status]);

  const [startStep, step] = useStepQueue(status, newStep => {
    // Only prepare step can be skip
    if (newStep === STEP_PREPARE) {
      const onPrepare = eventHandlers[STEP_PREPARE];
      if (!onPrepare) {
        return SkipStep;
      }

      return onPrepare(getDomElement());
    }

    // Rest step is sync update
    if (step in eventHandlers) {
      setStyle(eventHandlers[step]?.(getDomElement(), null) || null);
    }

    if (step === STEP_ACTIVE) {
      // Patch events when motion needed
      patchMotionEvents(getDomElement());

      if (motionDeadline > 0) {
        clearTimeout(deadlineRef.current);
        deadlineRef.current = setTimeout(() => {
          onInternalMotionEnd({
            deadline: true,
          } as MotionEvent);
        }, motionDeadline);
      }
    }

    return DoStep;
  });

  const active = isActive(step);
  activeRef.current = active;

  // ============================ Status ============================
  // Update with new status
  useIsomorphicLayoutEffect(() => {
    setAsyncVisible(visible);

    const isMounted = mountedRef.current;
    mountedRef.current = true;

    if (!supportMotion) {
      return;
    }

    let nextStatus: MotionStatus;

    // Appear
    if (!isMounted && visible && motionAppear) {
      nextStatus = STATUS_APPEAR;
    }

    // Enter
    if (isMounted && visible && motionEnter) {
      nextStatus = STATUS_ENTER;
    }

    // Leave
    if (
      (isMounted && !visible && motionLeave) ||
      (!isMounted && motionLeaveImmediately && !visible && motionLeave)
    ) {
      nextStatus = STATUS_LEAVE;
    }

    // Update to next status
    if (nextStatus) {
      setStatus(nextStatus);
      startStep();
    }
  }, [visible]);

  // ============================ Effect ============================
  // Reset when motion changed
  useEffect(() => {
    if (
      // Cancel appear
      (status === STATUS_APPEAR && !motionAppear) ||
      // Cancel enter
      (status === STATUS_ENTER && !motionEnter) ||
      // Cancel leave
      (status === STATUS_LEAVE && !motionLeave)
    ) {
      setStatus(STATUS_NONE);
    }
  }, [motionAppear, motionEnter, motionLeave]);

  useEffect(
    () => () => {
      clearTimeout(deadlineRef.current);
    },
    [],
  );

  // Trigger `onVisibleChanged`
  useEffect(() => {
    if (asyncVisible !== undefined && status === STATUS_NONE) {
      onVisibleChanged?.(asyncVisible);
    }
  }, [asyncVisible, status]);

  // ============================ Styles ============================
  let mergedStyle = style;
  if (eventHandlers[STEP_PREPARE] && step === STEP_START) {
    mergedStyle = {
      transition: 'none',
      ...mergedStyle,
    };
  }

  return [status, step, mergedStyle, asyncVisible ?? visible];
}
