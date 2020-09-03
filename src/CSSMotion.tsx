/* eslint-disable react/default-props-match-prop-types, react/no-multi-comp, react/prop-types */
import * as React from 'react';
import { useRef } from 'react';
import findDOMNode from 'rc-util/lib/Dom/findDOMNode';
import { fillRef } from 'rc-util/lib/ref';
import classNames from 'classnames';
import { getTransitionName, supportTransition } from './util/motion';
import {
  MotionStatus,
  STATUS_NONE,
  MotionEventHandler,
  MotionEndEventHandler,
  MotionPrepareEventHandler,
  STEP_PREPARE,
  STEP_START,
} from './interface';
import useStatus from './hooks/useStatus';
import DomWrapper from './DomWrapper';
import { isActive } from './hooks/useStepQueue';

export type CSSMotionConfig =
  | boolean
  | {
      transitionSupport?: boolean;
      /** @deprecated, no need this anymore since `rc-motion` only support latest react */
      forwardRef?: boolean;
    };

export type MotionName =
  | string
  | {
      appear?: string;
      enter?: string;
      leave?: string;
      appearActive?: string;
      enterActive?: string;
      leaveActive?: string;
    };

export interface CSSMotionProps {
  motionName?: MotionName;
  visible?: boolean;
  motionAppear?: boolean;
  motionEnter?: boolean;
  motionLeave?: boolean;
  motionLeaveImmediately?: boolean;
  motionDeadline?: number;
  removeOnLeave?: boolean;
  leavedClassName?: string;
  eventProps?: object;

  // Prepare groups
  onAppearPrepare?: MotionPrepareEventHandler;
  onEnterPrepare?: MotionPrepareEventHandler;
  onLeavePrepare?: MotionPrepareEventHandler;

  // Normal motion groups
  onAppearStart?: MotionEventHandler;
  onEnterStart?: MotionEventHandler;
  onLeaveStart?: MotionEventHandler;

  onAppearActive?: MotionEventHandler;
  onEnterActive?: MotionEventHandler;
  onLeaveActive?: MotionEventHandler;

  onAppearEnd?: MotionEndEventHandler;
  onEnterEnd?: MotionEndEventHandler;
  onLeaveEnd?: MotionEndEventHandler;

  internalRef?: React.Ref<any>;

  children?: (
    props: {
      className?: string;
      style?: React.CSSProperties;
      [key: string]: any;
    },
    ref: (node: any) => void,
  ) => React.ReactElement;
}

export interface CSSMotionState {
  status?: MotionStatus;
  statusActive?: boolean;
  newStatus?: boolean;
  statusStyle?: React.CSSProperties;
  prevProps?: CSSMotionProps;
}

/**
 * `transitionSupport` is used for none transition test case.
 * Default we use browser transition event support check.
 */
export function genCSSMotion(
  config: CSSMotionConfig,
): React.ForwardRefExoticComponent<CSSMotionProps & { ref?: React.Ref<any> }> {
  let transitionSupport = config;

  if (typeof config === 'object') {
    ({ transitionSupport } = config);
  }

  function isSupportTransition(props: CSSMotionProps) {
    return !!(props.motionName && transitionSupport);
  }

  const CSSMotion = React.forwardRef<any, CSSMotionProps>((props, ref) => {
    const {
      // Default config
      visible = true,
      removeOnLeave = true,

      children,
      motionName,
      leavedClassName,
      eventProps,
    } = props;

    const supportMotion = isSupportTransition(props);

    // Ref to the react node, it may be a HTMLElement
    const nodeRef = useRef();
    // Ref to the dom wrapper in case ref can not pass to HTMLElement
    const wrapperNodeRef = useRef();

    function getDomElement() {
      try {
        return findDOMNode<HTMLElement>(
          nodeRef.current || wrapperNodeRef.current,
        );
      } catch (e) {
        // Only happen when `motionDeadline` trigger but element removed.
        return null;
      }
    }

    const [status, statusStep, statusStyle] = useStatus(
      supportMotion,
      visible,
      getDomElement,
      props,
    );

    // ====================== Refs ======================
    const originRef = useRef(ref);
    originRef.current = ref;

    const setNodeRef = React.useCallback((node: any) => {
      nodeRef.current = node;

      fillRef(originRef.current, node);
    }, []);

    // ===================== Render =====================
    let motionChildren: React.ReactNode;

    if (!children) {
      // No children
      motionChildren = null;
    } else if (status === STATUS_NONE || !isSupportTransition(props)) {
      // Stable children
      if (visible) {
        motionChildren = children({ ...eventProps }, setNodeRef);
      } else if (!removeOnLeave) {
        motionChildren = children(
          { ...eventProps, className: leavedClassName },
          setNodeRef,
        );
      } else {
        motionChildren = null;
      }
    } else {
      // In motion
      let statusSuffix: string;
      if (statusStep === STEP_PREPARE) {
        statusSuffix = 'prepare';
      } else if (isActive(statusStep)) {
        statusSuffix = 'active';
      } else if (statusStep === STEP_START) {
        statusSuffix = 'start';
      }

      motionChildren = children(
        {
          ...eventProps,
          className: classNames(getTransitionName(motionName, status), {
            [getTransitionName(
              motionName,
              `${status}-${statusSuffix}`,
            )]: statusSuffix,
            [motionName as string]: typeof motionName === 'string',
          }),
          style: statusStyle,
        },
        setNodeRef,
      );
    }

    return <DomWrapper ref={wrapperNodeRef}>{motionChildren}</DomWrapper>;
  });

  CSSMotion.displayName = 'CSSMotion';

  return CSSMotion;
}

export default genCSSMotion(supportTransition);
