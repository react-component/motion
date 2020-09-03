import * as React from 'react';
import raf from 'rc-util/lib/raf';

export default (): [(callback: Function) => void, () => void] => {
  const nextFrameRef = React.useRef<number>(null);

  function cancelNextFrame() {
    raf.cancel(nextFrameRef.current);
  }

  function nextFrame(callback: () => void, delay = 2) {
    cancelNextFrame();

    nextFrameRef.current = raf(() => {
      if (delay <= 1) {
        callback();
      } else {
        nextFrame(callback, delay - 1);
      }
    });
  }

  React.useEffect(
    () => () => {
      cancelNextFrame();
    },
    [],
  );

  return [nextFrame, cancelNextFrame];
};
