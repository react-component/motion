/* eslint-disable react/no-render-return-value, react/prefer-stateless-function, react/no-multi-comp */
import React from 'react';
import classNames from 'classnames';
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
        const keys = nodeList.map(node => node.text());
        expect(keys).toEqual(targetKeys);
      }

      checkKeys(['a', 'b']);
      wrapper.setState({ keys: ['c', 'd'] });

      if (injectLeave) {
        injectLeave(wrapper);
      }

      jest.runAllTimers();
      wrapper.update();
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
      testMotion(CSSMotionList, wrapper => {
        const motionList = wrapper.find(CSSMotion);
        motionList.slice(0, 2).forEach(cssMotion => {
          cssMotion.props().onLeaveEnd(null, null);
        });
      });
    });

    it('without motion support', () => {
      const CSSMotionList = genCSSMotionList(false);
      testMotion(CSSMotionList);
    });
  });
});
