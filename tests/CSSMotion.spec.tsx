/* eslint-disable
  react/no-render-return-value, max-classes-per-file,
  react/prefer-stateless-function, react/no-multi-comp
*/
import React from 'react';
import classNames from 'classnames';
import { mount } from './wrapper';
import RefCSSMotion, { genCSSMotion, CSSMotionProps } from '../src/CSSMotion';

describe('motion', () => {
  const CSSMotion = genCSSMotion({
    transitionSupport: true,
    forwardRef: false,
  });

  // let div;
  // beforeEach(() => {
  //   div = document.createElement('div');
  //   document.body.appendChild(div);
  // });

  // afterEach(() => {
  //   try {
  //     ReactDOM.unmountComponentAtNode(div);
  //     document.body.removeChild(div);
  //   } catch (e) {
  //     // Do nothing
  //   }
  // });

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
        jest.useFakeTimers();

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

        jest.useRealTimers();
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
        jest.useFakeTimers();

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

        jest.useRealTimers();
      });
    });
  });

  // describe('immediately', () => {
  //   it('motionLeaveImmediately', done => {
  //     ReactDOM.render(
  //       <CSSMotion
  //         motionName="transition"
  //         motionLeaveImmediately
  //         visible={false}
  //       >
  //         {({ style, className }) => (
  //           <div
  //             style={style}
  //             className={classNames('motion-box', className)}
  //           />
  //         )}
  //       </CSSMotion>,
  //       div,
  //       function init() {
  //         const instance = this;

  //         const basicClassName = TestUtils.findRenderedDOMComponentWithClass(
  //           instance,
  //           'motion-box',
  //         ).className;
  //         expect(basicClassName).to.contain('transition');
  //         expect(basicClassName).to.contain('transition-leave');
  //         expect(basicClassName).to.not.contain('transition-leave-active');

  //         setTimeout(() => {
  //           const activeClassName = TestUtils.findRenderedDOMComponentWithClass(
  //             instance,
  //             'motion-box',
  //           ).className;
  //           expect(activeClassName).to.contain('transition');
  //           expect(activeClassName).to.contain('transition-leave');
  //           expect(activeClassName).to.contain('transition-leave-active');

  //           done();
  //         }, 100);
  //       },
  //     );
  //   });
  // });

  // it('no transition', done => {
  //   const NoCSSTransition = genCSSMotion({
  //     transitionSupport: false,
  //     forwardRef: false,
  //   });

  //   ReactDOM.render(
  //     <NoCSSTransition motionName="transition">
  //       {({ style, className }) => (
  //         <div style={style} className={classNames('motion-box', className)} />
  //       )}
  //     </NoCSSTransition>,
  //     div,
  //     function init() {
  //       const basicClassName = TestUtils.findRenderedDOMComponentWithClass(
  //         this,
  //         'motion-box',
  //       ).className;
  //       expect(basicClassName).to.not.contain('transition');
  //       expect(basicClassName).to.not.contain('transition-appear');
  //       expect(basicClassName).to.not.contain('transition-appear-active');

  //       done();
  //     },
  //   );
  // });

  // it('forwardRef', done => {
  //   let domNode;
  //   const setRef = node => {
  //     domNode = node;
  //   };

  //   ReactDOM.render(
  //     <RefCSSMotion motionName="transition" ref={setRef}>
  //       {({ style, className }, ref) => (
  //         <div
  //           ref={ref}
  //           style={style}
  //           className={classNames('motion-box', className)}
  //         />
  //       )}
  //     </RefCSSMotion>,
  //     div,
  //     () => {
  //       // eslint-disable-next-line no-undef
  //       expect(domNode instanceof HTMLElement).to.be.ok();

  //       done();
  //     },
  //   );
  // });
});
