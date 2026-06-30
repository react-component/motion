/* eslint-disable
  react/no-render-return-value, max-classes-per-file,
  react/prefer-stateless-function, react/no-multi-comp
*/
import { act, fireEvent, render } from '@testing-library/react';
import { clsx } from 'clsx';
import React from 'react';
import { genCSSMotion, type CSSMotionRef } from '../src/CSSMotion';

describe('StrictMode', () => {
  const CSSMotion = genCSSMotion({
    transitionSupport: true,
  });

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('motion should end', () => {
    const ref = React.createRef<CSSMotionRef>();

    const { container } = render(
      <React.StrictMode>
        <CSSMotion motionName="transition" ref={ref} motionAppear visible>
          {({ style, className }) => {
            return (
              <div style={style} className={clsx('motion-box', className)} />
            );
          }}
        </CSSMotion>
      </React.StrictMode>,
    );

    expect(ref.current.enableMotion()).toBeTruthy();

    const node = container.querySelector('.motion-box');
    expect(node).toHaveClass('transition-appear', 'transition-appear-start');

    // Active
    act(() => {
      jest.runAllTimers();
    });
    expect(ref.current.inMotion()).toBeTruthy();
    expect(node).not.toHaveClass('transition-appear-start');
    expect(node).toHaveClass('transition-appear-active');

    // Trigger End
    fireEvent.transitionEnd(node);
    act(() => {
      jest.runAllTimers();
    });
    expect(node).not.toHaveClass('transition-appear');

    expect(ref.current.inMotion()).toBeFalsy();
    expect(ref.current.nativeElement).toBe(node);
  });
});
