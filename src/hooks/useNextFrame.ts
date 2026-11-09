import { raf } from '@rc-component/util';
import * as React from 'react';

export default (): [
  (callback: (info: { isCanceled: () => boolean }) => void) => void,
  () => void,
] => {
  const nextFrameRef = React.useRef<number>(null);

  function cancelNextFrame() {
    raf.cancel(nextFrameRef.current);
    // A frame may already be waiting for an asynchronous prepare callback.
    // Invalidate it as well, so resolving after cleanup cannot advance the queue.
    nextFrameRef.current = null;
  }

  function nextFrame(
    callback: (info: { isCanceled: () => boolean }) => void,
    delay = 2,
  ) {
    cancelNextFrame();

    const nextFrameId = raf(() => {
      if (delay <= 1) {
        callback({ isCanceled: () => nextFrameId !== nextFrameRef.current });
      } else {
        nextFrame(callback, delay - 1);
      }
    });

    nextFrameRef.current = nextFrameId;
  }

  React.useEffect(
    () => () => {
      cancelNextFrame();
    },
    [],
  );

  return [nextFrame, cancelNextFrame];
};
