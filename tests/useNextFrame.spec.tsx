import { act, renderHook } from '@testing-library/react';
import useNextFrame from '../src/hooks/useNextFrame';

describe('useNextFrame cancellation', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it.each(['cancel', 'unmount'] as const)(
    'invalidates an already dispatched asynchronous task on %s',
    async action => {
      const { result, unmount } = renderHook(useNextFrame);
      let resolve: () => void;
      const prepared = new Promise<void>(done => {
        resolve = done;
      });
      const onComplete = jest.fn();
      const onFrame = jest.fn(info => {
        prepared.then(() => {
          if (!info.isCanceled()) onComplete();
        });
      });
      act(() => {
        result.current[0](onFrame);
        jest.runAllTimers();
      });
      expect(onFrame).toHaveBeenCalledTimes(1);
      if (action === 'unmount') unmount();
      else act(() => result.current[1]());
      await act(async () => resolve());
      act(() => jest.runAllTimers());
      expect(onComplete).not.toHaveBeenCalled();
      expect(jest.getTimerCount()).toBe(0);
    },
  );

  it('runs a new task after cancellation and ignores the superseded task', async () => {
    const { result } = renderHook(useNextFrame);
    let resolve: () => void;
    const prepared = new Promise<void>(done => {
      resolve = done;
    });
    const onComplete = jest.fn();
    act(() => {
      result.current[0](info => {
        prepared.then(() => {
          if (!info.isCanceled()) onComplete('old');
        });
      });
      jest.runAllTimers();
      result.current[1]();
      result.current[0](info => {
        if (!info.isCanceled()) onComplete('new');
      });
      jest.runAllTimers();
    });
    await act(async () => resolve());
    expect(onComplete.mock.calls).toEqual([['new']]);
  });
});
