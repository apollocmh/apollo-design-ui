import { config, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { ConfigProvider } from '../../config-provider';
import BaseSelect from '../engine/BaseSelect';
import { useLock, useOpen } from '../engine/useOpen';
import type { SelectProps } from '../interface';
import Select from '../Select';
import NativeFixture from './fixtures/NativeContracts.vue';

config.global.stubs = { ...config.global.stubs, teleport: false };

const options = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana' },
];
const flush = async () => {
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await nextTick();
};

describe('Select · native public contracts', () => {
  it('owns semantic emits, including a controlled search model', async () => {
    const search = vi.fn();
    const change = vi.fn();
    const wrapper = mount(Select, {
      props: { options, showSearch: true, open: true, onSearch: search, onChange: change },
      attachTo: document.body,
    });
    await flush();
    await wrapper.get('input').setValue('a');
    expect(wrapper.emitted('search')).toEqual([['a']]);
    expect(wrapper.emitted('update:searchValue')).toEqual([['a']]);
    expect(search).toHaveBeenCalledTimes(1);
    document.querySelector<HTMLElement>('.apollo-select-item-option')?.click();
    await flush();
    expect(wrapper.emitted('change')?.[0]).toEqual(['a', options[0]]);
    expect(change).toHaveBeenCalledTimes(1);
    expect(wrapper.emitted('update:searchValue')?.at(-1)).toEqual(['']);
  });

  it('does not retain a rejected controlled value, search or open proposal after control is removed', async () => {
    const wrapper = mount(Select, {
      props: { options, value: 'a', searchValue: '', showSearch: true, open: true },
      attachTo: document.body,
    });
    await flush();
    await wrapper.get('input').setValue('b');
    document.querySelector<HTMLElement>('.apollo-select-item-option')?.click();
    await flush();
    expect(wrapper.get('input').element.value).toBe('');
    await wrapper.setProps({ value: undefined, searchValue: undefined, open: undefined });
    expect(wrapper.get('.apollo-select-content').text()).toContain('Apple');
    expect(wrapper.get('input').element.value).toBe('');
    expect(wrapper.get('input').attributes('aria-expanded')).toBe('true');
  });

  it('reads added, replaced and deliberately empty slots during render', async () => {
    const phase = ref(0);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            Select,
            { options, value: 'a', open: true, allowClear: true },
            phase.value === 0
              ? {}
              : {
                  labelRender: () => (phase.value === 2 ? [] : 'Custom label'),
                  optionRender: ({ option }: { option: { value?: string | number } }) =>
                    `Option ${option.value}`,
                  prefix: () => 0,
                  clearIcon: () => [],
                  suffixIcon: () => [],
                },
          ),
      }),
      { attachTo: document.body },
    );
    await flush();
    phase.value = 1;
    await flush();
    expect(wrapper.get('.apollo-select-content').text()).toBe('Custom label');
    expect(document.querySelector('.apollo-select-item-option-content')?.textContent).toBe(
      'Option a',
    );
    expect(wrapper.get('.apollo-select-prefix').text()).toBe('0');
    expect(wrapper.find('.apollo-select-suffix').exists()).toBe(false);
    expect(wrapper.find('.apollo-select-clear').exists()).toBe(false);
    phase.value = 2;
    await flush();
    expect(wrapper.get('.apollo-select-content').text()).toBe('');
    phase.value = 0;
    await flush();
    expect(wrapper.get('.apollo-select-content').text()).toContain('Apple');
  });

  it('passes actual focus to suffix scope and preserves a searchIcon slot', async () => {
    const wrapper = mount(Select, {
      props: { options, showSearch: true },
      slots: {
        suffixIcon: ({ focused }) => (focused ? 'focused' : 'idle'),
        searchIcon: () => 0,
      },
      attachTo: document.body,
    });
    wrapper.get('input').element.focus();
    await nextTick();
    expect(wrapper.get('.apollo-select-suffix').text()).toBe('focused');
    await wrapper.get('.apollo-select').trigger('mousedown');
    await flush();
    expect(wrapper.get('.apollo-select-suffix').text()).toBe('0');
    await wrapper.setProps({ loading: true });
    expect(wrapper.get('.apollo-select-suffix').text()).toBe('focused');
  });

  it('merges native class/style and current Provider configuration at their DOM targets', async () => {
    const current = ref(false);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            {
              prefixCls: current.value ? 'next' : 'first',
              components: {
                select: {
                  className: current.value ? 'provider-next' : 'provider-first',
                  style: { paddingTop: '4px' },
                  classNames: { input: current.value ? 'input-next' : 'input-first' },
                  styles: { root: { marginTop: '3px' }, input: { letterSpacing: '2px' } },
                },
              },
            },
            () =>
              h(Select, {
                options,
                class: ['native', { enabled: true }],
                style: ['padding-top: 7px', { marginTop: '9px' }],
                classNames: { root: 'local-root' },
                id: current.value ? 'next-select-id' : 'first-select-id',
                tabindex: 3,
                role: 'combobox',
                'aria-describedby': current.value ? 'next-description' : 'first-description',
              }),
          ),
      }),
    );
    const root = wrapper.get<HTMLElement>('.first-select');
    expect(root.classes()).toContain('enabled');
    expect(root.attributes('tabindex')).toBeUndefined();
    expect(wrapper.get('input').attributes('id')).toBe('first-select-id');
    expect(wrapper.get('input').attributes('tabindex')).toBe('3');
    expect(root.classes()).toContain('provider-first');
    expect(root.element.style.paddingTop).toBe('7px');
    expect(root.element.style.marginTop).toBe('9px');
    expect(wrapper.get('input').classes()).toContain('input-first');
    expect(wrapper.get('input').element.style.letterSpacing).toBe('2px');
    current.value = true;
    await nextTick();
    expect(wrapper.find('.next-select').exists()).toBe(true);
    expect(wrapper.get('input').classes()).toContain('input-next');
    expect(wrapper.get('input').attributes('id')).toBe('next-select-id');
    expect(wrapper.get('input').attributes('aria-describedby')).toBe('next-description');
    expect(wrapper.get('input').attributes('role')).toBe('combobox');
  });

  it('keeps raw trigger click handlers exactly once and raw attrs current', async () => {
    const click = vi.fn();
    const label = ref('first');
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(BaseSelect, {
            prefixCls: 'raw',
            id: 'raw',
            'aria-label': label.value,
            getRawInputElement: () => h('button', { onClick: click }, 'Open'),
            optionListRenderer: () => h('div', 'Menu'),
          }),
      }),
      { attachTo: document.body },
    );
    await wrapper.get('button').trigger('click');
    await flush();
    expect(click).toHaveBeenCalledTimes(1);
    label.value = 'second';
    await nextTick();
    expect(wrapper.get('button').attributes('aria-label')).toBe('second');
  });

  it('accepts keyboard key names and retains native handlers without replacing selection', async () => {
    const keydown = vi.fn();
    const wrapper = mount(Select, {
      props: { options },
      attrs: { onKeydown: keydown },
      attachTo: document.body,
    });
    await wrapper.get('input').trigger('keydown', { key: 'Enter' });
    await wrapper.get('input').trigger('keyup', { key: 'Enter' });
    await flush();
    await wrapper.get('input').trigger('keydown', { key: 'ArrowDown' });
    await wrapper.get('input').trigger('keydown', { key: 'Enter' });
    await flush();
    expect(wrapper.emitted('change')?.at(-1)?.[0]).toBe('b');
    expect(keydown).toHaveBeenCalledTimes(3);
  });
});

