/* eslint-disable
  react/no-render-return-value, max-classes-per-file,
  react/prefer-stateless-function, react/no-multi-comp
*/
import { fireEvent, render } from '@testing-library/react';
import classNames from 'classnames';
import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import type { CSSMotionProps } from '../src';
import { Provider } from '../src';
import RefCSSMotion, { genCSSMotion } from '../src/CSSMotion';

describe('CSSMotion', () => {
  const CSSMotion = genCSSMotion({
    transitionSupport: true,
    forwardRef: false,
  });

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
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
      visibleQueue: boolean[];
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
        visibleQueue: [true],
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
        visibleQueue: [false, true],
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
        visibleQueue: [true, false],
        oriHeight: 100,
        tgtHeight: 0,
      },
    ];

    actionList.forEach(
      ({ name, props, visibleQueue, oriHeight, tgtHeight }) => {
        const Demo = ({ visible }: { visible: boolean }) => {
          return (
            <CSSMotion
              motionName="transition"
              motionAppear={false}
              motionEnter={false}
              motionLeave={false}
              visible={visible}
              {...props}
            >
              {({ style, className, visible: motionVisible }) => {
                expect(motionVisible).toEqual(visible);
                return (
                  <div
                    style={style}
                    className={classNames('motion-box', className)}
                  />
                );
              }}
            </CSSMotion>
          );
        };

        it(name, () => {
          const nextVisible = visibleQueue[1];
          const { container, rerender } = render(
            <Demo visible={visibleQueue[0]} />,
          );

          function doStartTest() {
            const boxNode = container.querySelector('.motion-box');
            expect(boxNode).toHaveClass('transition');
            expect(boxNode).toHaveClass(`transition-${name}`);
            expect(boxNode).not.toHaveClass(`transition-${name}-active`);
            expect(boxNode).toHaveStyle({
              height: `${oriHeight}px`,
            });

            // Motion active
            act(() => {
              jest.runAllTimers();
            });

            const activeBoxNode = container.querySelector('.motion-box');
            expect(activeBoxNode).toHaveClass('transition');
            expect(activeBoxNode).toHaveClass(`transition-${name}`);
            expect(activeBoxNode).toHaveClass(`transition-${name}-active`);
            expect(activeBoxNode).toHaveStyle({
              height: `${tgtHeight}px`,
            });

            // Motion end
            fireEvent.transitionEnd(activeBoxNode);

            act(() => {
              jest.runAllTimers();
            });

            if (nextVisible === false) {
              expect(container.querySelector('.motion-box')).toBeFalsy();
            } else if (nextVisible !== undefined) {
              const finalBoxNode: HTMLElement =
                container.querySelector('.motion-box');
              expect(finalBoxNode).not.toHaveClass('transition');
              expect(finalBoxNode).not.toHaveClass(`transition-${name}`);
              expect(finalBoxNode).not.toHaveClass(`transition-${name}-active`);

              expect(finalBoxNode.style.cssText).toEqual('');
            }
          }

          // Delay for the visible finished
          if (nextVisible !== undefined) {
            rerender(<Demo visible={nextVisible} />);
            doStartTest();
          } else {
            doStartTest();
          }
        });
      },
    );

    it('leaveClassName should add to dom', () => {
      const genMotion = props => {
        const { visible, leavedClassName } = props;
        return (
          <CSSMotion
            motionName="transition"
            visible={visible}
            removeOnLeave={false}
            leavedClassName={leavedClassName}
          >
            {({ style, className }) => {
              return (
                <div
                  style={style}
                  className={classNames('motion-box', className)}
                />
              );
            }}
          </CSSMotion>
        );
      };
      const { container, rerender } = render(genMotion({ visible: false }));

      rerender(genMotion({ visible: true }));

      act(() => {
        jest.runAllTimers();
      });

      expect(container.querySelector('.motion-box')).toBeTruthy();
      rerender(genMotion({ visible: false, leavedClassName: 'removed' }));
      act(() => {
        jest.runAllTimers();
      });

      fireEvent.transitionEnd(container.querySelector('.motion-box'));

      expect(container.querySelector('.motion-box')).toHaveClass('removed');

      rerender(genMotion({ visible: true }));
      act(() => {
        jest.runAllTimers();
      });
      rerender(genMotion({ visible: false }));
      act(() => {
        jest.runAllTimers();
      });

      fireEvent.transitionEnd(container.querySelector('.motion-box'));
      expect(
        container.querySelector('.motion-box')?.classList.contains('removed'),
      ).toBeFalsy();
    });

    it('stop transition if config motion to false', () => {
      const genMotion = (props?: CSSMotionProps) => (
        <CSSMotion motionName="transition" visible {...props}>
          {({ style, className }) => (
            <div
              style={style}
              className={classNames('motion-box', className)}
            />
          )}
        </CSSMotion>
      );

      const { container, rerender } = render(genMotion());
      let boxNode = container.querySelector('.motion-box');
      expect(boxNode).toHaveClass('transition');
      expect(boxNode).toHaveClass('transition-appear');
      expect(boxNode).not.toHaveClass('transition-appear-active');

      rerender(genMotion({ motionAppear: false }));
      act(() => {
        jest.runAllTimers();
      });

      boxNode = container.querySelector('.motion-box');
      expect(boxNode).not.toHaveClass('transition');
      expect(boxNode).not.toHaveClass('transition-appear');
      expect(boxNode).not.toHaveClass('transition-appear-active');
    });

    it('quick switch should have correct status', async () => {
      const genMotion = (props?: CSSMotionProps) => (
        <CSSMotion motionName="transition" {...props}>
          {({ style, className }) => (
            <div
              style={style}
              className={classNames('motion-box', className)}
            />
          )}
        </CSSMotion>
      );

      const { container, rerender, unmount } = render(genMotion());

      rerender(genMotion({ visible: true }));
      act(() => {
        jest.runAllTimers();
      });

      rerender(genMotion({ visible: false }));
      act(() => {
        jest.runAllTimers();
      });

      let boxNode = container.querySelector('.motion-box');
      expect(boxNode).toHaveClass('transition');
      expect(boxNode).toHaveClass('transition-leave');
      expect(boxNode).toHaveClass('transition-leave-active');

      rerender(genMotion({ visible: true }));
      await Promise.resolve();
      rerender(genMotion({ visible: false }));

      act(() => {
        jest.runAllTimers();
      });

      boxNode = container.querySelector('.motion-box');
      expect(boxNode).toHaveClass('transition');
      expect(boxNode).toHaveClass('transition-leave');
      expect(boxNode).toHaveClass('transition-leave-active');

      unmount();
    });

    describe('deadline should work', () => {
      function test(name: string, Component: React.ComponentType<any>) {
        it(name, () => {
          const onAppearEnd = jest.fn();
          render(
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

          // Motion Active
          act(() => {
            jest.advanceTimersByTime(800);
          });

          expect(onAppearEnd).not.toHaveBeenCalled();
          act(() => {
            jest.runAllTimers();
          });
          expect(onAppearEnd).toHaveBeenCalled();
        });
      }

      test(
        'without ref',
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        React.forwardRef((props, ref) => {
          return <div {...props} />;
        }),
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
      const { asFragment } = render(
        <CSSMotion motionName="transition" visible />,
      );
      expect(asFragment().firstChild).toMatchSnapshot();
    });
  });

  describe('animation', () => {
    const actionList = [
      {
        name: 'appear',
        props: { motionAppear: true },
        visibleQueue: [true],
      },
      {
        name: 'enter',
        props: { motionEnter: true },
        visibleQueue: [false, true],
      },
      {
        name: 'leave',
        props: { motionLeave: true },
        visibleQueue: [true, false],
      },
    ];

    actionList.forEach(({ name, visibleQueue, props }) => {
      const Demo = ({ visible }: { visible: boolean }) => (
        <CSSMotion
          motionName="animation"
          motionAppear={false}
          motionEnter={false}
          motionLeave={false}
          visible={visible}
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

      it(name, () => {
        const { container, rerender } = render(
          <Demo visible={visibleQueue[0]} />,
        );
        const nextVisible = visibleQueue[1];

        function doStartTest() {
          // Motion active
          act(() => {
            jest.runAllTimers();
          });

          const activeBoxNode = container.querySelector('.motion-box');
          expect(activeBoxNode).toHaveClass('animation');
          expect(activeBoxNode).toHaveClass(`animation-${name}`);
          expect(activeBoxNode).toHaveClass(`animation-${name}-active`);
        }

        // Delay for the visible finished
        if (nextVisible !== undefined) {
          rerender(<Demo visible={nextVisible} />);
          doStartTest();
        } else {
          doStartTest();
        }
      });
    });
  });

  it('not block motion when motion set delay', () => {
    const genMotion = (props?: CSSMotionProps) => (
      <CSSMotion visible {...props}>
        {({ style, className }) => (
          <div style={style} className={classNames('motion-box', className)} />
        )}
      </CSSMotion>
    );

    const { container, rerender } = render(genMotion());

    rerender(
      genMotion({
        motionName: 'animation',
        motionLeave: true,
        visible: false,
      }),
    );

    act(() => {
      jest.runAllTimers();
    });

    const activeBoxNode = container.querySelector('.motion-box');
    expect(activeBoxNode).toHaveClass(`animation-leave-active`);
  });

  describe('immediately', () => {
    it('motionLeaveImmediately', async () => {
      const { container } = render(
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

      const boxNode = container.querySelector('.motion-box');
      expect(boxNode).toHaveClass('transition');
      expect(boxNode).toHaveClass('transition-leave');
      expect(boxNode).not.toHaveClass('transition-leave-active');

      // Motion active
      await act(async () => {
        jest.runAllTimers();
        await Promise.resolve();
      });

      const activeBoxNode = container.querySelector('.motion-box');
      expect(activeBoxNode).toHaveClass('transition');
      expect(activeBoxNode).toHaveClass('transition-leave');
      expect(activeBoxNode).toHaveClass('transition-leave-active');
    });
  });

  it('no motion name but appear', () => {
    const { container } = render(
      <CSSMotion
        visible
        motionAppear
        onAppearPrepare={() => new Promise(() => {})}
      >
        {({ style, className }) => (
          <div style={style} className={classNames('motion-box', className)} />
        )}
      </CSSMotion>,
    );

    act(() => {
      jest.runAllTimers();
    });

    // Not any other className
    expect(container.querySelector('.motion-box').className).toEqual(
      'motion-box',
    );
  });

  it('MotionProvider to disable motion', () => {
    const onAppearPrepare = jest.fn();
    const onAppearStart = jest.fn();

    const Demo = ({
      motion,
      visible,
    }: {
      motion?: boolean;
      visible?: boolean;
    }) => (
      <Provider motion={motion}>
        <CSSMotion
          motionName="test"
          visible={visible}
          removeOnLeave={false}
          leavedClassName="hidden"
          motionAppear
          onAppearPrepare={onAppearPrepare}
          onAppearStart={onAppearStart}
        >
          {({ style, className }) => (
            <div
              style={style}
              className={classNames('motion-box', className)}
            />
          )}
        </CSSMotion>
      </Provider>
    );

    const { container, rerender } = render(<Demo motion={false} visible />);
    expect(container.querySelector('.motion-box')).toBeTruthy();

    act(() => {
      jest.runAllTimers();
    });

    expect(onAppearPrepare).toHaveBeenCalled();
    expect(onAppearStart).not.toHaveBeenCalled();

    // hide immediately since motion is disabled
    rerender(<Demo motion={false} visible={false} />);

    expect(container.querySelector('.hidden')).toBeTruthy();
  });

  it('no transition', () => {
    const NoCSSTransition = genCSSMotion({
      transitionSupport: false,
      forwardRef: false,
    });

    const { container } = render(
      <NoCSSTransition motionName="transition">
        {({ style, className }) => (
          <div style={style} className={classNames('motion-box', className)} />
        )}
      </NoCSSTransition>,
    );

    const boxNode = container.querySelector('.motion-box');
    expect(boxNode).not.toHaveClass('transition');
    expect(boxNode).not.toHaveClass('transition-appear');
    expect(boxNode).not.toHaveClass('transition-appear-active');
  });

  it('forwardRef', () => {
    const domRef = React.createRef();
    render(
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

    const genMotion = (props?: CSSMotionProps) => (
      <CSSMotion
        visible
        motionName="bamboo"
        onLeaveEnd={onLeaveEnd}
        removeOnLeave={false}
        {...props}
      >
        {(_, ref) => (
          <div className="outer-block" ref={ref}>
            <div className="inner-block" />
          </div>
        )}
      </CSSMotion>
    );
    const { container, rerender } = render(genMotion());

    function resetLeave() {
      rerender(genMotion({ visible: true }));
      act(() => {
        jest.runAllTimers();
      });

      rerender(genMotion({ visible: false }));
      act(() => {
        jest.runAllTimers();
      });
    }

    // Outer
    resetLeave();
    fireEvent.transitionEnd(container.querySelector('.outer-block'));
    expect(onLeaveEnd).toHaveBeenCalledTimes(1);

    // Outer
    resetLeave();
    fireEvent.transitionEnd(container.querySelector('.outer-block'));
    expect(onLeaveEnd).toHaveBeenCalledTimes(2);

    // Inner
    resetLeave();
    fireEvent.transitionEnd(container.querySelector('.inner-block'));
    expect(onLeaveEnd).toHaveBeenCalledTimes(2);
  });

  it('switch dom should work', () => {
    const onLeaveEnd = jest.fn();

    const genMotion = (Component: any, visible: boolean) => (
      <CSSMotion
        visible={visible}
        onLeaveEnd={onLeaveEnd}
        motionDeadline={233}
        motionName="bamboo"
      >
        {({ style, className }) => (
          <Component
            style={style}
            className={classNames('motion-box', className)}
          />
        )}
      </CSSMotion>
    );

    const { rerender } = render(genMotion('div', true));

    // Active
    act(() => {
      jest.runAllTimers();
    });

    // Hide
    rerender(genMotion('p', false));

    // Active
    act(() => {
      jest.runAllTimers();
    });

    // Deadline
    act(() => {
      jest.runAllTimers();
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

    const { container } = render(
      <CSSMotion visible motionName="bamboo" onAppearPrepare={onAppearPrepare}>
        {({ style, className }) => (
          <div style={style} className={classNames('motion-box', className)} />
        )}
      </CSSMotion>,
    );

    act(() => {
      jest.runAllTimers();
    });

    // Locked
    expect(container.querySelector('.motion-box')).toHaveClass(
      'bamboo-appear-prepare',
    );

    // Release
    await act(async () => {
      lockResolve();
      await Promise.resolve();
    });

    act(() => {
      jest.runAllTimers();
    });

    expect(container.querySelector('.motion-box')).not.toHaveClass(
      'bamboo-appear-prepare',
    );
  });

  it('forceRender', () => {
    const genMotion = (props?: CSSMotionProps) => (
      <CSSMotion forceRender motionName="bamboo" visible={false} {...props}>
        {({ style, className }) => (
          <div style={style} className={classNames('motion-box', className)} />
        )}
      </CSSMotion>
    );

    const { container, rerender } = render(genMotion());

    expect(container.querySelector('.motion-box')).toHaveStyle({
      display: 'none',
    });

    // Reset should hide
    rerender(genMotion({ forceRender: false }));
    expect(container.querySelector('.motion-box')).toBeFalsy();
  });

  it('render null on first when removeOnLeave is false', () => {
    const genMotion = (props?: CSSMotionProps) => (
      <CSSMotion
        motionName="bamboo"
        removeOnLeave={false}
        leavedClassName="removed"
        visible={false}
        {...props}
      >
        {({ style, className }) => (
          <div style={style} className={classNames('motion-box', className)} />
        )}
      </CSSMotion>
    );

    const { container, rerender } = render(genMotion());

    expect(container.querySelector('.motion-box')).toBeFalsy();

    // Visible
    rerender(genMotion({ visible: true }));
    act(() => {
      jest.runAllTimers();
    });
    expect(container.querySelector('.motion-box')).toBeTruthy();

    // Hide again
    rerender(genMotion({ visible: false }));
    act(() => {
      jest.runAllTimers();
    });

    fireEvent.transitionEnd(container.querySelector('.motion-box'));

    expect(container.querySelector('.motion-box')).toBeTruthy();
    expect(container.querySelector('.motion-box')).toHaveClass('removed');
  });

  describe('strict mode', () => {
    beforeEach(() => {
      jest.spyOn(ReactDOM, 'findDOMNode');
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('calls findDOMNode when no refs are passed', () => {
      const Div = () => <div />;
      render(
        <CSSMotion motionName="transition" visible>
          {() => <Div />}
        </CSSMotion>,
      );

      act(() => {
        jest.runAllTimers();
      });

      expect(ReactDOM.findDOMNode).toHaveBeenCalled();
    });

    it('does not call findDOMNode when ref is passed internally', () => {
      render(
        <CSSMotion motionName="transition" visible>
          {(props, ref) => <div ref={ref} />}
        </CSSMotion>,
      );

      act(() => {
        jest.runAllTimers();
      });

      expect(ReactDOM.findDOMNode).not.toHaveBeenCalled();
    });

    it('calls findDOMNode when refs are forwarded but not assigned', () => {
      const domRef = React.createRef();
      const Div = () => <div />;

      render(
        <CSSMotion motionName="transition" visible ref={domRef}>
          {() => <Div />}
        </CSSMotion>,
      );

      act(() => {
        jest.runAllTimers();
      });

      expect(ReactDOM.findDOMNode).toHaveBeenCalled();
    });

    it('does not call findDOMNode when refs are forwarded and assigned', () => {
      const domRef = React.createRef();

      render(
        <CSSMotion motionName="transition" visible ref={domRef}>
          {(props, ref) => <div ref={ref} />}
        </CSSMotion>,
      );

      act(() => {
        jest.runAllTimers();
      });

      expect(ReactDOM.findDOMNode).not.toHaveBeenCalled();
    });
  });

  describe('onVisibleChanged', () => {
    it('visible', () => {
      const onVisibleChanged = jest.fn();

      const { unmount } = render(
        <CSSMotion
          motionName="transition"
          motionAppear={false}
          motionEnter={false}
          motionLeave={false}
          visible
          onVisibleChanged={onVisibleChanged}
        >
          {({ style, className }) => (
            <div
              style={style}
              className={classNames('motion-box', className)}
            />
          )}
        </CSSMotion>,
      );

      expect(onVisibleChanged).toHaveBeenCalled();

      unmount();
    });

    it('!visible', () => {
      const onVisibleChanged = jest.fn();

      const { unmount } = render(
        <CSSMotion
          motionName="transition"
          motionAppear={false}
          motionEnter={false}
          motionLeave={false}
          visible={false}
          onVisibleChanged={onVisibleChanged}
        >
          {({ style, className }) => (
            <div
              style={style}
              className={classNames('motion-box', className)}
            />
          )}
        </CSSMotion>,
      );

      expect(onVisibleChanged).not.toHaveBeenCalled();

      unmount();
    });

    it('fast visible to !visible', () => {
      const onVisibleChanged = jest.fn();

      const Demo = ({ visible }: { visible: boolean }) => (
        <CSSMotion
          motionName="transition"
          motionAppear
          motionEnter
          motionLeave
          visible={visible}
          onVisibleChanged={onVisibleChanged}
        >
          {({ style, className }) => (
            <div
              style={style}
              className={classNames('motion-box', className)}
            />
          )}
        </CSSMotion>
      );

      const { unmount, rerender, container } = render(<Demo visible />);
      rerender(<Demo visible={false} />);
      act(() => {
        jest.runAllTimers();
      });

      fireEvent.animationEnd(container.querySelector('.motion-box'));

      expect(onVisibleChanged).toHaveBeenCalledTimes(1);
      expect(onVisibleChanged).toHaveBeenCalledWith(false);

      unmount();
    });
  });
});
