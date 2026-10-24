/** F10: native DOM attrs stay current at pickAttrs consumers. */
import { mount } from '@vue/test-utils';
import { expect, it, vi } from 'vitest';
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { Rate } from '../../rate';
import { Tree } from '../../tree';
import { ColorPicker } from '../index';

it('F10: ColorPicker forwards current class/id/ARIA and listener replacements to the trigger', async () => {
  const first = vi.fn();
  const second = vi.fn();
  const attrs = ref({ class: 'before', id: 'before', 'aria-label': 'Before', onMousedown: first });
  const w = mount(defineComponent({ setup: () => () => h(ColorPicker, attrs.value) }));
  const trigger = w.get('.apollo-color-picker-trigger');
  expect(trigger.classes()).toContain('before');
  await trigger.trigger('mousedown');
  expect(first).toHaveBeenCalledTimes(1);
  attrs.value = { class: 'after', id: 'after', 'aria-label': 'After', onMousedown: second };
  await nextTick();
  expect(trigger.classes()).toContain('after');
  expect(trigger.classes()).not.toContain('before');
  expect(trigger.attributes('id')).toBe('after');
  expect(trigger.attributes('aria-label')).toBe('After');
  await trigger.trigger('mousedown');
  expect(first).toHaveBeenCalledTimes(1);
  expect(second).toHaveBeenCalledTimes(1);
  w.unmount();
});

it('F10: Rate DOM merges preserve internal/native classes and semantic keydown exactly once', async () => {
  const keydown = vi.fn();
  const w = mount(Rate, {
    attrs: { class: ['external', { active: true }], onKeydown: keydown, 'aria-label': 'Rating' },
  });
  expect(w.classes()).toContain('apollo-rate');
  expect(w.classes()).toContain('external');
  expect(w.classes()).toContain('active');
  await w.trigger('keydown', { key: 'ArrowRight', keyCode: 39 });
  expect(keydown).toHaveBeenCalledTimes(1);
  expect(w.emitted('update:value')).toEqual([[1]]);
  expect(w.attributes('aria-label')).toBe('Rating');
  w.unmount();
});

it('F10: Rate merges both event spellings once and preserves disabled keyboard suppression', async () => {
  const keydown = vi.fn();
  const leave = vi.fn();
  const w = mount(Rate, {
    attrs: { onKeydown: keydown, onKeyDown: keydown, onMouseleave: leave, onMouseLeave: leave },
  });
  await w.trigger('keydown', { key: 'ArrowRight', keyCode: 39 });
  await w.trigger('mouseleave');
  expect(keydown).toHaveBeenCalledTimes(1);
  expect(leave).toHaveBeenCalledTimes(1);
  await w.setProps({ disabled: true });
  await w.trigger('keydown', { key: 'ArrowRight', keyCode: 39 });
  expect(keydown).toHaveBeenCalledTimes(1);
  expect(w.emitted('update:value')).toEqual([[1]]);
  w.unmount();
});

it('F10: ColorPicker updates attrs even when no reactive component prop changes', async () => {
  const attrs = ref({ class: 'before', id: 'before', 'aria-label': 'Before' });
  const w = mount(defineComponent({ setup: () => () => h(ColorPicker, attrs.value) }));
  attrs.value = { class: 'after', id: 'after', 'aria-label': 'After' };
  await nextTick();
  const trigger = w.get('.apollo-color-picker-trigger');
  expect(trigger.classes()).toContain('after');
  expect(trigger.classes()).not.toContain('before');
  expect(trigger.attributes('id')).toBe('after');
  expect(trigger.attributes('aria-label')).toBe('After');
  w.unmount();
});

it('F10: Tree native class remains unique and reactive through Vue fallthrough', async () => {
  const w = mount(Tree, {
    props: { treeData: [{ key: 'a', title: 'A' }] },
    attrs: { class: 'external' },
  });
  expect(w.classes().filter((name) => name === 'external')).toHaveLength(1);
  await w.setProps({ class: 'updated' });
  expect(w.classes()).toContain('updated');
  expect(w.classes()).not.toContain('external');
  w.unmount();
});

it('F10: native classes are SSR class attributes rather than className DOM properties', async () => {
  for (const render of [
    () => h(Rate, { class: 'external' }),
    () => h(ColorPicker, { class: 'external' }),
  ]) {
    const html = await renderToString(createSSRApp({ render }));
    expect(html).toMatch(/class="[^"]*external/);
    expect(html).not.toContain('className=');
    expect(html).not.toContain('classname=');
  }
});

it('F10: Rate native style strings render valid CSS in SSR', async () => {
  const html = await renderToString(
    createSSRApp({ render: () => h(Rate, { style: 'color: red; margin-top: 2px' }) }),
  );
  expect(html).toContain('color:red');
  expect(html).toContain('margin-top:2px');
  expect(html).not.toMatch(/style="[^"]*(?:^|;)\d+:/);
});
