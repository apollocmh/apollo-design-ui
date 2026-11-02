import { afterEach, expect, it, vi } from 'vitest';
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { CSSMotion } from '../index';

afterEach(() => {
  vi.useRealTimers();
});

it('hydrates visible motion content without replacing DOM, then runs appear/leave/enter', async () => {
  vi.useFakeTimers();
  const visible = ref(true);
  const events: string[] = [];
  const record = (event: string) => () => {
    events.push(event);
  };
  const onAppearStart = vi.fn(record('appear:start'));
  const onLeaveStart = vi.fn(record('leave:start'));
  const onEnterStart = vi.fn(record('enter:start'));
  const changed = vi.fn((value: boolean) => {
    events.push(`visible:${value}`);
  });
  const App = defineComponent({
    setup: () => () =>
      h(
        CSSMotion,
        {
          visible: visible.value,
          supportMotion: true,
          motionName: 'hydrated-motion',
          motionDeadline: 500,
          onVisibleChanged: changed,
          hooks: {
            onAppearStart,
            onAppearActive: record('appear:active'),
            onAppearEnd: record('appear:end'),
            onLeaveStart,
            onLeaveActive: record('leave:active'),
            onLeaveEnd: record('leave:end'),
            onEnterStart,
            onEnterActive: record('enter:active'),
            onEnterEnd: record('enter:end'),
          },
        },
        {
          default: ({
            className,
            style,
          }: {
            className: string;
            style: Record<string, string | number> | null;
          }) => h('input', { class: className, style, 'data-content': '' }),
        },
      ),
  });
  const container = document.createElement('div');
  container.innerHTML = await renderToString(createSSRApp(App));
  document.body.appendChild(container);
  const input = container.querySelector('input');
  expect(input).not.toBeNull();
  if (!input) throw new Error('SSR must render visible motion content');
  input.value = 'edited before hydration';
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  const app = createSSRApp(App);
  try {
    app.mount(container);
    await nextTick();
    expect(onAppearStart).toHaveBeenCalledTimes(1);
    expect(container.querySelector('input')).toBe(input);
    expect(input.value).toBe('edited before hydration');
    expect(events).toEqual(['appear:start']);

    // The deadline starts at active, after two rAFs. Drive both clocks instead
    // of spending waitFor's wall-clock budget on CI scheduling plus the deadline.
    vi.advanceTimersToNextFrame();
    await nextTick();
    expect(input.classList).toContain('hydrated-motion-appear-start');
    expect(events).toEqual(['appear:start']);
    vi.advanceTimersToNextFrame();
    await nextTick();
    expect(input.classList).toContain('hydrated-motion-appear-active');
    expect(events).toEqual(['appear:start', 'appear:active']);
    await vi.advanceTimersByTimeAsync(499);
    expect(changed).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(changed.mock.calls).toEqual([[true]]);
    expect(events).toEqual(['appear:start', 'appear:active', 'appear:end', 'visible:true']);
    expect(onEnterStart).not.toHaveBeenCalled();
    visible.value = false;
    await nextTick();
    await nextTick();
    expect(onLeaveStart).toHaveBeenCalledTimes(1);
    vi.advanceTimersToNextFrame();
    vi.advanceTimersToNextFrame();
    await nextTick();
    expect(input.classList).toContain('hydrated-motion-leave-active');
    await vi.advanceTimersByTimeAsync(499);
    expect(container.querySelector('input')).toBe(input);
    expect(changed.mock.calls).toEqual([[true]]);
    await vi.advanceTimersByTimeAsync(1);
    expect(container.querySelector('input')).toBeNull();
    expect(changed.mock.calls).toEqual([[true], [false]]);
    visible.value = true;
    await nextTick();
    await nextTick();
    expect(onEnterStart).toHaveBeenCalledTimes(1);
    vi.advanceTimersToNextFrame();
    vi.advanceTimersToNextFrame();
    await nextTick();
    expect(container.querySelector('input')?.classList).toContain('hydrated-motion-enter-active');
    await vi.advanceTimersByTimeAsync(499);
    expect(changed.mock.calls).toEqual([[true], [false]]);
    await vi.advanceTimersByTimeAsync(1);
    expect(changed.mock.calls).toEqual([[true], [false], [true]]);
    expect(events).toEqual([
      'appear:start',
      'appear:active',
      'appear:end',
      'visible:true',
      'leave:start',
      'leave:active',
      'leave:end',
      'visible:false',
      'enter:start',
      'enter:active',
      'enter:end',
      'visible:true',
    ]);
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  } finally {
    app.unmount();
    container.remove();
    warn.mockRestore();
    error.mockRestore();
  }
});

it.each([
  { visible: false, forceRender: false },
  { visible: false, forceRender: true },
  { visible: true, forceRender: false },
])('hydration agrees with SSR for $visible / forceRender=$forceRender', async (props) => {
  const App = defineComponent({
    setup: () => () =>
      h(
        CSSMotion,
        { ...props, motionName: 'hydrated-motion', supportMotion: true, motionDeadline: 500 },
        {
          default: ({
            className,
            style,
          }: {
            className: string;
            style: Record<string, string | number> | null;
          }) => h('div', { class: className, style, 'data-content': '' }, 'content'),
        },
      ),
  });
  const container = document.createElement('div');
  container.innerHTML = await renderToString(createSSRApp(App));
  const before = container.firstChild;
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  const app = createSSRApp(App);
  try {
    app.mount(container);
    await nextTick();
    expect(container.firstChild).toBe(before);
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  } finally {
    app.unmount();
    container.remove();
    warn.mockRestore();
    error.mockRestore();
  }
});
