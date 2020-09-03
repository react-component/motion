import * as React from 'react';
import { useState, useRef } from 'react';
import {
  STATUS_APPEAR,
  STATUS_NONE,
  MotionStatus,
  STATUS_LEAVE,
  STATUS_ENTER,
  MotionEventHandler,
  STEP_PREPARE,
  STEP_START,
  STEP_ACTIVE,
  MotionEvent,
  MotionPrepareEventHandler,
  StepStatus,
} from '../interface';
import { CSSMotionProps } from '../CSSMotion';
import useIsomorphicLayoutEffect from './useIsomorphicLayoutEffect';
import useStepQueue, { DoStep, SkipStep, isActive } from './useStepQueue';
import useDomMotionEvents from './useDomMotionEvents';
// import useFrameStep, { StepMap, StepCell } from './useFrameStep';

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
  }: CSSMotionProps,
): [MotionStatus, StepStatus, React.CSSProperties] {
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

    let canEnd: boolean | void;
    if (status === STATUS_APPEAR && activeRef.current) {
      canEnd = onAppearEnd?.(element, event);
    } else if (status === STATUS_ENTER && activeRef.current) {
      canEnd = onEnterEnd?.(element, event);
    } else if (status === STATUS_LEAVE && activeRef.current) {
      canEnd = onLeaveEnd?.(element, event);
    }

    if (canEnd !== false) {
      setStatus(STATUS_NONE);
      setStyle(null);
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
      case 'appear':
        return {
          [STEP_PREPARE]: onAppearPrepare,
          [STEP_START]: onAppearStart,
          [STEP_ACTIVE]: onAppearActive,
        };

      case 'enter':
        return {
          [STEP_PREPARE]: onEnterPrepare,
          [STEP_START]: onEnterStart,
          [STEP_ACTIVE]: onEnterActive,
        };

      case 'leave':
        return {
          [STEP_PREPARE]: onLeavePrepare,
          [STEP_START]: onLeaveStart,
          [STEP_ACTIVE]: onLeaveActive,
        };

      default:
        return {};
    }
  }, [status]);

  const [startStep, step] = useStepQueue((newStep) => {
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
    if (!supportMotion) {
      return;
    }

    const isMounted = mountedRef.current;
    mountedRef.current = true;

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
  React.useEffect(
    () => () => {
      clearTimeout(deadlineRef.current);
    },
    [],
  );

  // ============================ Styles ============================
  let mergedStyle = style;
  if (eventHandlers[STEP_PREPARE] && step === STEP_START) {
    mergedStyle = {
      transition: 'none',
      ...mergedStyle,
    };
  }

  return [status, step, mergedStyle];
}
