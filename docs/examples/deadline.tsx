import classNames from 'classnames';
import CSSMotion from 'rc-motion';
import React from 'react';
import './basic.less';

interface DemoState {
  show: boolean;
}

class App extends React.Component<{}, DemoState> {
  state = {
    show: true,
  };

  onTrigger = () => {
    this.setState(({ show }) => ({ show: !show }));
  };

  onStart = (ele: HTMLElement, event: object) => {
    console.log('start!', ele, event);
  };

  onEnd = (ele: HTMLElement, event: object) => {
    console.log('end!', ele, event);
  };

  render() {
    const { show } = this.state;

    return (
      <div>
        <label>
          <input type="checkbox" onChange={this.onTrigger} checked={show} />{' '}
          Show Component
        </label>

        <div className="grid">
          <div>
            <h2>With Transition Class</h2>
            <CSSMotion
              visible={show}
              motionName="no-trigger"
              motionDeadline={1000}
              removeOnLeave
              onAppearStart={this.onStart}
              onEnterStart={this.onStart}
              onLeaveStart={this.onStart}
              onAppearEnd={this.onEnd}
              onEnterEnd={this.onEnd}
              onLeaveEnd={this.onEnd}
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
        </div>
      </div>
    );
  }
}

export default App;
