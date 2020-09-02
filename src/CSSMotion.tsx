/* eslint-disable react/default-props-match-prop-types, react/no-multi-comp, react/prop-types */
import * as React from 'react';
import { useRef } from 'react';
import findDOMNode from 'rc-util/lib/Dom/findDOMNode';
import { fillRef } from 'rc-util/lib/ref';
import classNames from 'classnames';
import {
  getTransitionName,
  supportTransition,
} from './util/motion';
import {
  MotionStatus,
  STATUS_NONE,
  MotionEvent,
  MotionEventHandler,
} from './interface';
import useStatus from './hooks/useStatus';
import DomWrapper from './DomWrapper';

export type CSSMotionConfig =
  | boolean
  | {
      transitionSupport?: boolean;
      /** @deprecated, no need this anymore since `rc-motion` only support latest react */
      forwardRef?: boolean;
    };

export type MotionEndEventHandler = (
  element: HTMLElement,
  event: MotionEvent,
) => boolean | void;

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
): React.ForwardRefRenderFunction<any, CSSMotionProps> {
  let transitionSupport = config;

  if (typeof config === 'object') {
    ({ transitionSupport } = config);
  }

  function isSupportTransition(props: CSSMotionProps) {
    return !!(props.motionName && transitionSupport);
  }

  const CSSMotion: React.ForwardRefRenderFunction<any, CSSMotionProps> = (
    props,
    ref,
  ) => {
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

    const [status, statusActive, statusStyle] = useStatus(
      supportMotion,
      visible,
      getDomElement,
      props,
    );

    const setNodeRef = (node: any) => {
      nodeRef.current = node;

      fillRef(ref, node);
    };

    if (!children) return null;

    if (status === STATUS_NONE || !isSupportTransition(props)) {
      if (visible) {
        return children({ ...eventProps }, setNodeRef);
      }

      if (!removeOnLeave) {
        return children(
          { ...eventProps, className: leavedClassName },
          setNodeRef,
        );
      }

      return null;
    }

    return (
      <DomWrapper ref={wrapperNodeRef}>
        {children(
          {
            ...eventProps,
            className: classNames(getTransitionName(motionName, status), {
              [getTransitionName(motionName, `${status}-active`)]: statusActive,
              [motionName as string]: typeof motionName === 'string',
            }),
            style: statusStyle,
          },
          setNodeRef,
        )}
      </DomWrapper>
    );
  };

  return CSSMotion;
}

export default genCSSMotion(supportTransition);
