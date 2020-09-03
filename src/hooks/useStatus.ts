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
} from '../interface';
import { animationEndName, transitionEndName } from '../util/motion';
import { CSSMotionProps } from '../CSSMotion';
import useIsomorphicLayoutEffect from './useIsomorphicLayoutEffect';
import useFrameStep, { StepMap, StepCell } from './useFrameStep';

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
  const stepMap = {} as StepMap;

  function fillStepMap(
    filledStatus: MotionStatus,
    enabled: boolean,
    onPrepareStart: MotionPrepareEventHandler,
    onPrepareEnd: MotionPrepareEventHandler,
  ) {
    if (enabled) {
      const stepList: StepCell[] = [];

      const fillEventHandler = (onPrepare: MotionPrepareEventHandler) => {
        if (onPrepare) {
          stepList.push({
            step: STEP_PREPARE,
            doNext: async (info) => {
              const nextStyle = await onPrepare(getDomElement(), null);

              // Skip when ood
              if (info.isCanceled()) return;

              setStyle(nextStyle as React.CSSProperties);
            },
          });
        }
      };

      // onPrepareStart
      fillEventHandler(onPrepareStart);

      // onPrepareEnd
      fillEventHandler(onPrepareEnd);

      // onStart
      stepList.push({ step: STEP_START });

      // onActive
      stepList.push({ step: STEP_ACTIVE });

      stepMap[filledStatus] = stepList;
    }
  }

  // Appear
  fillStepMap(
    STATUS_APPEAR,
    motionAppear,
    onAppearPrepareStart,
    onAppearPrepareEnd,
  );

  // Enter
  fillStepMap(
    STATUS_ENTER,
    motionEnter,
    onEnterPrepareStart,
    onEnterPrepareEnd,
  );

  // Leave
  fillStepMap(
    STATUS_LEAVE,
    motionLeave,
    onLeavePrepareStart,
    onLeavePrepareEnd,
  );

  const [step] = useFrameStep(status, stepMap);

  // ============================ Status ============================
  // Update with new status
  useIsomorphicLayoutEffect(() => {
    if (!supportMotion) {
      return;
    }

    const isMounted = mountedRef.current;
    mountedRef.current = true;

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

    // Update to next status
    if (nextStatus) {
      setStatus(nextStatus);
      setStyle(nextStyle as React.CSSProperties);
    }
  }, [visible]);

  console.log('>>>>>', status, step);

  return [status, step === STEP_ACTIVE, style];
}
