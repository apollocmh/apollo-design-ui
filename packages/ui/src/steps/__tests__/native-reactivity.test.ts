import { mount } from '@vue/test-utils';
import { expect, it, vi } from 'vitest';
import { Steps } from '../index';
import type { StepsProps } from '../interface';

it('updates current status and the controlled next-step action', async () => {
  const change = vi.fn();
  const w = mount(Steps, {
    props: {
      current: 0,
      items: [
        { key: 'a', title: 'Alpha' },
        { key: 'b', title: 'Beta' },
      ],
      onChange: change,
    },
  });
  expect(w.findAll('.apollo-steps-item')[0]?.classes()).toContain('apollo-steps-item-process');
  await w.setProps({ current: 1 });
  expect(w.findAll('.apollo-steps-item')[0]?.classes()).toContain('apollo-steps-item-finish');
  expect(w.findAll('.apollo-steps-item')[1]?.classes()).toContain('apollo-steps-item-process');
  await w.findAll('.apollo-steps-item')[0]?.trigger('click');
  expect(change).toHaveBeenCalledExactlyOnceWith(0);
});

it('updates items and maxCount without recreating the root', async () => {
  const items = Array.from({ length: 8 }, (_, index) => ({ key: index, title: `Item ${index}` }));
  const w = mount(Steps, { props: { items, current: 4, maxCount: 3 } });
  const root = w.element;
  expect(w.findAll('.apollo-steps-item-ellipsis').length).toBeGreaterThan(0);
  await w.setProps({ maxCount: undefined, items: [{ key: 7, title: 'Updated' }] });
  expect(w.findAll('.apollo-steps-item-title').map((node) => node.text())).toEqual(['Updated']);
  expect(w.find('.apollo-steps-item-ellipsis').exists()).toBe(false);
  expect(w.element).toBe(root);
});

it('updates native class and object/string style without stale attrs', async () => {
  const w = mount(Steps, {
    props: { items: [{ title: 'Alpha' }] },
    attrs: { class: 'first', style: { color: 'red' } },
  });
  await w.setProps({
    class: ['second', { active: true }],
    style: 'color: blue; --steps-accent: green',
  });
  expect(w.classes()).toContain('second');
  expect(w.classes()).not.toContain('first');
  expect(w.attributes('style')).toContain('color: blue');
  expect(w.attributes('style')).toContain('--steps-accent: green');
});

it('accepts documented semantic functions and supplies current resolved props', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const classNames: StepsProps['classNames'] = ({ props }) => ({
      root: `semantic-current-${props.current}`,
    });
    const styles: StepsProps['styles'] = ({ props }) => ({
      root: { opacity: props.current === 0 ? 1 : 0.5 },
    });
    const w = mount(Steps, {
      props: { items: [{ title: 'Alpha' }, { title: 'Beta' }], current: 0, classNames, styles },
    });
    expect(w.classes()).toContain('semantic-current-0');
    await w.setProps({ current: 1 });
    expect(w.classes()).toContain('semantic-current-1');
    expect(w.attributes('style')).toContain('opacity: 0.5');
    expect(warn).not.toHaveBeenCalled();
  } finally {
    warn.mockRestore();
  }
});
