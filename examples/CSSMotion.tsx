import React from 'react';
import classNames from 'classnames';
import CSSMotion from '../src';
import './CSSMotion.less';

interface DemoState {
  show: boolean;
  motionLeaveImmediately: boolean;
  removeOnLeave: boolean;
  hasMotionClassName: boolean;
}

class Demo extends React.Component<{}, DemoState> {
  state: DemoState = {
    show: true,
    motionLeaveImmediately: false,
    removeOnLeave: true,
    hasMotionClassName: true,
  };

  onTrigger = () => {
    this.setState(({ show }) => ({ show: !show }));
  };

  onRemoveOnLeave = () => {
    this.setState(({ removeOnLeave }) => ({ removeOnLeave: !removeOnLeave }));
  };

  onTriggerClassName = () => {
    this.setState(({ hasMotionClassName }) => ({
      hasMotionClassName: !hasMotionClassName,
    }));
  };

  onCollapse = () => ({ height: 0 });

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
      motionLeaveImmediately,
      removeOnLeave,
      hasMotionClassName,
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
            onChange={this.onRemoveOnLeave}
            checked={removeOnLeave}
          />{' '}
          removeOnLeave
          {removeOnLeave ? '' : ' (use leavedClassName)'}
        </label>

        <div className="grid">
          <div>
            <h2>With Transition Class</h2>
            <CSSMotion
              visible={show}
              motionName={hasMotionClassName ? 'transition' : null}
              removeOnLeave={removeOnLeave}
              leavedClassName="hidden"
              onAppearStart={this.onCollapse}
              onEnterStart={this.onCollapse}
              onLeaveActive={this.onCollapse}
              onEnterEnd={this.skipColorTransition}
              onLeaveEnd={this.skipColorTransition}
            >
              {({ style, className }, ref) => (
                <div
                  ref={ref}
                  className={classNames('demo-block', className)}
                  style={style}
                />
              )}
            </CSSMotion>
          </div>

          {/* <div>
            <h2>With Animation Class</h2>
            <CSSMotion
              visible={show}
              motionName={hasMotionClassName ? 'animation' : null}
              removeOnLeave={removeOnLeave}
              leavedClassName="hidden"
              onLeaveActive={this.styleGreen}
            >
              {({ style, className }) => (
                <div
                  className={classNames('demo-block', className)}
                  style={style}
                />
              )}
            </CSSMotion>
          </div> */}
        </div>

        {/* <div>
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
                    className={classNames('demo-block', className)}
                    style={style}
                  />
                )}
              </CSSMotion>
            )}
          </div>
        </div> */}
      </div>
    );
  }
}

export default Demo;
