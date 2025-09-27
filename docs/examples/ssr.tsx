import { clsx } from 'clsx';
import CSSMotion from 'rc-motion';
import { genCSSMotion } from 'rc-motion/es/CSSMotion';
import React from 'react';
import { hydrate } from 'react-dom';
import ReactDOMServer from 'react-dom/server';
import './basic.less';

const ServerCSSMotion = genCSSMotion(false);

const onCollapse = () => ({ height: 0 });

interface MotionAppearProps {
  supportMotion: boolean;
}

const MotionAppear = ({ supportMotion }: MotionAppearProps) => {
  const Component = supportMotion ? CSSMotion : ServerCSSMotion;

  return (
    <Component
      motionName="transition"
      leavedClassName="hidden"
      motionAppear
      onAppearStart={onCollapse}
    >
      {({ style, className }, ref) => (
        <div
          ref={ref}
          className={clsx('demo-block', className)}
          style={style}
        />
      )}
    </Component>
  );
};

const App = () => {
  const ssr = ReactDOMServer.renderToString(
    <MotionAppear supportMotion={false} />,
  );

  React.useEffect(() => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    div.innerHTML = ssr;

    hydrate(<MotionAppear supportMotion />, div);

    return () => {
      document.body.removeChild(div);
    };
  }, []);

  return (
    <div>
      <textarea value={ssr} style={{ width: '100%' }} rows={5} readOnly />
    </div>
  );
};

export default App;
