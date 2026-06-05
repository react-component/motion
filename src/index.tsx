import type {
  CSSMotionConfig,
  CSSMotionProps,
  CSSMotionRef,
} from './CSSMotion';
import CSSMotion, { genCSSMotion } from './CSSMotion';
import type { CSSMotionListProps } from './CSSMotionList';
import CSSMotionList from './CSSMotionList';
import type { MotionEndEventHandler, MotionEventHandler } from './interface';
export { default as Provider } from './context';
export { CSSMotionList, genCSSMotion };
export type {
  CSSMotionConfig,
  CSSMotionProps,
  CSSMotionRef,
  CSSMotionListProps,
  MotionEventHandler,
  MotionEndEventHandler,
};

export default CSSMotion;
