export const STATUS_NONE = 'none' as const;
export const STATUS_APPEAR = 'appear' as const;
export const STATUS_ENTER = 'enter' as const;
export const STATUS_LEAVE = 'leave' as const;

export type MotionStatus =
  | typeof STATUS_NONE
  | typeof STATUS_APPEAR
  | typeof STATUS_ENTER
  | typeof STATUS_LEAVE;

export type MotionEvent = (TransitionEvent | AnimationEvent) & {
  deadline?: boolean;
};

export type MotionEventHandler = (
  element: HTMLElement,
  event: MotionEvent,
) => React.CSSProperties | void;
