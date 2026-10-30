// @vitest-environment node
import { expect, it } from 'vitest';
import { createSSRApp, defineComponent, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { getGlobalEscStack, useOverlay } from '../use-overlay';

it('server requests render open state without retaining browser stack entries', async () => {
  expect(typeof window).toBe('undefined');
  const App = defineComponent({
    setup() {
      const api = useOverlay({ defaultOpen: true, action: 'click' });
      return () =>
        h('button', { ...api.targetProps.value, 'aria-expanded': api.open.value }, 'Open');
    },
  });
  const first = await renderToString(createSSRApp(App));
  const second = await renderToString(createSSRApp(App));
  expect(first).toContain('aria-expanded="true"');
  expect(second).toBe(first);
  const stack = getGlobalEscStack();
  expect(stack.size).toBe(0);
  expect(stack.attached).toBe(false);
});

it('the exported DOM-free stack does not become shared request state', () => {
  const first = getGlobalEscStack();
  first.push({ id: 'server-request', onEsc: () => {} });
  first.attach();
  expect(first.attached).toBe(false);
  expect(getGlobalEscStack().size).toBe(0);
});