describe('Select · real ref and resource boundaries', () => {
  it('forwards focus options and scroll coordinates/key/align to the real controls', async () => {
    // jsdom has no viewport layout; item-key alignment reads the holder's clientHeight.
    const viewportHeight = vi
      .spyOn(HTMLElement.prototype, 'clientHeight', 'get')
      .mockReturnValue(64);
    const popupScroll = vi.fn();
    const wrapper = mount(Select, {
      props: {
        options: Array.from({ length: 40 }, (_, index) => ({ value: index, label: String(index) })),
        open: true,
        listHeight: 64,
        onPopupScroll: popupScroll,
      },
      attachTo: document.body,
    });
    await flush();
    const input = wrapper.get('input').element;
    const focus = vi.spyOn(input, 'focus');
    wrapper.vm.focus({ preventScroll: true });
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(document.activeElement).toBe(input);
    expect(wrapper.vm.nativeElement).toBe(wrapper.get('.apollo-select').element);
    wrapper.vm.scrollTo(320);
    await flush();
    const holder = document.querySelector<HTMLElement>('.apollo-select-dropdown-list-holder');
    expect(holder?.scrollTop).toBe(320);
    wrapper.vm.scrollTo({ key: 20, align: 'top' });
    await flush();
    expect(holder?.scrollTop).toBe(640);
    wrapper.vm.scrollTo({ index: 5, align: 'auto' });
    await flush();
    expect(holder?.scrollTop).toBe(160);
    if (!holder) throw new Error('Select did not render its native scroll holder');
    const scrollEvent = new Event('scroll');
    holder.dispatchEvent(scrollEvent);
    expect(popupScroll).toHaveBeenCalledExactlyOnceWith(scrollEvent);
    wrapper.vm.blur();
    expect(document.activeElement).not.toBe(input);
    viewportHeight.mockRestore();
  });

  it('binds a nonvirtual combobox to one listbox id on the actual scroll holder', async () => {
    const wrapper = mount(Select, {
      props: { id: 'native-listbox', options, open: true, virtual: false },
      attachTo: document.body,
    });
    await flush();
    const input = wrapper.get('input');
    const controls = input.attributes('aria-controls');
    if (!controls) throw new Error('The open Select must reference a listbox');
    const list = document.getElementById(controls);
    expect(list?.getAttribute('role')).toBe('listbox');
    expect(list?.classList.contains('apollo-select-dropdown-list-holder')).toBe(true);
    expect(input.attributes('aria-owns')).toBe(controls);
    expect(document.querySelectorAll(`#${controls}`)).toHaveLength(1);
    expect(list?.parentElement?.hasAttribute('id')).toBe(false);
    expect(list?.parentElement?.hasAttribute('role')).toBe(false);
    wrapper.unmount();
  });
});

