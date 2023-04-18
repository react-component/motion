import classNames from 'classnames';
import CSSMotion, { Provider } from 'rc-motion';
import React from 'react';
import './basic.less';

export default () => {
  const [show, setShow] = React.useState(true);
  const [motion, setMotion] = React.useState(true);

  const onPrepare = (node: HTMLElement) => {
    console.log('prepare', node);
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
        onVisibleChanged={visible => {
          console.log('Visible Changed:', visible);
        }}
      >
        {({ style, className }, ref) => (
          <div
            ref={ref}
            className={classNames('demo-block', className)}
            style={style}
          />
        )}
      </CSSMotion>
    </Provider>
  );
};
