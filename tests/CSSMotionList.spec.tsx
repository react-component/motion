/* eslint-disable react/no-render-return-value, react/prefer-stateless-function,
react/no-multi-comp, @typescript-eslint/no-implied-eval */
import React from 'react';
import classNames from 'classnames';
import { act } from 'react-dom/test-utils';
import { render, fireEvent } from '@testing-library/react';
import { genCSSMotionList } from '../src/CSSMotionList';
import type { CSSMotionListProps } from '../src/CSSMotionList';
import { genCSSMotion } from '../src/CSSMotion';

describe('CSSMotionList', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('diff should work', () => {
    function testMotion(
      CSSMotionList: React.ComponentType<CSSMotionListProps>,
      injectLeave?: (wrapper: HTMLElement) => void,
    ) {
      let leaveCalled = 0;
      function onLeaveEnd() {
        leaveCalled += 1;
      }

      const Demo = ({ keys }: { keys: string[] }) => (
        <CSSMotionList
          motionName="transition"
          keys={keys}
          onLeaveEnd={onLeaveEnd}
        >
          {({ key, style, className }) => (
            <div
              key={key}
              style={style}
              className={classNames('motion-box', className)}
            >
              {key}
            </div>
          )}
        </CSSMotionList>
      );

      const { container, rerender } = render(<Demo keys={['a', 'b']} />);

      function checkKeys(targetKeys: React.Key[]) {
        const nodeList = Array.from(
          container.querySelectorAll<HTMLDivElement>('.motion-box'),
        );
        const keys = nodeList.map(node => node.textContent);
        expect(keys).toEqual(targetKeys);
      }

      checkKeys(['a', 'b']);

      // Change to ['c', 'd']
      act(() => {
        jest.runAllTimers();
      });

      rerender(<Demo keys={['c', 'd']} />);
      act(() => {
        jest.runAllTimers();
      });

      // Inject leave event
      if (injectLeave) {
        act(() => {
          injectLeave(container);
        });
      }

      act(() => {
        jest.runAllTimers();
      });
      checkKeys(['c', 'd']);

      if (injectLeave) {
        expect(leaveCalled).toEqual(2);
      }
    }

    it('with motion support', () => {
      const CSSMotion = genCSSMotion({
        transitionSupport: true,
        forwardRef: false,
      });
      const CSSMotionList = genCSSMotionList(true, CSSMotion);
      testMotion(CSSMotionList, container => {
        const nodeList = Array.from(container.querySelectorAll('.motion-box'));
        nodeList.slice(0, 2).forEach(node => {
          fireEvent.transitionEnd(node);
        });
      });
    });

    it('without motion support', () => {
      const CSSMotionList = genCSSMotionList(false);
      testMotion(CSSMotionList);
    });
  });

  it('onVisibleChanged', () => {
    const onVisibleChanged = jest.fn();
    const onAllRemoved = jest.fn();
    const CSSMotionList = genCSSMotionList(false);

    const Demo = ({ keys }) => (
      <CSSMotionList
        motionName="transition"
        keys={keys}
        onVisibleChanged={onVisibleChanged}
        onAllRemoved={onAllRemoved}
      >
        {({ key, style, className }) => (
          <div
            key={key}
            style={style}
            className={classNames('motion-box', className)}
          >
            {key}
          </div>
        )}
      </CSSMotionList>
    );

    const { rerender } = render(<Demo keys={['a']} />);
    expect(onAllRemoved).not.toHaveBeenCalled();

    act(() => {
      jest.runAllTimers();
    });

    expect(onVisibleChanged).toHaveBeenCalledWith(true, { key: 'a' });
    onVisibleChanged.mockReset();
    expect(onAllRemoved).not.toHaveBeenCalled();

    // Remove
    rerender(<Demo keys={[]} />);
    act(() => {
      jest.runAllTimers();
    });

    expect(onVisibleChanged).toHaveBeenCalledWith(false, { key: 'a' });
    expect(onAllRemoved).toHaveBeenCalled();
  });
});
