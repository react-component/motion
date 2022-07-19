import React from 'react';
import classNames from 'classnames';
import { CSSMotionList } from '../src';
import './CSSMotionList.less';

interface DemoState {
  count: number;
  checkedMap: Record<string, boolean>;
  keyList: React.Key[];
}

class Demo extends React.Component<{}, DemoState> {
  state: DemoState = {
    count: 1,
    checkedMap: {},
    keyList: [],
  };

  componentDidMount() {
    this.onFlushMotion();
  }

  onCountChange = ({ target: { value } }) => {
    this.setState({ count: Number(value) });
  };

  onFlushMotion = () => {
    const { count, checkedMap } = this.state;
    let keyList = [];
    for (let i = 0; i < count; i += 1) {
      if (checkedMap[i] !== false) {
        keyList.push(i);
      }
    }

    keyList = keyList.map(key => {
      if (key === 3) {
        return { key, background: 'orange' };
      }
      return key;
    });

    this.setState({ keyList });
  };

  // Motion
  onCollapse = () => ({ width: 0, margin: '0 -5px 0 0' });

  render() {
    const { count, checkedMap, keyList } = this.state;

    return (
      <div>
        key 3 is a different component with others.
        {/* Input field */}
        <div>
          <label>
            node count
            <input type="number" value={count} onChange={this.onCountChange} />
          </label>
          <button type="button" onClick={this.onFlushMotion}>
            Flush Motion
          </button>
        </div>
        {/* Motion State */}
        <div>
          {new Array(count).fill(undefined).map((_, key) => {
            const checked = checkedMap[key] !== false;
            return (
              <label key={key}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    this.setState({
                      checkedMap: {
                        ...checkedMap,
                        [key]: !checked,
                      },
                    });
                  }}
                />
                {key}
              </label>
            );
          })}
        </div>
        {/* Motion List */}
        <CSSMotionList
          keys={keyList}
          motionName="transition"
          onAppearStart={this.onCollapse}
          onEnterStart={this.onCollapse}
          onLeaveActive={this.onCollapse}
          onVisibleChanged={(changedVisible, info) => {
            console.log('Visible Changed >>>', changedVisible, info);
          }}
        >
          {({ key, background, className, style }) => {
            return (
              <div
                className={classNames('demo-block', className)}
                style={{
                  ...style,
                  background,
                }}
              >
                <span>{key}</span>
              </div>
            );
          }}
        </CSSMotionList>
      </div>
    );
  }
}

export default () => (
  <React.StrictMode>
    <Demo />
  </React.StrictMode>
);
