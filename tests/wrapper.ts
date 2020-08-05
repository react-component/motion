import { mount as enzymeMount, ReactWrapper } from 'enzyme';

export type MountParam = Parameters<typeof enzymeMount>;

export interface WrapperType extends ReactWrapper {
  triggerMotionEvent: () => WrapperType;
}

export function mount(...args: MountParam) {
  return enzymeMount(...args) as WrapperType;
}