it('tokenizes only new selections, counts unique additions and respects maxCount', async () => {
  const wrapper = mount(Select, {
    props: { options, mode: 'multiple', defaultValue: ['a'], maxCount: 2, tokenSeparators: [','] },
    attachTo: document.body,
  });
  await wrapper.get('input').setValue('Apple,Apple,Banana');
  expect(wrapper.emitted('change')?.[0]?.[0]).toEqual(['a', 'b']);
  expect(wrapper.emitted('select')).toEqual([['b', options[1]]]);
});

it('cancels delayed open changes and short-lock timers when the owner unmounts', async () => {
  const change = vi.fn();
  let close = () => {};
  const wrapper = mount(
    defineComponent({
      setup() {
        const state = useOpen({
          defaultOpen: () => true,
          getOpen: () => undefined,
          onOpen: change,
          postOpen: (value) => value,
        });
        close = () => state.toggleOpen(false);
        return () => h('div');
      },
    }),
  );
  await nextTick();
  close();
  wrapper.unmount();
  await flush();
  expect(change).not.toHaveBeenCalled();
  vi.useFakeTimers();
  try {
    const owner = mount(
      defineComponent({
        setup() {
          const [, lock] = useLock();
          lock(true);
          return () => h('div');
        },
      }),
    );
    expect(vi.getTimerCount()).toBe(1);
    owner.unmount();
    expect(vi.getTimerCount()).toBe(0);
  } finally {
    vi.useRealTimers();
  }
});

it('mounts the real public-constructor SFC fixture with native models, slots and template refs', async () => {
  const warn = vi.spyOn(console, 'warn');
  const fixture = mount(NativeFixture, { attachTo: document.body });
  await flush();
  expect(fixture.findAll('input')).toHaveLength(2);
  expect(fixture.findAllComponents(Select)).toHaveLength(2);
  await fixture.get('button').trigger('click');
  expect(document.activeElement).toBe(fixture.get('input').element);
  expect(warn.mock.calls.flat().join(' ')).not.toMatch(
    /Failed to resolve component|outside of the render|Invalid prop/,
  );
  fixture.unmount();
  warn.mockRestore();
});

it('supplies current component props to Provider semantic functions', async () => {
  const status = ref<SelectProps['status']>('error');
  const fixture = mount(
    defineComponent({
      setup: () => () =>
        h(
          ConfigProvider,
          {
            components: {
              select: {
                classNames: ({ props }: { props: Readonly<SelectProps> }) => ({
                  root: `provider-${props.status}`,
                }),
                styles: ({ props }: { props: Readonly<SelectProps> }) => ({
                  input: { color: props.status === 'error' ? 'red' : 'orange' },
                }),
              },
            },
          },
          () => h(Select, { status: status.value, 'aria-label': 'Semantic props' }),
        ),
    }),
  );
  expect(fixture.get('.apollo-select').classes()).toContain('provider-error');
  expect(fixture.get<HTMLInputElement>('input').element.style.color).toBe('red');
  status.value = 'warning';
  await nextTick();
  expect(fixture.get('.apollo-select').classes()).toContain('provider-warning');
  expect(fixture.get<HTMLInputElement>('input').element.style.color).toBe('orange');
});
