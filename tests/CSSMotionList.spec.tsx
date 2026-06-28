/* eslint-disable react/no-render-return-value, react/prefer-stateless-function,
react/no-multi-comp, @typescript-eslint/no-implied-eval */
import { fireEvent, render } from '@testing-library/react';
import { clsx } from 'clsx';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { genCSSMotion } from '../src/CSSMotion';
import type { CSSMotionListProps } from '../src/CSSMotionList';
import { genCSSMotionList } from '../src/CSSMotionList';

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
              className={clsx('motion-box', className)}
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
            className={clsx('motion-box', className)}
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

  it('should support index', () => {
    const CSSMotionList = genCSSMotionList(false);

    const Demo = ({ keys }) => (
      <CSSMotionList motionName="transition" keys={keys}>
        {({ key, style, className, index }) => (
          <div
            key={key}
            style={style}
            className={clsx('motion-box', className)}
          >
            {index}
          </div>
        )}
      </CSSMotionList>
    );

    const { container } = render(<Demo keys={['a', 'b', 'c']} />);
    expect(container.querySelectorAll('.motion-box')[0].textContent).toEqual(
      '0',
    );
    expect(container.querySelectorAll('.motion-box')[1].textContent).toEqual(
      '1',
    );
  });

  it('should support children ref when component is false', () => {
    const CSSMotionList = genCSSMotionList(false);

    const { container } = render(
      <CSSMotionList motionName="transition" component={false} keys={['a']}>
        {({ key }, ref) => (
          <div ref={ref as React.Ref<HTMLDivElement>} className="motion-box">
            {key}
          </div>
        )}
      </CSSMotionList>,
    );

    expect(container.children).toHaveLength(1);
    expect(container.querySelector('.motion-box')).toHaveTextContent('a');
  });

  it('should not require onAllRemoved', () => {
    const CSSMotionList = genCSSMotionList(false);

    const Demo = ({ keys }: { keys: string[] }) => (
      <CSSMotionList motionName="transition" keys={keys}>
        {({ key }) => <div className="motion-box">{key}</div>}
      </CSSMotionList>
    );

    const { rerender } = render(<Demo keys={['a']} />);

    act(() => {
      jest.runAllTimers();
    });

    expect(() => {
      rerender(<Demo keys={[]} />);
      act(() => {
        jest.runAllTimers();
      });
    }).not.toThrow();
  });

  it('should skip state update when removed key is already removed', () => {
    const CSSMotion = React.forwardRef<any, any>(
      ({ children, eventProps, onVisibleChanged }, _ref) => (
        <button
          className="trigger"
          type="button"
          onClick={() => {
            onVisibleChanged(false);
            onVisibleChanged(false);
          }}
        >
          {children(eventProps)}
        </button>
      ),
    );
    const CSSMotionList = genCSSMotionList(false, CSSMotion);

    const Demo = ({ keys }: { keys: string[] }) => (
      <CSSMotionList motionName="transition" keys={keys}>
        {({ key }) => <span className="motion-box">{key}</span>}
      </CSSMotionList>
    );

    const { container, rerender } = render(<Demo keys={['a']} />);
    rerender(<Demo keys={[]} />);
    const trigger = container.querySelector('.trigger');
    fireEvent.click(trigger);

    expect(container.querySelector('.motion-box')).toBeFalsy();
  });

  it('should update event props when key object shape changes', () => {
    const CSSMotionList = genCSSMotionList(false);
    const hasOwn = Object.prototype.hasOwnProperty;

    const Demo = ({ keys }: { keys: CSSMotionListProps['keys'] }) => (
      <CSSMotionList motionName="transition" keys={keys}>
        {props => (
          <div
            className="motion-box"
            data-has-foo={hasOwn.call(props, 'foo')}
            data-has-bar={hasOwn.call(props, 'bar')}
          />
        )}
      </CSSMotionList>
    );

    const { container, rerender } = render(
      <Demo keys={[{ key: 'a', foo: undefined }]} />,
    );
    const getBox = () => container.querySelector<HTMLDivElement>('.motion-box');

    expect(getBox()).toHaveAttribute('data-has-foo', 'true');
    expect(getBox()).toHaveAttribute('data-has-bar', 'false');

    rerender(<Demo keys={[{ key: 'a', bar: undefined }]} />);

    expect(getBox()).toHaveAttribute('data-has-foo', 'false');
    expect(getBox()).toHaveAttribute('data-has-bar', 'true');
  });
});
