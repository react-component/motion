import CSSMotion from 'rc-motion';
import React from 'react';
import './transition-inside-debug.less';

export default function TransitionInsideDebug() {
  const [visible, setVisible] = React.useState(true);
  return (
    <>
      <button onClick={() => setVisible(true)} type="button">
        visible = true
      </button>
      <button onClick={() => setVisible(false)} type="button">
        visible = false
      </button>
      <CSSMotion
        visible={visible}
        motionName="debug-transition"
        onEnterStart={() => ({
          maxHeight: 0,
        })}
        onEnterActive={() => ({
          maxHeight: 200,
        })}
        onLeaveStart={() => ({
          maxHeight: 200,
        })}
        onLeaveActive={() => ({
          maxHeight: 0,
        })}
      >
        {({ className, style }, ref) => (
          <div
            className={className}
            style={{
              width: 200,
              height: 200,
              background: 'green',
              ...style,
            }}
            ref={ref}
          >
            <div className="inner-block">Hover when closing</div>
          </div>
        )}
      </CSSMotion>
    </>
  );
}
