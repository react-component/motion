import type { CSSMotionConfig, CSSMotionProps } from './CSSMotion';
import CSSMotion, { genCSSMotion } from './CSSMotion';
import type { CSSMotionListProps } from './CSSMotionList';
import CSSMotionList from './CSSMotionList';
import type { MotionEndEventHandler, MotionEventHandler } from './interface';
export { default as Provider } from './context';
export { CSSMotionList, genCSSMotion };
export type {
  CSSMotionConfig,
  CSSMotionProps,
  CSSMotionListProps,
  MotionEventHandler,
  MotionEndEventHandler,
};

export default CSSMotion;
