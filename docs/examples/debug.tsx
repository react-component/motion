import { clsx } from 'clsx';
import CSSMotion, { type CSSMotionProps } from 'rc-motion';
import React, { useState } from 'react';
import './debug.less';

const onCollapse = () => {
  console.log('🔥 Collapse');
  return { height: 0 };
};

const onExpand: CSSMotionProps['onAppearActive'] = node => {
  console.log('🔥 Expand');
  return { height: node.scrollHeight };
};

export default function DebugDemo() {
  const [key, setKey] = useState(0);

  return (
    <div>
      <button
        onClick={() => {
          setKey(prev => prev + 1);
        }}
      >
        Start
      </button>

      <CSSMotion
        visible
        motionName="debug-motion"
        motionAppear
        onAppearStart={onCollapse}
        onAppearActive={onExpand}
        key={key}
      >
        {({ style, className }, ref) => {
          console.log('render', className, style);

          return (
            <div
              ref={ref}
              className={clsx('debug-demo-block', className)}
              style={style}
            >
              <div
                style={{
                  height: 100,
                  width: 100,
                  background: 'blue',
                }}
              />
            </div>
          );
        }}
      </CSSMotion>
    </div>
  );
}
