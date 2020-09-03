import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import raf from 'rc-util/lib/raf';
import {
  STATUS_APPEAR,
  STATUS_NONE,
  MotionStatus,
  STATUS_LEAVE,
  STATUS_ENTER,
  MotionEvent,
  MotionEventHandler,
  STEP_PREPARE,
  MotionPrepareEventHandler,
  STEP_START,
  STEP_ACTIVE,
  STEP_ACTIVATED,
  StepStatus,
} from '../interface';
import { animationEndName, transitionEndName } from '../util/motion';
import { CSSMotionProps } from '../CSSMotion';
import useIsomorphicLayoutEffect from './useIsomorphicLayoutEffect';
import useStepQueue, { DoStep, SkipStep } from './useStepQueue';
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
    onAppearStart,
    onEnterStart,
    onLeaveStart,
    onAppearPrepareStart,
    onEnterPrepareStart,
    onLeavePrepareStart,
    onAppearPrepareEnd,
    onEnterPrepareEnd,
    onLeavePrepareEnd,
    onAppearActive,
    onEnterActive,
    onLeaveActive,
    onAppearEnd,
    onEnterEnd,
    onLeaveEnd,
  }: CSSMotionProps,
): [MotionStatus, boolean, React.CSSProperties] {
  const [status, setStatus] = useState<MotionStatus>();
  const [style, setStyle] = useState<React.CSSProperties | undefined>(null);

  const mountedRef = useRef(false);

  // =========================== Dom Node ===========================
  const cacheElementRef = useRef<HTMLElement>(null);

  function getDomElement() {
    const element = getElement();

    return element || cacheElementRef.current;
  }

  // ============================= Step =============================
  const eventHandlers = React.useMemo<{
    [STEP_START]?: MotionEventHandler;
    [STEP_ACTIVE]?: MotionEventHandler;
  }>(() => {
    switch (status) {
      case 'appear':
        return {
          [STEP_START]: onAppearStart,
          [STEP_ACTIVE]: onAppearActive,
        };

      case 'enter':
        return {
          [STEP_START]: onEnterStart,
          [STEP_ACTIVE]: onEnterActive,
        };

      case 'leave':
        return {
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
      return SkipStep;
    }

    if (step in eventHandlers) {
      setStyle(eventHandlers[step]?.(getDomElement(), null) || null);
    }

    return DoStep;
  });

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

  return [status, step === STEP_ACTIVE || step === STEP_ACTIVATED, style];
}
