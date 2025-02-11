import { useEvent } from '@rc-component/util';
import useState from '@rc-component/util/lib/hooks/useState';
import useSyncState from '@rc-component/util/lib/hooks/useSyncState';
import * as React from 'react';
import { useEffect, useRef } from 'react';
import type { CSSMotionProps } from '../CSSMotion';
import type {
  MotionEvent,
  MotionEventHandler,
  MotionPrepareEventHandler,
  MotionStatus,
  StepStatus,
} from '../interface';
import {
  STATUS_APPEAR,
  STATUS_ENTER,
  STATUS_LEAVE,
  STATUS_NONE,
  STEP_ACTIVE,
  STEP_PREPARE,
  STEP_PREPARED,
  STEP_START,
} from '../interface';
import useDomMotionEvents from './useDomMotionEvents';
import useIsomorphicLayoutEffect from './useIsomorphicLayoutEffect';
import useStepQueue, { DoStep, isActive, SkipStep } from './useStepQueue';

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
): [() => MotionStatus, StepStatus, React.CSSProperties, boolean] {
  // Used for outer render usage to avoid `visible: false & status: none` to render nothing
  const [asyncVisible, setAsyncVisible] = useState<boolean>();
  const [getStatus, setStatus] = useSyncState<MotionStatus>(STATUS_NONE);
  const [style, setStyle] = useState<React.CSSProperties | undefined>(null);

  const currentStatus = getStatus();

  const mountedRef = useRef(false);
  const deadlineRef = useRef(null);

  // =========================== Dom Node ===========================
  function getDomElement() {
    return getElement();
  }

  // ========================== Motion End ==========================
  const activeRef = useRef(false);

  /**
   * Clean up status & style
   */
  function updateMotionEndStatus() {
    setStatus(STATUS_NONE);
    setStyle(null, true);
  }

  const onInternalMotionEnd = useEvent((event: MotionEvent) => {
    const status = getStatus();
    // Do nothing since not in any transition status.
    // This may happen when `motionDeadline` trigger.
    if (status === STATUS_NONE) {
      return;
    }

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
    if (currentActive && canEnd !== false) {
      updateMotionEndStatus();
    }
  });

  const [patchMotionEvents] = useDomMotionEvents(onInternalMotionEnd);

  // ============================= Step =============================
  const getEventHandlers = (targetStatus: MotionStatus) => {
    switch (targetStatus) {
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
  };

  const eventHandlers = React.useMemo<{
    [STEP_PREPARE]?: MotionPrepareEventHandler;
    [STEP_START]?: MotionEventHandler;
    [STEP_ACTIVE]?: MotionEventHandler;
  }>(() => getEventHandlers(currentStatus), [currentStatus]);

  const [startStep, step] = useStepQueue(
    currentStatus,
    !supportMotion,
    newStep => {
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

      if (step === STEP_ACTIVE && currentStatus !== STATUS_NONE) {
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

      if (step === STEP_PREPARED) {
        updateMotionEndStatus();
      }

      return DoStep;
    },
  );

  const active = isActive(step);
  activeRef.current = active;

  // ============================ Status ============================
  const visibleRef = useRef<boolean | null>(null);

  // Update with new status
  useIsomorphicLayoutEffect(() => {
    // When use Suspense, the `visible` will repeat trigger,
    // But not real change of the `visible`, we need to skip it.
    // https://github.com/ant-design/ant-design/issues/44379
    if (mountedRef.current && visibleRef.current === visible) {
      return;
    }

    setAsyncVisible(visible);

    const isMounted = mountedRef.current;
    mountedRef.current = true;

    // if (!supportMotion) {
    //   return;
    // }

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

    const nextEventHandlers = getEventHandlers(nextStatus);

    // Update to next status
    if (nextStatus && (supportMotion || nextEventHandlers[STEP_PREPARE])) {
      setStatus(nextStatus);
      startStep();
    } else {
      // Set back in case no motion but prev status has prepare step
      setStatus(STATUS_NONE);
    }

    visibleRef.current = visible;
  }, [visible]);

  // ============================ Effect ============================
  // Reset when motion changed
  useEffect(() => {
    if (
      // Cancel appear
      (currentStatus === STATUS_APPEAR && !motionAppear) ||
      // Cancel enter
      (currentStatus === STATUS_ENTER && !motionEnter) ||
      // Cancel leave
      (currentStatus === STATUS_LEAVE && !motionLeave)
    ) {
      setStatus(STATUS_NONE);
    }
  }, [motionAppear, motionEnter, motionLeave]);

  useEffect(
    () => () => {
      mountedRef.current = false;
      clearTimeout(deadlineRef.current);
    },
    [],
  );

  // Trigger `onVisibleChanged`
  const firstMountChangeRef = React.useRef(false);
  useEffect(() => {
    // [visible & motion not end] => [!visible & motion end] still need trigger onVisibleChanged
    if (asyncVisible) {
      firstMountChangeRef.current = true;
    }

    if (asyncVisible !== undefined && currentStatus === STATUS_NONE) {
      // Skip first render is invisible since it's nothing changed
      if (firstMountChangeRef.current || asyncVisible) {
        onVisibleChanged?.(asyncVisible);
      }
      firstMountChangeRef.current = true;
    }
  }, [asyncVisible, currentStatus]);

  // ============================ Styles ============================
  let mergedStyle = style;
  if (eventHandlers[STEP_PREPARE] && step === STEP_START) {
    mergedStyle = {
      transition: 'none',
      ...mergedStyle,
    };
  }

  return [getStatus, step, mergedStyle, asyncVisible ?? visible];
}
