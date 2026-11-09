import { act, fireEvent, render } from '@testing-library/react';
import React from 'react';
import { genCSSMotion, type CSSMotionProps } from '../src/CSSMotion';

const CSSMotion = genCSSMotion({ transitionSupport: true });

function Demo({
  mode = 'visible',
  strict = false,
  ...props
}: CSSMotionProps & { mode?: 'visible' | 'hidden'; strict?: boolean }) {
  const content = (
    <React.Activity mode={mode}>
      <CSSMotion motionName="test" {...props}>
        {({ className, style }, ref) => (
          <div
            ref={ref}
            className={className}
            style={style}
            data-testid="panel"
          >
            <input defaultValue="draft" />
          </div>
        )}
      </CSSMotion>
    </React.Activity>
  );
  return strict ? <React.StrictMode>{content}</React.StrictMode> : content;
}

function advance() {
  act(() => jest.runAllTimers());
}

function finish(panel: HTMLElement) {
  advance();
  fireEvent.transitionEnd(panel);
  advance();
}

describe.each([false, true])('Activity (StrictMode=%s)', strict => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it.each([true, false])(
    'notifies once per completed visibility change (motion=%s)',
    motion => {
      const onVisibleChanged = jest.fn();
      const props = {
        strict,
        onVisibleChanged,
        motionName: motion ? 'test' : undefined,
      };
      const { getByTestId, rerender } = render(<Demo {...props} />);
      finish(getByTestId('panel'));
      expect(onVisibleChanged.mock.calls).toEqual([[true]]);

      for (const visible of [true, false, true]) {
        rerender(<Demo {...props} visible={visible} />);
        if (motion && visible === false) finish(getByTestId('panel'));
        else if (visible) finish(getByTestId('panel'));
        const calls = [...onVisibleChanged.mock.calls];
        for (let index = 0; index < 2; index += 1) {
          rerender(<Demo {...props} visible={visible} mode="hidden" />);
          advance();
          rerender(<Demo {...props} visible={visible} />);
          advance();
          expect(onVisibleChanged.mock.calls).toEqual(calls);
        }
      }
      expect(onVisibleChanged.mock.calls).toEqual([[true], [false], [true]]);
    },
  );

  it('uses the latest callback without replaying a completed notification', () => {
    const firstCallback = jest.fn();
    const latestCallback = jest.fn();
    const replacementCallback = jest.fn();
    const { getByTestId, rerender } = render(
      <Demo strict={strict} onVisibleChanged={firstCallback} />,
    );
    const panel = getByTestId('panel');
    advance();
    rerender(<Demo strict={strict} onVisibleChanged={latestCallback} />);
    finish(panel);
    expect(firstCallback).not.toHaveBeenCalled();
    expect(latestCallback.mock.calls).toEqual([[true]]);

    rerender(<Demo strict={strict} onVisibleChanged={replacementCallback} />);
    rerender(
      <Demo
        strict={strict}
        mode="hidden"
        onVisibleChanged={replacementCallback}
      />,
    );
    rerender(<Demo strict={strict} onVisibleChanged={replacementCallback} />);
    advance();
    expect(replacementCallback).not.toHaveBeenCalled();

    rerender(
      <Demo
        strict={strict}
        visible={false}
        onVisibleChanged={replacementCallback}
      />,
    );
    finish(panel);
    expect(replacementCallback.mock.calls).toEqual([[false]]);
  });

  it('keeps an initially closed instance silent across restores', () => {
    const onVisibleChanged = jest.fn();
    const props = { strict, onVisibleChanged, visible: false };
    const { rerender } = render(<Demo {...props} />);
    rerender(<Demo {...props} mode="hidden" />);
    rerender(<Demo {...props} />);
    advance();
    expect(onVisibleChanged).not.toHaveBeenCalled();
  });

  it('notifies a completed enter after an interrupted leave even with the same last notified value', () => {
    const onVisibleChanged = jest.fn();
    const props = { strict, onVisibleChanged };
    const { getByTestId, rerender } = render(<Demo {...props} />);
    const panel = getByTestId('panel');
    finish(panel);
    rerender(<Demo {...props} visible={false} />);
    advance();
    rerender(<Demo {...props} />);
    advance();
    rerender(<Demo {...props} mode="hidden" />);
    rerender(<Demo {...props} />);
    finish(panel);
    expect(onVisibleChanged.mock.calls).toEqual([[true], [true]]);
  });

  it('preserves the settled panel and input across repeated restores', () => {
    const onAppearStart = jest.fn();
    const props = { strict, onAppearStart };
    const { getByTestId, rerender } = render(<Demo {...props} />);
    const panel = getByTestId('panel');
    finish(panel);
    const input = panel.querySelector('input');
    fireEvent.change(input, { target: { value: 'edited' } });
    onAppearStart.mockClear();

    for (let index = 0; index < 3; index += 1) {
      rerender(<Demo {...props} mode="hidden" />);
      advance();
      rerender(<Demo {...props} />);
      advance();
      expect(getByTestId('panel')).toBe(panel);
      expect(panel.querySelector('input')).toBe(input);
      expect(input.value).toBe('edited');
      expect(panel).not.toHaveClass('test-appear');
    }
    expect(onAppearStart).not.toHaveBeenCalled();
  });

  it.each([
    ['appear', 'start'],
    ['appear', 'active'],
    ['enter', 'start'],
    ['enter', 'active'],
    ['leave', 'start'],
    ['leave', 'active'],
  ] as const)(
    'finishes interrupted %s at %s and preserves the panel until leave completes',
    (motion, phase) => {
      const onVisibleChanged = jest.fn();
      const props = { strict, onVisibleChanged };
      const { getByTestId, queryByTestId, rerender } = render(
        <Demo {...props} visible={motion !== 'enter'} />,
      );
      if (motion === 'leave') finish(getByTestId('panel'));
      const visible = motion !== 'leave';
      rerender(<Demo {...props} visible={visible} />);
      if (phase === 'active') advance();
      const panel = getByTestId('panel');
      expect(panel).toHaveClass(`test-${motion}-${phase}`);
      fireEvent.change(panel.querySelector('input'), {
        target: { value: 'edited' },
      });
      onVisibleChanged.mockClear();

      rerender(<Demo {...props} visible={visible} mode="hidden" />);
      advance();
      rerender(<Demo {...props} visible={visible} />);
      advance();
      expect(getByTestId('panel')).toBe(panel);
      expect(panel.querySelector('input').value).toBe('edited');
      expect(panel).toHaveClass(`test-${motion}-active`);
      finish(panel);
      expect(onVisibleChanged.mock.calls).toEqual([[visible]]);
      if (visible) expect(panel).not.toHaveClass(`test-${motion}`);
      else expect(queryByTestId('panel')).toBeNull();
    },
  );

  it.each([true, false])(
    'uses the latest visibility when it changes while hidden (motion=%s)',
    motion => {
      const onVisibleChanged = jest.fn();
      const props = {
        strict,
        onVisibleChanged,
        motionName: motion ? 'test' : undefined,
      };
      const { getByTestId, queryByTestId, rerender } = render(
        <Demo {...props} />,
      );
      const panel = getByTestId('panel');
      finish(panel);
      rerender(<Demo {...props} mode="hidden" />);
      rerender(<Demo {...props} mode="hidden" visible={false} />);
      rerender(<Demo {...props} visible={false} />);
      finish(panel);
      expect(queryByTestId('panel')).toBeNull();
      expect(onVisibleChanged.mock.calls).toEqual([[true], [false]]);
      rerender(<Demo {...props} visible={false} mode="hidden" />);
      rerender(<Demo {...props} mode="hidden" />);
      rerender(<Demo {...props} />);
      finish(getByTestId('panel'));
      expect(onVisibleChanged.mock.calls).toEqual([[true], [false], [true]]);
    },
  );

  it('restarts the deadline for an interrupted active motion', () => {
    const onAppearEnd = jest.fn();
    const props = { strict, motionDeadline: 1000, onAppearEnd };
    const { getByTestId, rerender } = render(<Demo {...props} />);
    act(() => jest.advanceTimersByTime(100));
    const panel = getByTestId('panel');
    expect(panel).toHaveClass('test-appear-active');
    rerender(<Demo {...props} mode="hidden" />);
    advance();
    expect(onAppearEnd).not.toHaveBeenCalled();
    rerender(<Demo {...props} />);
    advance();
    advance();
    expect(getByTestId('panel')).toBe(panel);
    expect(onAppearEnd).toHaveBeenCalledTimes(1);
    expect(panel).not.toHaveClass('test-appear');
  });

  it('ignores a prepare promise resolved while disconnected', async () => {
    const resolvers: (() => void)[] = [];
    const onAppearPrepare = jest.fn(
      () => new Promise<void>(resolve => resolvers.push(resolve)),
    );
    const onAppearStart = jest.fn();
    const props = { strict, onAppearPrepare, onAppearStart };
    const { getByTestId, rerender } = render(<Demo {...props} />);
    advance();
    const panel = getByTestId('panel');
    rerender(<Demo {...props} mode="hidden" />);
    await act(async () => resolvers.forEach(resolve => resolve()));
    advance();
    rerender(<Demo {...props} />);
    advance();
    expect(getByTestId('panel')).toBe(panel);
    expect(panel).toHaveClass('test-appear-prepare');
    expect(onAppearStart).not.toHaveBeenCalled();
    await act(async () => resolvers[resolvers.length - 1]());
    finish(panel);
    expect(panel).not.toHaveClass('test-appear');
  });

  it('allows a fresh appear after a real unmount', () => {
    const onAppearStart = jest.fn();
    const props = { strict, onAppearStart };
    const first = render(<Demo {...props} />);
    const firstPanel = first.getByTestId('panel');
    finish(firstPanel);
    first.unmount();
    onAppearStart.mockClear();
    const second = render(<Demo {...props} />);
    const secondPanel = second.getByTestId('panel');
    expect(secondPanel).not.toBe(firstPanel);
    expect(secondPanel).toHaveClass('test-appear-start');
    expect(onAppearStart).toHaveBeenCalled();
    finish(secondPanel);
    expect(secondPanel).not.toHaveClass('test-appear');
  });

  it('releases pending animation work on a real unmount', async () => {
    let resolvePrepare: () => void;
    const onAppearPrepare = () =>
      new Promise<void>(resolve => {
        resolvePrepare = resolve;
      });
    const onAppearStart = jest.fn();
    const onVisibleChanged = jest.fn();
    const { unmount } = render(
      <Demo
        strict={strict}
        onAppearPrepare={onAppearPrepare}
        onAppearStart={onAppearStart}
        onVisibleChanged={onVisibleChanged}
      />,
    );
    advance();
    unmount();
    await act(async () => resolvePrepare());
    advance();
    expect(onAppearStart).not.toHaveBeenCalled();
    expect(onVisibleChanged).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  });

  it.each([false, true])(
    'preserves content through Suspense (settled=%s)',
    async settled => {
      let resolve: () => void;
      let suspended = false;
      const pending = new Promise<void>(done => {
        resolve = done;
      });
      function Suspend() {
        if (suspended) throw pending;
        return null;
      }
      const onAppearStart = jest.fn();
      function SuspenseDemo() {
        return (
          <React.Suspense fallback={<span>Loading</span>}>
            <Suspend />
            <Demo strict={strict} onAppearStart={onAppearStart} />
          </React.Suspense>
        );
      }
      const { getByTestId, rerender, queryByText } = render(<SuspenseDemo />);
      const panel = getByTestId('panel');
      if (settled) finish(panel);
      else advance();
      fireEvent.change(panel.querySelector('input'), {
        target: { value: 'edited' },
      });
      onAppearStart.mockClear();
      suspended = true;
      rerender(<SuspenseDemo />);
      expect(queryByText('Loading')).toBeInTheDocument();
      suspended = false;
      await act(async () => resolve());
      expect(queryByText('Loading')).toBeNull();
      expect(getByTestId('panel')).toBe(panel);
      expect(panel.querySelector('input').value).toBe('edited');
      if (settled) expect(onAppearStart).not.toHaveBeenCalled();
      finish(panel);
      expect(panel).not.toHaveClass('test-appear');
    },
  );
});
