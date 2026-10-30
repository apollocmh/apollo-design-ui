import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import ConfigProvider from '../../config-provider/ConfigProvider';
import Checkbox from '../Checkbox';
import Group from '../Group';

describe('Checkbox current native contracts', () => {
  it('owns exactly one native change event and preserves the requested checked snapshot', async () => {
    let parentChanges = 0;
    const Host = defineComponent({
      setup: () => () =>
        h(
          'div',
          {
            onChange: () => {
              parentChanges += 1;
            },
          },
          [
            h(Checkbox, {
              checked: false,
              onChange: (event, checked) => {
                expect(checked).toBe(true);
                event.stopPropagation();
              },
            }),
          ],
        ),
    });
    const wrapper = mount(Host, { attachTo: document.body });
    const checkbox = wrapper.getComponent(Checkbox);
    const input = wrapper.get<HTMLInputElement>('input');
    input.element.click();
    await nextTick();
    expect(checkbox.emitted('change')).toHaveLength(1);
    const args = checkbox.emitted('change')?.[0];
    expect(args?.[0]).toBeInstanceOf(Event);
    expect(args).toHaveLength(2);
    expect(args?.[1]).toBe(true);
    expect(input.element.checked).toBe(false);
    expect(parentChanges).toBe(0);
    wrapper.unmount();
  });
  it('allows native click cancellation before any checked proposal', async () => {
    const wrapper = mount(Checkbox, {
      props: { onClick: (event) => event.preventDefault() },
      attachTo: document.body,
    });
    const input = wrapper.get<HTMLInputElement>('input');
    input.element.click();
    await nextTick();
    expect(input.element.checked).toBe(false);
    expect(wrapper.emitted('change')).toBeUndefined();
    expect(wrapper.emitted('update:checked')).toBeUndefined();
    expect(wrapper.emitted('click')).toHaveLength(1);
    wrapper.unmount();
  });
  it('follows current Provider semantic configuration and native style string/array attrs', async () => {
    const name = ref('first');
    const Host = defineComponent({
      setup: () => () =>
        h(
          ConfigProvider,
          {
            components: {
              checkbox: {
                className: `${name.value}-configured`,
                classNames: { root: `${name.value}-semantic`, icon: 'provider-icon' },
                styles: { root: { color: 'red' }, icon: { opacity: 0.6 } },
              },
            },
          },
          () =>
            h(Checkbox, {
              class: name.value,
              style: name.value === 'first' ? 'width:100px;color:blue' : [{ width: '200px' }],
              'aria-label': name.value,
            }),
        ),
    });
    const wrapper = mount(Host);
    const label = wrapper.get<HTMLElement>('label');
    expect(label.classes()).toContain('first-configured');
    expect(label.classes()).toContain('first-semantic');
    expect(label.element.style.width).toBe('100px');
    expect(label.element.style.color).toBe('blue');
    expect(wrapper.get<HTMLElement>('.provider-icon').element.style.opacity).toBe('0.6');
    name.value = 'next';
    await nextTick();
    expect(label.classes()).not.toContain('first-configured');
    expect(label.classes()).toContain('next-configured');
    expect(label.classes()).toContain('next-semantic');
    expect(label.element.style.width).toBe('200px');
    expect(label.element.style.color).toBe('red');
    expect(wrapper.get('input').attributes('aria-label')).toBe('next');
    wrapper.unmount();
  });
  it('updates skipGroup registration and drops removed values from accepted group state', async () => {
    const skipped = ref(false);
    const Host = defineComponent({
      setup: () => () =>
        h(
          Group,
          { defaultValue: ['a'] },
          {
            default: () => [
              h(Checkbox, { value: 'a', skipGroup: skipped.value }),
              h(Checkbox, { value: 'b' }),
            ],
          },
        ),
    });
    const wrapper = mount(Host, { attachTo: document.body });
    skipped.value = true;
    await nextTick();
    wrapper.findAll<HTMLInputElement>('input')[1]?.element.click();
    await nextTick();
    expect(wrapper.getComponent(Group).emitted('change')?.at(-1)).toEqual([['b']]);
    skipped.value = false;
    await nextTick();
    expect(
      wrapper.findAll<HTMLInputElement>('input').map((input) => input.element.checked),
    ).toEqual([false, true]);
    wrapper.unmount();
  });
  it('binds actual option values to native form inputs', () => {
    const Host = defineComponent({
      setup: () => () =>
        h('form', [h(Group, { name: 'choices', options: ['a', 'b'], defaultValue: ['b'] })]),
    });
    const wrapper = mount(Host);
    const form = wrapper.get<HTMLFormElement>('form').element;
    expect(new FormData(form).getAll('choices')).toEqual(['b']);
    wrapper.unmount();
  });
});
