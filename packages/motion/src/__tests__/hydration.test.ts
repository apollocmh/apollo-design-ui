import { expect, it, vi } from 'vitest';
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { CSSMotion } from '../index';

it('hydrates visible motion content without replacing DOM, then runs appear/leave/enter', async () => {
  const visible = ref(true);
  const onAppearStart = vi.fn();
  const onLeaveStart = vi.fn();
  const onEnterStart = vi.fn();
  const changed = vi.fn();
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
          hooks: { onAppearStart, onLeaveStart, onEnterStart },
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
    await vi.waitFor(() => expect(onAppearStart).toHaveBeenCalledTimes(1));
    expect(container.querySelector('input')).toBe(input);
    expect(input.value).toBe('edited before hydration');
    await vi.waitFor(() => expect(changed).toHaveBeenCalledWith(true));
    expect(onEnterStart).not.toHaveBeenCalled();
    visible.value = false;
    await nextTick();
    await vi.waitFor(() => expect(onLeaveStart).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(container.querySelector('input')).toBeNull());
    expect(changed.mock.calls).toEqual([[true], [false]]);
    visible.value = true;
    await nextTick();
    await vi.waitFor(() => expect(onEnterStart).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(changed.mock.calls).toEqual([[true], [false], [true]]));
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
