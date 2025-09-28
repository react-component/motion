import { clsx } from 'clsx';
import CSSMotion from 'rc-motion';
import React from 'react';
import './basic.less';

interface DemoState {
  show: boolean;
  forceRender: boolean;
  motionLeaveImmediately: boolean;
  removeOnLeave: boolean;
  hasMotionClassName: boolean;
  prepare: boolean;
}

async function forceDelay(): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, 2000);
  });
}

const Div = React.forwardRef<HTMLDivElement, any>((props, ref) => {
  React.useEffect(() => {
    console.log('DIV >>> Mounted!');

    return () => {
      console.log('DIV >>> UnMounted!');
    };
  }, []);

  return <div {...props} ref={ref} />;
});

class App extends React.Component<{}, DemoState> {
  state: DemoState = {
    show: true,
    forceRender: false,
    motionLeaveImmediately: false,
    removeOnLeave: true,
    hasMotionClassName: true,
    prepare: false,
  };

  onTrigger = () => {
    setTimeout(() => {
      this.setState(({ show }) => ({ show: !show }));
    }, 100);
  };

  onTriggerDelay = () => {
    this.setState(({ prepare }) => ({ prepare: !prepare }));
  };

  onForceRender = () => {
    this.setState(({ forceRender }) => ({ forceRender: !forceRender }));
  };

  onRemoveOnLeave = () => {
    this.setState(({ removeOnLeave }) => ({ removeOnLeave: !removeOnLeave }));
  };

  onTriggerClassName = () => {
    this.setState(({ hasMotionClassName }) => ({
      hasMotionClassName: !hasMotionClassName,
    }));
  };

  onCollapse = () => {
    return { height: 0 };
  };

  onMotionLeaveImmediately = () => {
    this.setState(({ motionLeaveImmediately }) => ({
      motionLeaveImmediately: !motionLeaveImmediately,
    }));
  };

  skipColorTransition = (_, event) => {
    // CSSMotion support multiple transition.
    // You can return false to prevent motion end when fast transition finished.
    if (event.propertyName === 'background-color') {
      return false;
    }
    return true;
  };

  styleGreen = () => ({
    background: 'green',
  });

  render() {
    const {
      show,
      forceRender,
      motionLeaveImmediately,
      removeOnLeave,
      hasMotionClassName,
      prepare,
    } = this.state;

    return (
      <div>
        <label>
          <input type="checkbox" onChange={this.onTrigger} checked={show} />{' '}
          Show Component
        </label>

        <label>
          <input
            type="checkbox"
            onChange={this.onTriggerClassName}
            checked={hasMotionClassName}
          />{' '}
          hasMotionClassName
        </label>

        <label>
          <input
            type="checkbox"
            onChange={this.onForceRender}
            checked={forceRender}
          />{' '}
          forceRender
        </label>

        <label>
          <input
            type="checkbox"
            onChange={this.onRemoveOnLeave}
            checked={removeOnLeave}
          />{' '}
          removeOnLeave
          {removeOnLeave ? '' : ' (use leavedClassName)'}
        </label>

        <label>
          <input
            type="checkbox"
            onChange={this.onTriggerDelay}
            checked={prepare}
          />{' '}
          prepare before motion
        </label>

        <div className="grid">
          <div>
            <h2>With Transition Class</h2>
            <CSSMotion
              visible={show}
              forceRender={forceRender}
              motionName={hasMotionClassName ? 'transition' : null}
              removeOnLeave={removeOnLeave}
              leavedClassName="hidden"
              onAppearPrepare={prepare && forceDelay}
              onEnterPrepare={prepare && forceDelay}
              onAppearStart={this.onCollapse}
              onEnterStart={this.onCollapse}
              onLeaveActive={this.onCollapse}
              onEnterEnd={this.skipColorTransition}
              onLeaveEnd={this.skipColorTransition}
              onVisibleChanged={visible => {
                console.log('Visible Changed:', visible);
              }}
            >
              {({ style, className }, ref) => (
                <Div
                  ref={ref}
                  className={clsx('demo-block', className)}
                  style={style}
                />
              )}
            </CSSMotion>
          </div>

          <div>
            <h2>With Animation Class</h2>
            <CSSMotion
              visible={show}
              forceRender={forceRender}
              motionName={hasMotionClassName ? 'animation' : null}
              removeOnLeave={removeOnLeave}
              leavedClassName="hidden"
              onLeaveActive={this.styleGreen}
            >
              {({ style, className }) => (
                <div className={clsx('demo-block', className)} style={style} />
              )}
            </CSSMotion>
          </div>
        </div>

        <div>
          <button type="button" onClick={this.onMotionLeaveImmediately}>
            motionLeaveImmediately
          </button>

          <div>
            {motionLeaveImmediately && (
              <CSSMotion
                visible={false}
                motionName={hasMotionClassName ? 'transition' : null}
                removeOnLeave={removeOnLeave}
                leavedClassName="hidden"
                onLeaveActive={this.onCollapse}
                motionLeaveImmediately
                onLeaveEnd={this.skipColorTransition}
              >
                {({ style, className }) => (
                  <div
                    className={clsx('demo-block', className)}
                    style={style}
                  />
                )}
              </CSSMotion>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default App;
