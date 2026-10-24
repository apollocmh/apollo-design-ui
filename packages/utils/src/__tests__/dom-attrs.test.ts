import { mount } from '@vue/test-utils';
import { expect, it, vi } from 'vitest';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { mergeDomAttrs, toVueDomAttrs } from '../index';
import pickAttrs from '../pick-attrs';

it('F10: normalizes className only at the DOM boundary and preserves source data', async () => {
  const source = { className: 'external', 'aria-label': 'Action' };
  expect(pickAttrs(source).className).toBe('external');
  const attrs = mergeDomAttrs({ class: ['internal', { enabled: true }] }, pickAttrs(source));
  const render = () => h('button', attrs, 'Action');
  const w = mount({ render });
  expect(w.classes()).toEqual(['internal', 'enabled', 'external']);
  expect(w.attributes('classname')).toBeUndefined();
  const html = await renderToString(createSSRApp({ render }));
  expect(html).toContain('class="internal enabled external"');
  expect(html).not.toContain('className=');
  expect(source).toEqual({ className: 'external', 'aria-label': 'Action' });
  w.unmount();
});

it('F10: event aliases and listener arrays merge once in order', async () => {
  const order: string[] = [];
  const internal = vi.fn(() => order.push('internal'));
  const external = vi.fn(() => order.push('external'));
  const attrs = mergeDomAttrs(
    { onKeydown: internal },
    { onKeyDown: external, onKeydown: external },
  );
  const w = mount({ render: () => h('input', attrs) });
  await w.trigger('keydown', { key: 'a' });
  expect(order).toEqual(['internal', 'external']);
  expect(external).toHaveBeenCalledTimes(1);
  w.unmount();
});

it('F10: pickAttrs retains aliases listeners before normalization and deduplicates identical functions', async () => {
  const first = vi.fn();
  const second = vi.fn();
  const attrs = pickAttrs({ onMouseDown: first, onMousedown: [first, second] });
  const w = mount({ render: () => h('button', toVueDomAttrs(attrs), 'Action') });
  await w.trigger('mousedown');
  expect(first).toHaveBeenCalledTimes(1);
  expect(second).toHaveBeenCalledTimes(1);
  w.unmount();
});

it('F10: Vue once/capture listener options retain their spelling and runtime behavior', async () => {
  const once = vi.fn();
  const capture = vi.fn();
  const attrs = toVueDomAttrs(pickAttrs({ onKeydownOnce: once, onClickCapture: capture }));
  expect(Object.keys(attrs)).toEqual(['onKeydownOnce', 'onClickCapture']);
  const w = mount({ render: () => h('button', attrs, 'Action') });
  await w.trigger('keydown');
  await w.trigger('keydown');
  await w.trigger('click');
  expect(once).toHaveBeenCalledTimes(1);
  expect(capture).toHaveBeenCalledTimes(1);
  w.unmount();
});
