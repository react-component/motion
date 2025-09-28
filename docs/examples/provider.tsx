import { clsx } from 'clsx';
import CSSMotion, { Provider } from 'rc-motion';
import React from 'react';
import './basic.less';

export default () => {
  const [show, setShow] = React.useState(true);
  const [motion, setMotion] = React.useState(false);

  const onPrepare = (node: HTMLElement) => {
    console.log('🔥 prepare', node);

    return new Promise(resolve => {
      setTimeout(resolve, 500);
    });
  };

  return (
    <Provider motion={motion}>
      <button onClick={() => setShow(v => !v)}>show: {String(show)}</button>
      <button onClick={() => setMotion(v => !v)}>
        motion: {String(motion)}
      </button>

      <CSSMotion
        visible={show}
        motionName={'transition'}
        leavedClassName="hidden"
        motionAppear
        onAppearPrepare={onPrepare}
        onEnterPrepare={onPrepare}
        onLeavePrepare={onPrepare}
        onVisibleChanged={visible => {
          console.log('Visible Changed:', visible);
        }}
      >
        {({ style, className }, ref) => (
          <>
            <div
              ref={ref}
              className={clsx('demo-block', className)}
              style={style}
            />
            <ul>
              <li>ClassName: {JSON.stringify(className)}</li>
              <li>Style: {JSON.stringify(style)}</li>
            </ul>
          </>
        )}
      </CSSMotion>
    </Provider>
  );
};
