/* eslint-disable
  react/no-render-return-value, max-classes-per-file,
  react/prefer-stateless-function, react/no-multi-comp
*/
import React from 'react';
import classNames from 'classnames';
import { mount } from './wrapper';
import RefCSSMotion, { genCSSMotion, CSSMotionProps } from '../src/CSSMotion';

describe('CSSMotion', () => {
  const CSSMotion = genCSSMotion({
    transitionSupport: true,
    forwardRef: false,
  });

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('transition', () => {
    function onCollapse() {
      return { height: 0 };
    }
    function onExpand() {
      return { height: 100 };
    }

    const actionList: {
      name: string;
      props: CSSMotionProps;
      visible: boolean[];
      oriHeight: number;
      tgtHeight: number;
    }[] = [
      {
        name: 'appear',
        props: {
          motionAppear: true,
          onAppearStart: onCollapse,
          onAppearActive: onExpand,
        },
        visible: [true],
        oriHeight: 0,
        tgtHeight: 100,
      },
      {
        name: 'enter',
        props: {
          motionEnter: true,
          onEnterStart: onCollapse,
          onEnterActive: onExpand,
        },
        visible: [false, true],
        oriHeight: 0,
        tgtHeight: 100,
      },
      {
        name: 'leave',
        props: {
          motionLeave: true,
          onLeaveStart: onExpand,
          onLeaveActive: onCollapse,
        },
        visible: [true, false],
        oriHeight: 100,
        tgtHeight: 0,
      },
    ];

    actionList.forEach(({ name, props, visible, oriHeight, tgtHeight }) => {
      class Demo extends React.Component {
        state = {
          visible: visible[0],
        };

        render() {
          return (
            <CSSMotion
              motionName="transition"
              motionAppear={false}
              motionEnter={false}
              motionLeave={false}
              visible={this.state.visible}
              {...props}
            >
              {({ style, className }) => (
                <div
                  style={style}
                  className={classNames('motion-box', className)}
                />
              )}
            </CSSMotion>
          );
        }
      }

      it(name, () => {
        const nextVisible = visible[1];
        const wrapper = mount(<Demo />);

        function doStartTest() {
          wrapper.update();
          const boxNode = wrapper.find('.motion-box');
          expect(boxNode.hasClass('transition')).toBeTruthy();
          expect(boxNode.hasClass(`transition-${name}`)).toBeTruthy();
          expect(boxNode.hasClass(`transition-${name}-active`)).toBeFalsy();
          expect(boxNode.props().style.height).toEqual(oriHeight);

          // Motion active
          jest.runAllTimers();
          wrapper.update();
          const activeBoxNode = wrapper.find('.motion-box');
          expect(activeBoxNode.hasClass('transition')).toBeTruthy();
          expect(activeBoxNode.hasClass(`transition-${name}`)).toBeTruthy();
          expect(
            activeBoxNode.hasClass(`transition-${name}-active`),
          ).toBeTruthy();
          expect(activeBoxNode.props().style.height).toEqual(tgtHeight);

          // Motion end
          wrapper.triggerMotionEvent();
          jest.runAllTimers();
          wrapper.update();

          if (nextVisible === false) {
            expect(wrapper.find('.motion-box')).toHaveLength(0);
          } else if (nextVisible !== undefined) {
            const finalBoxNode = wrapper.find('.motion-box');
            expect(finalBoxNode.hasClass('transition')).toBeFalsy();
            expect(finalBoxNode.hasClass(`transition-${name}`)).toBeFalsy();
            expect(
              finalBoxNode.hasClass(`transition-${name}-active`),
            ).toBeFalsy();

            expect(finalBoxNode.props().style).toBeFalsy();
          }
        }

        // Delay for the visible finished
        if (nextVisible !== undefined) {
          wrapper.setState({ visible: nextVisible });
          doStartTest();
        } else {
          doStartTest();
        }
      });
    });
  });

  describe('animation', () => {
    const actionList = [
      {
        name: 'appear',
        props: { motionAppear: true },
        visible: [true],
      },
      {
        name: 'enter',
        props: { motionEnter: true },
        visible: [false, true],
      },
      {
        name: 'leave',
        props: { motionLeave: true },
        visible: [true, false],
      },
    ];

    actionList.forEach(({ name, visible, props }) => {
      class Demo extends React.Component {
        state = {
          visible: visible[0],
        };

        render() {
          return (
            <CSSMotion
              motionName="animation"
              motionAppear={false}
              motionEnter={false}
              motionLeave={false}
              visible={this.state.visible}
              {...props}
            >
              {({ style, className }) => (
                <div
                  style={style}
                  className={classNames('motion-box', className)}
                />
              )}
            </CSSMotion>
          );
        }
      }

      it(name, () => {
        const wrapper = mount(<Demo />);
        wrapper.update();
        const nextVisible = visible[1];

        function doStartTest() {
          const boxNode = wrapper.find('.motion-box');

          expect(boxNode.hasClass('animation')).toBeTruthy();
          expect(boxNode.hasClass(`animation-${name}`)).toBeTruthy();
          expect(boxNode.hasClass(`animation-${name}-active`)).toBeFalsy();

          // Motion active
          jest.runAllTimers();
          wrapper.update();
          const activeBoxNode = wrapper.find('.motion-box');
          expect(activeBoxNode.hasClass('animation')).toBeTruthy();
          expect(activeBoxNode.hasClass(`animation-${name}`)).toBeTruthy();
          expect(
            activeBoxNode.hasClass(`animation-${name}-active`),
          ).toBeTruthy();
        }

        // Delay for the visible finished
        if (nextVisible !== undefined) {
          wrapper.setState({ visible: nextVisible });
          doStartTest();
        } else {
          doStartTest();
        }
      });
    });
  });

  describe('immediately', () => {
    it('motionLeaveImmediately', () => {
      const wrapper = mount(
        <CSSMotion
          motionName="transition"
          motionLeaveImmediately
          visible={false}
        >
          {({ style, className }) => (
            <div
              style={style}
              className={classNames('motion-box', className)}
            />
          )}
        </CSSMotion>,
      );
      wrapper.update();

      const boxNode = wrapper.find('.motion-box');
      expect(boxNode.hasClass('transition')).toBeTruthy();
      expect(boxNode.hasClass('transition-leave')).toBeTruthy();
      expect(boxNode.hasClass('transition-leave-active')).toBeFalsy();

      // Motion active
      jest.runAllTimers();
      wrapper.update();
      const activeBoxNode = wrapper.find('.motion-box');
      expect(activeBoxNode.hasClass('transition')).toBeTruthy();
      expect(activeBoxNode.hasClass('transition-leave')).toBeTruthy();
      expect(activeBoxNode.hasClass('transition-leave-active')).toBeTruthy();
    });
  });

  it('no transition', () => {
    const NoCSSTransition = genCSSMotion({
      transitionSupport: false,
      forwardRef: false,
    });

    const wrapper = mount(
      <NoCSSTransition motionName="transition">
        {({ style, className }) => (
          <div style={style} className={classNames('motion-box', className)} />
        )}
      </NoCSSTransition>,
    );

    const boxNode = wrapper.find('.motion-box');
    expect(boxNode.hasClass('transition')).toBeFalsy();
    expect(boxNode.hasClass('transition-appear')).toBeFalsy();
    expect(boxNode.hasClass('transition-appear-active')).toBeFalsy();
  });

  it('forwardRef', () => {
    const domRef = React.createRef();
    mount(
      <RefCSSMotion motionName="transition" ref={domRef}>
        {({ style, className }, ref) => (
          <div
            ref={ref}
            style={style}
            className={classNames('motion-box', className)}
          />
        )}
      </RefCSSMotion>,
    );

    expect(domRef.current instanceof HTMLElement).toBeTruthy();
  });
});
