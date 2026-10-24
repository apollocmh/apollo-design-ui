import { mount } from '@vue/test-utils';
import { expect, it, vi } from 'vitest';
import { createSSRApp, h, nextTick, withModifiers } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { Switch } from '../index';

it('D02: click modifiers receive the original native event once', async () => {
  const click = vi.fn();
  const outer = vi.fn();
  const w = mount({
    render: () =>
      h(
        'div',
        { onClick: outer },
        h(Switch, { onClick: withModifiers(click, ['stop', 'prevent']) }),
      ),
  });
  const event = new MouseEvent('click', { bubbles: true, cancelable: true });
  w.get('button').element.dispatchEvent(event);
  await nextTick();
  expect(click).toHaveBeenCalledExactlyOnceWith(event);
  expect(event.defaultPrevented).toBe(true);
  expect(outer).not.toHaveBeenCalled();
  expect(w.get('button').attributes('aria-checked')).toBe('true');
});

it('D02: click listeners, arrays and once listeners each receive one event', async () => {
  const first = vi.fn();
  const second = vi.fn();
  const once = vi.fn();
  const w = mount(Switch, { attrs: { onClick: [first, second], onClickOnce: once } });
  await w.get('button').trigger('click');
  expect(first).toHaveBeenCalledTimes(1);
  expect(second).toHaveBeenCalledTimes(1);
  expect(once).toHaveBeenCalledTimes(1);
  expect(first.mock.calls[0]).toEqual([expect.any(MouseEvent)]);
  expect(second.mock.calls[0]?.[0]).toBe(first.mock.calls[0]?.[0]);
  await w.setProps({ onClick: second });
  await w.get('button').trigger('click');
  expect(first).toHaveBeenCalledTimes(1);
  expect(second).toHaveBeenCalledTimes(2);
  expect(once).toHaveBeenCalledTimes(1);
  expect(w.emitted('change')).toHaveLength(2);
});

it('D02: standard key-only arrow events work and do not synthesize click', async () => {
  const click = vi.fn();
  const keydown = vi.fn();
  const w = mount(Switch, { attrs: { onClick: click, onKeydown: keydown } });
  const right = new KeyboardEvent('keydown', {
    key: 'ArrowRight',
    bubbles: true,
    cancelable: true,
  });
  w.element.dispatchEvent(right);
  await nextTick();
  expect(w.emitted('change')).toEqual([[true, right]]);
  expect(right.defaultPrevented).toBe(true);
  const left = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true });
  w.element.dispatchEvent(left);
  await nextTick();
  expect(w.emitted('change')?.[1]).toEqual([false, left]);
  expect(keydown).toHaveBeenCalledTimes(2);
  expect(click).not.toHaveBeenCalled();
});

it('D02: disabled native activation is suppressed; explicit dispatch keeps its event without changing state', async () => {
  const click = vi.fn();
  const w = mount(Switch, { props: { disabled: true }, attrs: { onClick: click } });
  w.get('button').element.click();
  expect(click).not.toHaveBeenCalled();
  const event = new MouseEvent('click', { bubbles: true });
  w.element.dispatchEvent(event);
  await nextTick();
  expect(click).toHaveBeenCalledExactlyOnceWith(event);
  expect(w.emitted('change')).toBeUndefined();
  expect(w.emitted('update:checked')).toBeUndefined();
});

it('D02: native string/array styles merge with semantic styles in SSR and attrs-only updates', async () => {
  const html = await renderToString(
    createSSRApp({ render: () => h(Switch, { style: 'color:red' }) }),
  );
  expect(html).toContain('color:red');
  const w = mount(Switch, {
    props: { styles: { root: { color: 'green', marginTop: '4px' } } },
    attrs: { style: 'color:red', id: 'native-switch' },
  });
  const button = w.element;
  expect(w.attributes('style')).toContain('color: red');
  expect(w.attributes('style')).toContain('margin-top: 4px');
  await w.setProps({ style: ['color:blue', { paddingTop: '2px' }], id: 'updated-switch' });
  expect(w.element).toBe(button);
  expect(w.attributes('id')).toBe('updated-switch');
  expect(w.attributes('style')).toContain('color: blue');
  expect(w.attributes('style')).toContain('padding-top: 2px');
});
