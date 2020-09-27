/* eslint-disable react/no-render-return-value, react/prefer-stateless-function,
react/no-multi-comp, @typescript-eslint/no-implied-eval */
import React from 'react';
import classNames from 'classnames';
import { act } from 'react-dom/test-utils';
import { genCSSMotionList, CSSMotionListProps } from '../src/CSSMotionList';
import { genCSSMotion } from '../src/CSSMotion';
import { mount, WrapperType } from './wrapper';

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
      injectLeave?: (wrapper: WrapperType) => void,
    ) {
      let leaveCalled = 0;
      function onLeaveEnd() {
        leaveCalled += 1;
      }

      class Demo extends React.Component {
        state = {
          keys: ['a', 'b'],
        };

        render() {
          const { keys } = this.state;
          return (
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
        }
      }

      const wrapper = mount(<Demo />);

      function checkKeys(targetKeys: React.Key[]) {
        const nodeList = wrapper.find('.motion-box');
        const keys = nodeList.map((node) => node.text());
        expect(keys).toEqual(targetKeys);
      }

      checkKeys(['a', 'b']);

      // Change to ['c', 'd']
      act(() => {
        jest.runAllTimers();
        wrapper.update();
      });

      wrapper.setState({ keys: ['c', 'd'] });
      act(() => {
        jest.runAllTimers();
        wrapper.update();
      });

      // Inject leave event
      if (injectLeave) {
        act(() => {
          injectLeave(wrapper);
        });
      }

      act(() => {
        jest.runAllTimers();
        wrapper.update();
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
      testMotion(CSSMotionList, (wrapper) => {
        const motionList = wrapper.find(CSSMotion);
        motionList.slice(0, 2).forEach((cssMotion) => {
          const node = cssMotion.getDOMNode();
          const transitionEndEvent = new Event('transitionend');
          node.dispatchEvent(transitionEndEvent);
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
    const CSSMotionList = genCSSMotionList(false);

    const Demo = ({ keys }) => {
      return (
        <CSSMotionList
          motionName="transition"
          keys={keys}
          onVisibleChanged={onVisibleChanged}
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
    };

    const wrapper = mount(<Demo keys={['a']} />);

    act(() => {
      jest.runAllTimers();
      wrapper.update();
    });

    expect(onVisibleChanged).toHaveBeenCalledWith(true, { key: 'a' });
    onVisibleChanged.mockReset();

    // Remove
    wrapper.setProps({ keys: [] });
    act(() => {
      jest.runAllTimers();
      wrapper.update();
    });
    expect(onVisibleChanged).toHaveBeenCalledWith(false, { key: 'a' });
  });
});
