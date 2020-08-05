/* eslint-disable react/default-props-match-prop-types, react/no-multi-comp, react/prop-types */
import React from 'react';
import findDOMNode from 'rc-util/lib/Dom/findDOMNode';
import classNames from 'classnames';
import raf from 'raf';
import {
  getTransitionName,
  animationEndName,
  transitionEndName,
  supportTransition,
} from './util/motion';

const STATUS_NONE = 'none' as const;
const STATUS_APPEAR = 'appear' as const;
const STATUS_ENTER = 'enter' as const;
const STATUS_LEAVE = 'leave' as const;

export type MotionStatus =
  | typeof STATUS_NONE
  | typeof STATUS_APPEAR
  | typeof STATUS_ENTER
  | typeof STATUS_LEAVE;

export type CSSMotionConfig =
  | boolean
  | {
      transitionSupport?: boolean;
      forwardRef?: boolean;
    };

export type MotionEventHandler = (
  element: HTMLElement,
  event: Event,
) => React.CSSProperties | void;

export interface CSSMotionProps {
  motionName?: string;
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

  onAppearEnd?: MotionEventHandler;
  onEnterEnd?: MotionEventHandler;
  onLeaveEnd?: MotionEventHandler;

  internalRef?: React.Ref<any>;

  children?: (
    props: {
      className?: string;
      style?: React.CSSProperties;
      [key: string]: any;
    },
    ref: (node: any) => void,
  ) => React.ReactNode;
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
export function genCSSMotion(config: CSSMotionConfig) {
  let transitionSupport = config;
  let forwardRef = !!React.forwardRef;

  if (typeof config === 'object') {
    transitionSupport = config.transitionSupport;
    forwardRef = 'forwardRef' in config ? config.forwardRef : forwardRef;
  }

  function isSupportTransition(props: CSSMotionProps) {
    return !!(props.motionName && transitionSupport);
  }

  class CSSMotion extends React.Component<CSSMotionProps, CSSMotionState> {
    static defaultProps = {
      visible: true,
      motionEnter: true,
      motionAppear: true,
      motionLeave: true,
      removeOnLeave: true,
    };

    $cacheEle: HTMLElement = null;

    node = null;

    raf = null;

    destroyed = false;

    state: CSSMotionState = {
      status: STATUS_NONE,
      statusActive: false,
      newStatus: false,
      statusStyle: null,
    };

    static getDerivedStateFromProps(
      props: CSSMotionProps,
      { prevProps, status: prevStatus },
    ) {
      if (!isSupportTransition(props)) return {};

      const {
        visible,
        motionAppear,
        motionEnter,
        motionLeave,
        motionLeaveImmediately,
      } = props;
      const newState: Partial<CSSMotionState> = {
        prevProps: props,
      };

      // Clean up status if prop set to false
      if (
        (prevStatus === STATUS_APPEAR && !motionAppear) ||
        (prevStatus === STATUS_ENTER && !motionEnter) ||
        (prevStatus === STATUS_LEAVE && !motionLeave)
      ) {
        newState.status = STATUS_NONE;
        newState.statusActive = false;
        newState.newStatus = false;
      }

      // Appear
      if (!prevProps && visible && motionAppear) {
        newState.status = STATUS_APPEAR;
        newState.statusActive = false;
        newState.newStatus = true;
      }

      // Enter
      if (prevProps && !prevProps.visible && visible && motionEnter) {
        newState.status = STATUS_ENTER;
        newState.statusActive = false;
        newState.newStatus = true;
      }

      // Leave
      if (
        (prevProps && prevProps.visible && !visible && motionLeave) ||
        (!prevProps && motionLeaveImmediately && !visible && motionLeave)
      ) {
        newState.status = STATUS_LEAVE;
        newState.statusActive = false;
        newState.newStatus = true;
      }

      return newState;
    }

    componentDidMount() {
      this.onDomUpdate();
    }

    componentDidUpdate() {
      this.onDomUpdate();
    }

    componentWillUnmount() {
      this.destroyed = true;
      this.removeEventListener(this.$cacheEle);
      this.cancelNextFrame();
    }

    onDomUpdate = () => {
      const { status, newStatus } = this.state;
      const {
        onAppearStart,
        onEnterStart,
        onLeaveStart,
        onAppearActive,
        onEnterActive,
        onLeaveActive,
        motionAppear,
        motionEnter,
        motionLeave,
      } = this.props;

      if (!isSupportTransition(this.props)) {
        return;
      }

      // Event injection
      const $ele = this.getElement();
      if (this.$cacheEle !== $ele) {
        this.removeEventListener(this.$cacheEle);
        this.addEventListener($ele);
        this.$cacheEle = $ele;
      }

      // Init status
      if (newStatus && status === STATUS_APPEAR && motionAppear) {
        this.updateStatus(onAppearStart, null, null, () => {
          this.updateActiveStatus(onAppearActive, STATUS_APPEAR);
        });
      } else if (newStatus && status === STATUS_ENTER && motionEnter) {
        this.updateStatus(onEnterStart, null, null, () => {
          this.updateActiveStatus(onEnterActive, STATUS_ENTER);
        });
      } else if (newStatus && status === STATUS_LEAVE && motionLeave) {
        this.updateStatus(onLeaveStart, null, null, () => {
          this.updateActiveStatus(onLeaveActive, STATUS_LEAVE);
        });
      }
    };

    onMotionEnd = event => {
      const { status, statusActive } = this.state;
      const { onAppearEnd, onEnterEnd, onLeaveEnd } = this.props;
      if (status === STATUS_APPEAR && statusActive) {
        this.updateStatus(onAppearEnd, { status: STATUS_NONE }, event);
      } else if (status === STATUS_ENTER && statusActive) {
        this.updateStatus(onEnterEnd, { status: STATUS_NONE }, event);
      } else if (status === STATUS_LEAVE && statusActive) {
        this.updateStatus(onLeaveEnd, { status: STATUS_NONE }, event);
      }
    };

    setNodeRef = (node: any) => {
      const { internalRef } = this.props;
      this.node = node;

      if (typeof internalRef === 'function') {
        internalRef(node);
      } else if (internalRef && 'current' in internalRef) {
        (internalRef as React.MutableRefObject<any>).current = node;
      }
    };

    getElement = () => {
      try {
        return findDOMNode<HTMLElement>(this.node || this);
      } catch (e) {
        /**
         * Fallback to cache element.
         * This is only happen when `motionDeadline` trigger but element removed.
         */
        return this.$cacheEle;
      }
    };

    addEventListener = ($ele: HTMLElement) => {
      if (!$ele) return;

      $ele.addEventListener(transitionEndName, this.onMotionEnd);
      $ele.addEventListener(animationEndName, this.onMotionEnd);
    };

    removeEventListener = ($ele: HTMLElement) => {
      if (!$ele) return;

      $ele.removeEventListener(transitionEndName, this.onMotionEnd);
      $ele.removeEventListener(animationEndName, this.onMotionEnd);
    };

    updateStatus = (
      styleFunc: MotionEventHandler,
      additionalState: Partial<CSSMotionState>,
      event?: Event,
      callback?: Function,
    ) => {
      const statusStyle = styleFunc
        ? styleFunc(this.getElement(), event)
        : null;

      if (statusStyle === false || this.destroyed) return;

      let nextStep;
      if (callback) {
        nextStep = () => {
          this.nextFrame(callback);
        };
      }

      this.setState(
        {
          statusStyle: typeof statusStyle === 'object' ? statusStyle : null,
          newStatus: false,
          ...additionalState,
        },
        nextStep,
      ); // Trigger before next frame & after `componentDidMount`
    };

    updateActiveStatus = (
      styleFunc: MotionEventHandler,
      currentStatus: MotionStatus,
    ) => {
      // `setState` use `postMessage` to trigger at the end of frame.
      // Let's use requestAnimationFrame to update new state in next frame.
      this.nextFrame(() => {
        const { status } = this.state;
        if (status !== currentStatus) return;

        const { motionDeadline } = this.props;

        this.updateStatus(styleFunc, { statusActive: true });

        if (motionDeadline > 0) {
          setTimeout(() => {
            this.onMotionEnd({
              deadline: true,
            });
          }, motionDeadline);
        }
      });
    };

    nextFrame = func => {
      this.cancelNextFrame();
      this.raf = raf(func);
    };

    cancelNextFrame = () => {
      if (this.raf) {
        raf.cancel(this.raf);
        this.raf = null;
      }
    };

    render() {
      const { status, statusActive, statusStyle } = this.state;
      const {
        children,
        motionName,
        visible,
        removeOnLeave,
        leavedClassName,
        eventProps,
      } = this.props;

      if (!children) return null;

      if (status === STATUS_NONE || !isSupportTransition(this.props)) {
        if (visible) {
          return children({ ...eventProps }, this.setNodeRef);
        }

        if (!removeOnLeave) {
          return children(
            { ...eventProps, className: leavedClassName },
            this.setNodeRef,
          );
        }

        return null;
      }

      return children(
        {
          ...eventProps,
          className: classNames(getTransitionName(motionName, status), {
            [getTransitionName(motionName, `${status}-active`)]: statusActive,
            [motionName]: typeof motionName === 'string',
          }),
          style: statusStyle,
        },
        this.setNodeRef,
      );
    }
  }

  if (!forwardRef) {
    return CSSMotion;
  }

  return React.forwardRef((props: CSSMotionProps, ref: any) => (
    <CSSMotion internalRef={ref} {...props} />
  ));
}

export default genCSSMotion(supportTransition);
