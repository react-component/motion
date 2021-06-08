/* eslint-disable
  react/no-render-return-value, max-classes-per-file,
  react/prefer-stateless-function, react/no-multi-comp
*/
import React from 'react';
import { act } from 'react-dom/test-utils';
import classNames from 'classnames';
import { mount } from './wrapper';
import type { CSSMotionProps } from '../src/CSSMotion';
import RefCSSMotion, { genCSSMotion } from '../src/CSSMotion';
import ReactDOM from 'react-dom';

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
              {({ style, className, visible: motionVisible }) => {
                expect(motionVisible).toEqual(this.state.visible);
                return (
                  <div
                    style={style}
                    className={classNames('motion-box', className)}
                  />
                );
              }}
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
          act(() => {
            jest.runAllTimers();
            wrapper.update();
          });

          const activeBoxNode = wrapper.find('.motion-box');
          expect(activeBoxNode.hasClass('transition')).toBeTruthy();
          expect(activeBoxNode.hasClass(`transition-${name}`)).toBeTruthy();
          expect(
            activeBoxNode.hasClass(`transition-${name}-active`),
          ).toBeTruthy();
          expect(activeBoxNode.props().style.height).toEqual(tgtHeight);

          // Motion end
          wrapper.triggerMotionEvent();

          act(() => {
            jest.runAllTimers();
            wrapper.update();
          });

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

    it('stop transition if config motion to false', () => {
      const wrapper = mount(
        <CSSMotion motionName="transition" visible>
          {({ style, className }) => (
            <div
              style={style}
              className={classNames('motion-box', className)}
            />
          )}
        </CSSMotion>,
      );
      wrapper.update();
      let boxNode = wrapper.find('.motion-box');
      expect(boxNode.hasClass('transition')).toBeTruthy();
      expect(boxNode.hasClass('transition-appear')).toBeTruthy();
      expect(boxNode.hasClass('transition-appear-active')).toBeFalsy();

      act(() => {
        wrapper.setProps({ motionAppear: false });
        jest.runAllTimers();
        wrapper.update();
      });

      boxNode = wrapper.find('.motion-box');
      expect(boxNode.hasClass('transition')).toBeFalsy();
      expect(boxNode.hasClass('transition-appear')).toBeFalsy();
      expect(boxNode.hasClass('transition-appear-active')).toBeFalsy();
    });

    it('quick switch should have correct status', async () => {
      const wrapper = mount(
        <CSSMotion motionName="transition">
          {({ style, className }) => (
            <div
              style={style}
              className={classNames('motion-box', className)}
            />
          )}
        </CSSMotion>,
      );

      wrapper.setProps({ visible: true });
      act(() => {
        jest.runAllTimers();
      });
      wrapper.setProps({ visible: false });
      act(() => {
        jest.runAllTimers();
        wrapper.update();
      });

      let boxNode = wrapper.find('.motion-box');
      expect(boxNode.hasClass('transition')).toBeTruthy();
      expect(boxNode.hasClass('transition-leave')).toBeTruthy();
      expect(boxNode.hasClass('transition-leave-active')).toBeTruthy();

      wrapper.setProps({ visible: true });
      await act(() => {
        return Promise.resolve().then(() => {
          wrapper.setProps({ visible: false });
        });
      });
      act(() => {
        jest.runAllTimers();
        wrapper.update();
      });

      boxNode = wrapper.find('.motion-box');
      expect(boxNode.hasClass('transition')).toBeTruthy();
      expect(boxNode.hasClass('transition-leave')).toBeTruthy();
      expect(boxNode.hasClass('transition-leave-active')).toBeTruthy();

      wrapper.unmount();
    });

    describe('deadline should work', () => {
      function test(name: string, Component: React.ComponentType<any>) {
        it(name, () => {
          const onAppearEnd = jest.fn();

          mount(
            <CSSMotion
              motionName="transition"
              motionDeadline={1000}
              onAppearEnd={onAppearEnd}
              visible
            >
              {({ style, className }, ref) => (
                <Component
                  ref={ref}
                  style={style}
                  className={classNames('motion-box', className)}
                />
              )}
            </CSSMotion>,
          );

          expect(onAppearEnd).not.toHaveBeenCalled();
          act(() => {
            jest.runAllTimers();
          });
          expect(onAppearEnd).toHaveBeenCalled();
        });
      }

      test(
        'without ref',
        React.forwardRef(props => <div {...props} />),
      );

      test(
        'FC with ref',
        React.forwardRef((props, ref) => <div {...props} ref={ref} />),
      );

      test(
        'FC but not dom ref',
        React.forwardRef((props, ref) => {
          React.useImperativeHandle(ref, () => ({}));
          return <div {...props} />;
        }),
      );
    });

    it('not crash when no children', () => {
      const wrapper = mount(<CSSMotion motionName="transition" visible />);
      expect(wrapper.render()).toMatchSnapshot();
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
          // Motion active
          act(() => {
            jest.runAllTimers();
            wrapper.update();
          });

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

  it('not block motion when motion set delay', () => {
    const wrapper = mount(
      <CSSMotion visible>
        {({ style, className }) => (
          <div style={style} className={classNames('motion-box', className)} />
        )}
      </CSSMotion>,
    );

    wrapper.setProps({
      motionName: 'animation',
      motionLeave: true,
      visible: false,
    });

    act(() => {
      jest.runAllTimers();
      wrapper.update();
    });

    const activeBoxNode = wrapper.find('.motion-box');
    expect(activeBoxNode.hasClass(`animation-leave-active`)).toBeTruthy();
  });

  describe('immediately', () => {
    it('motionLeaveImmediately', async () => {
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
      await act(async () => {
        jest.runAllTimers();
        await Promise.resolve();
        wrapper.update();
      });

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

  it("onMotionEnd shouldn't be fired by inner element", () => {
    const onLeaveEnd = jest.fn();
    const wrapper = mount(
      <CSSMotion
        visible
        motionName="bamboo"
        onLeaveEnd={onLeaveEnd}
        removeOnLeave={false}
      >
        {(_, ref) => (
          <div className="outer-block" ref={ref}>
            <div className="inner-block" />
          </div>
        )}
      </CSSMotion>,
    );

    function resetLeave() {
      act(() => {
        wrapper.setProps({ visible: true });
        jest.runAllTimers();
        wrapper.update();

        wrapper.setProps({ visible: false });
        jest.runAllTimers();
        wrapper.update();
      });
    }

    resetLeave();
    wrapper.triggerMotionEvent();
    expect(onLeaveEnd).toHaveBeenCalledTimes(1);

    resetLeave();
    wrapper.triggerMotionEvent(wrapper.find('.outer-block'));
    expect(onLeaveEnd).toHaveBeenCalledTimes(2);

    resetLeave();
    wrapper.triggerMotionEvent(wrapper.find('.inner-block'));
    expect(onLeaveEnd).toHaveBeenCalledTimes(2);
  });

  it('switch dom should work', () => {
    const Demo = ({
      Component,
      ...props
    }: Partial<CSSMotionProps> & { Component: any }) => {
      return (
        <CSSMotion {...props} motionName="bamboo">
          {({ style, className }) => (
            <Component
              style={style}
              className={classNames('motion-box', className)}
            />
          )}
        </CSSMotion>
      );
    };

    const onLeaveEnd = jest.fn();
    const wrapper = mount(
      <Demo
        visible
        onLeaveEnd={onLeaveEnd}
        motionDeadline={233}
        Component="div"
      />,
    );

    act(() => {
      jest.runAllTimers();
      wrapper.update();
    });

    wrapper.setProps({ Component: 'p', visible: false });
    act(() => {
      jest.runAllTimers();
      wrapper.update();
    });

    expect(onLeaveEnd).toHaveBeenCalled();
  });

  it('prepare should block motion start', async () => {
    let lockResolve: Function;
    const onAppearPrepare = jest.fn(
      () =>
        new Promise(resolve => {
          lockResolve = resolve;
        }),
    );

    const wrapper = mount(
      <CSSMotion visible motionName="bamboo" onAppearPrepare={onAppearPrepare}>
        {({ style, className }) => (
          <div style={style} className={classNames('motion-box', className)} />
        )}
      </CSSMotion>,
    );

    act(() => {
      jest.runAllTimers();
      wrapper.update();
    });

    // Locked
    expect(
      wrapper.find('.motion-box').hasClass('bamboo-appear-prepare'),
    ).toBeTruthy();

    // Release
    await act(async () => {
      lockResolve();
      await Promise.resolve();

      jest.runAllTimers();
      wrapper.update();
    });

    expect(
      wrapper.find('.motion-box').hasClass('bamboo-appear-prepare'),
    ).toBeFalsy();
  });

  it('forceRender', () => {
    const wrapper = mount(
      <CSSMotion forceRender motionName="bamboo" visible={false}>
        {({ style, className }) => (
          <div style={style} className={classNames('motion-box', className)} />
        )}
      </CSSMotion>,
    );

    expect(wrapper.find('.motion-box').props().style).toEqual({
      display: 'none',
    });

    // Reset should hide
    wrapper.setProps({ forceRender: false });
    expect(wrapper.find('.motion-box')).toHaveLength(0);
  });

  it('render null on first when removeOnLeave is false', () => {
    const wrapper = mount(
      <CSSMotion
        motionName="bamboo"
        removeOnLeave={false}
        leavedClassName="removed"
        visible={false}
      >
        {({ style, className }) => (
          <div style={style} className={classNames('motion-box', className)} />
        )}
      </CSSMotion>,
    );

    expect(wrapper.find('.motion-box')).toHaveLength(0);

    // Visible
    wrapper.setProps({ visible: true });
    act(() => {
      jest.runAllTimers();
      wrapper.update();
    });
    expect(wrapper.find('.motion-box')).toHaveLength(1);

    // Hide again
    wrapper.setProps({ visible: false });
    act(() => {
      jest.runAllTimers();

      const transitionEndEvent = new Event('transitionend');
      (
        wrapper.find('.motion-box').instance() as any as HTMLElement
      ).dispatchEvent(transitionEndEvent);

      jest.runAllTimers();

      wrapper.update();
    });
    expect(wrapper.find('.motion-box')).toHaveLength(1);
    expect(wrapper.find('.motion-box').hasClass('removed')).toBeTruthy();
  });

  describe('strict mode', () => {
    beforeEach(() => {
      jest.spyOn(ReactDOM, 'findDOMNode');
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('calls findDOMNode when no refs are passed', () => {
      const wrapper = mount(
        <CSSMotion motionName="transition" visible>
          {() => <div />}
        </CSSMotion>,
      );

      act(() => {
        jest.runAllTimers();
        wrapper.update();
      });

      expect(ReactDOM.findDOMNode).toHaveBeenCalled();
    });

    it('does not call findDOMNode when ref is passed internally', () => {
      const wrapper = mount(
        <CSSMotion motionName="transition" visible>
          {(props, ref) => <div ref={ref} />}
        </CSSMotion>,
      );

      act(() => {
        jest.runAllTimers();
        wrapper.update();
      });

      expect(ReactDOM.findDOMNode).not.toHaveBeenCalled();
    });

    it('calls findDOMNode when refs are forwarded but not assigned', () => {
      const domRef = React.createRef();

      const wrapper = mount(
        <CSSMotion motionName="transition" visible ref={domRef}>
          {() => <div />}
        </CSSMotion>,
      );

      act(() => {
        jest.runAllTimers();
        wrapper.update();
      });

      expect(ReactDOM.findDOMNode).toHaveBeenCalled();
    });

    it('does not call findDOMNode when refs are forwarded and assigned', () => {
      const domRef = React.createRef();

      const wrapper = mount(
        <CSSMotion motionName="transition" visible ref={domRef}>
          {(props, ref) => <div ref={ref} />}
        </CSSMotion>,
      );

      act(() => {
        jest.runAllTimers();
        wrapper.update();
      });

      expect(ReactDOM.findDOMNode).not.toHaveBeenCalled();
    });
  });
});
