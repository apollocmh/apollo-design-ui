import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { ConfigProvider } from '../../config-provider';
import type { ConfigProviderProps } from '../../config-provider/interface';
import type { SelectProps } from '../../select/interface';
import Select from '../../select/Select';
import AutoComplete from '../AutoComplete';
import type { AutoCompleteProps } from '../interface';
import NativeFixture from './fixtures/NativeContracts.vue';

const options = [
  { value: 'aa', label: 'Alpha' },
  { value: 'bb', label: 'Beta' },
  { value: 0, label: 'Zero' },
];
const flush = async () => {
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await nextTick();
};
const mountAC = (props: Record<string, unknown> = {}) =>
  mount(AutoComplete, {
    props: { options, ...props },
    attachTo: document.body,
    global: { stubs: { teleport: false } },
  });

describe('AutoComplete native wrapper', () => {
  it('owns exactly-once change/search/select/open notifications and all three model proposals', async () => {
    const change = vi.fn(),
      search = vi.fn(),
      select = vi.fn(),
      open = vi.fn();
    const wrapper = mountAC({
      onChange: change,
      onSearch: search,
      onSelect: select,
      onOpenChange: open,
      filterOption: false,
    });
    await wrapper.get('input').setValue('typed');
    await flush();
    expect(wrapper.emitted('change')).toEqual([['typed', {}]]);
    expect(wrapper.emitted('search')).toEqual([['typed']]);
    expect(wrapper.emitted('update:searchValue')).toEqual([['typed']]);
    expect(wrapper.emitted('update:open')).toEqual([[true]]);
    expect(change).toHaveBeenCalledTimes(1);
    expect(search).toHaveBeenCalledTimes(1);
    document.querySelectorAll<HTMLElement>('.apollo-select-item-option')[1]?.click();
    await flush();
    expect(wrapper.emitted('select')).toEqual([['bb', options[1]]]);
    expect(wrapper.emitted('update:value')?.at(-1)).toEqual(['bb']);
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false]);
    expect(select).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledTimes(2);
  });

  it('keeps attrs current, merges native class/style once and honors current AutoComplete Provider semantics', async () => {
    const second = ref(false),
      native = ref(true);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            {
              prefixCls: second.value ? 'next' : 'first',
              components: {
                autoComplete: {
                  className: second.value ? 'provider-next' : 'provider-first',
                  style: { marginTop: '3px' },
                  classNames: { input: second.value ? 'input-next' : 'input-first' },
                  styles: { root: { paddingTop: '5px' } },
                },
              },
            },
            () =>
              h(AutoComplete, {
                class: native.value ? ['native', { enabled: true }] : 'replacement',
                style: native.value ? ['margin-top:9px', { paddingTop: '7px' }] : undefined,
                'aria-describedby': second.value ? 'next-help' : 'first-help',
              }),
          ),
      }),
      { attachTo: document.body, global: { stubs: { teleport: false } } },
    );
    const input = wrapper.get('input').element;
    const root = wrapper.get<HTMLElement>('.first-select');
    expect(root.classes()).toContain('provider-first');
    expect(root.classes().filter((name) => name === 'native')).toHaveLength(1);
    expect(root.element.style.marginTop).toBe('9px');
    expect(root.element.style.paddingTop).toBe('7px');
    second.value = true;
    native.value = false;
    await nextTick();
    const changed = wrapper.get<HTMLElement>('.next-select');
    expect(changed.classes()).toContain('provider-next');
    expect(changed.classes()).not.toContain('native');
    expect(changed.classes()).not.toContain('provider-first');
    expect(changed.element.style.marginTop).toBe('3px');
    expect(changed.element.style.paddingTop).toBe('5px');
    expect(wrapper.get('input').classes()).toContain('input-next');
    expect(wrapper.get('input').attributes('aria-describedby')).toBe('next-help');
    expect(wrapper.get('input').element).toBe(input);
  });

  it('forwards dynamic search and scoped suffix content, including deliberately empty and zero output', async () => {
    const visible = ref(false);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            AutoComplete,
            { options, open: true },
            visible.value
              ? {
                  searchIcon: () => 0,
                  optionRender: ({ option }: { option: { value?: string | number } }) =>
                    `Current ${option.value}`,
                  prefix: () => [],
                }
              : {},
          ),
      }),
      { attachTo: document.body, global: { stubs: { teleport: false } } },
    );
    await flush();
    expect(wrapper.find('.apollo-select-suffix').exists()).toBe(false);
    visible.value = true;
    await flush();
    expect(wrapper.get('.apollo-select-suffix').text()).toBe('0');
    expect(document.querySelector('.apollo-select-item-option-content')?.textContent).toBe(
      'Current aa',
    );
    expect(wrapper.find('.apollo-select-prefix').exists()).toBe(false);
    visible.value = false;
    await flush();
    expect(wrapper.find('.apollo-select-suffix').exists()).toBe(false);
  });

  it('exposes a typed real element, focus options and full scrolling while native attrs cannot override combobox ownership', async () => {
    const wrapper = mountAC({ mode: 'multiple', labelInValue: true });
    expect(wrapper.get('.apollo-select').classes()).toContain('apollo-select-single');
    const input = wrapper.get('input').element;
    const focus = vi.spyOn(input, 'focus');
    const instance = wrapper.vm;
    instance.focus({ preventScroll: true });
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(instance.nativeElement).toBe(wrapper.get('.apollo-select').element);
  });
});

describe('AutoComplete keyboard backfill', () => {
  it('previews keyboard candidates without committing or searching, then commits on Enter', async () => {
    const wrapper = mountAC({
      backfill: true,
      open: true,
      defaultValue: 'typed',
      filterOption: false,
    });
    await flush();
    document
      .querySelectorAll<HTMLElement>('.apollo-select-item-option')[2]
      ?.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
    await nextTick();
    expect(wrapper.get('input').element.value).toBe('typed');
    document
      .querySelectorAll<HTMLElement>('.apollo-select-item-option')[0]
      ?.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
    await wrapper.get('input').trigger('keydown', { key: 'ArrowDown', isComposing: true });
    expect(wrapper.get('input').element.value).toBe('typed');
    await wrapper.get('input').trigger('keydown', { key: 'ArrowDown' });
    await flush();
    expect(wrapper.get('input').element.value).toBe('bb');
    expect(wrapper.emitted('change')).toBeUndefined();
    expect(wrapper.emitted('search')).toBeUndefined();
    expect(wrapper.emitted('update:value')).toBeUndefined();
    expect(wrapper.emitted('update:searchValue')).toBeUndefined();
    await wrapper.get('input').trigger('keydown', { key: 'Enter' });
    await flush();
    expect(wrapper.get('input').element.value).toBe('bb');
    expect(wrapper.emitted('change')?.at(-1)?.[0]).toBe('bb');
    expect(wrapper.emitted('select')?.at(-1)?.[0]).toBe('bb');
  });

  it('clears preview on accepted value/close/flag changes and handles rejected proposals, reopens and zero', async () => {
    const wrapper = mountAC({ backfill: true, open: true, value: 'held', filterOption: false });
    await flush();
    await wrapper.get('input').trigger('keydown', { key: 'ArrowDown' });
    await wrapper.get('input').trigger('keydown', { key: 'ArrowDown' });
    await flush();
    expect(wrapper.get('input').element.value).toBe('0');
    await wrapper.get('input').trigger('keydown', { key: 'Escape' });
    await flush();
    expect(wrapper.get('input').attributes('aria-expanded')).toBe('true');
    expect(wrapper.get('input').element.value).toBe('0');
    await wrapper.get('input').trigger('keydown', { key: 'Enter' });
    await flush();
    expect(wrapper.emitted('update:value')?.at(-1)).toEqual([0]);
    expect(wrapper.get('input').element.value).toBe('held');
    await wrapper.get('input').trigger('keyup', { key: 'Enter' });
    await wrapper.get('input').trigger('keydown', { key: 'ArrowDown' });
    await wrapper.setProps({ backfill: false });
    expect(wrapper.get('input').element.value).toBe('held');
    await wrapper.setProps({ backfill: true });
    await wrapper.get('input').trigger('keydown', { key: 'ArrowDown' });
    await wrapper.setProps({ value: 'accepted' });
    expect(wrapper.get('input').element.value).toBe('accepted');
    await wrapper.get('input').trigger('keydown', { key: 'ArrowDown' });
    await wrapper.setProps({ open: false });
    expect(wrapper.get('input').element.value).toBe('accepted');
    await wrapper.setProps({ open: true });
    expect(wrapper.get('input').element.value).toBe('accepted');
    await wrapper.get('input').trigger('keydown', { key: 'ArrowDown' });
    await wrapper.get('input').setValue('edited');
    await flush();
    expect(wrapper.get('input').element.value).toBe('accepted');
  });
});

it('mounts the actual public-constructor fixture with typed slots, emits, models and refs', async () => {
  const warn = vi.spyOn(console, 'warn');
  const fixture = mount(NativeFixture, {
    attachTo: document.body,
    global: { stubs: { teleport: false } },
  });
  expect(fixture.findAllComponents(AutoComplete)).toHaveLength(1);
  await fixture.get('button').trigger('click');
  expect(document.activeElement).toBe(fixture.get('input').element);
  expect(warn.mock.calls.flat().join(' ')).not.toMatch(
    /Failed to resolve component|Invalid prop|outside of the render/,
  );
  fixture.unmount();
  warn.mockRestore();
});

it('isolates AutoComplete component configuration while retaining explicitly shared Select tokens', async () => {
  const wrapper = mount(
    defineComponent({
      setup: () => () =>
        h(
          ConfigProvider,
          {
            components: {
              select: {
                className: 'select-only',
                style: { paddingLeft: '31px' },
                allowClear: true,
                variant: 'filled',
                classNames: { input: 'select-input' },
              },
              autoComplete: {
                className: 'autocomplete-only',
                styles: ({ props }: { props: Readonly<AutoCompleteProps> }) => ({
                  input: { color: props.value === 'held' ? 'red' : 'blue' },
                }),
              },
            },
            theme: { components: { Select: { optionHeight: 44 } } },
          },
          () => h(AutoComplete, { value: 'held', 'aria-label': 'Isolated configuration' }),
        ),
    }),
    { attachTo: document.body, global: { stubs: { teleport: false } } },
  );
  const root = wrapper.get<HTMLElement>('.apollo-select');
  expect(root.classes()).toContain('autocomplete-only');
  expect(root.classes()).not.toContain('select-only');
  expect(root.classes()).not.toContain('apollo-select-filled');
  expect(wrapper.get('input').classes()).not.toContain('select-input');
  expect(root.element.style.paddingLeft).toBe('');
  expect(wrapper.find('.apollo-select-clear').exists()).toBe(false);
  expect(wrapper.get<HTMLInputElement>('input').element.style.color).toBe('red');
  expect(root.element.style.getPropertyValue('--apollo-select-option-height')).toBe('44px');
});

it('keeps two component configurations isolated through replacement/removal and evaluates semantic functions on each public props source once', async () => {
  const acValue = ref('first');
  const selectSeen: unknown[] = [],
    providerSeen: unknown[] = [],
    localSeen: unknown[] = [];
  const selectConfig = {
    className: 'select-config',
    allowClear: true,
    variant: 'filled',
    styles: ({ props }: { props: Readonly<SelectProps> }) => {
      selectSeen.push(props.value);
      return { input: { color: 'green' } };
    },
  };
  const components = ref<ConfigProviderProps['components']>({
    select: selectConfig,
    autoComplete: {
      className: 'ac-initial',
      styles: ({ props }: { props: Readonly<AutoCompleteProps> }) => {
        providerSeen.push([props.value, props.defaultActiveFirstOption]);
        return { input: { color: 'red' } };
      },
    },
  });
  const localClassNames = ({ props }: { props: Readonly<AutoCompleteProps> }) => {
    localSeen.push([props.value, props.defaultActiveFirstOption]);
    return { root: `local-${String(props.value)}` };
  };
  const fixture = mount(
    defineComponent({
      setup: () => () =>
        h(ConfigProvider, { components: components.value }, () => [
          h(Select, {
            class: 'real-select',
            value: 'select-value',
            options,
            'aria-label': 'Select config',
          }),
          h(AutoComplete, {
            class: 'real-autocomplete',
            value: acValue.value,
            classNames: localClassNames,
            'aria-label': 'Autocomplete config',
          }),
        ]),
    }),
    { attachTo: document.body, global: { stubs: { teleport: false } } },
  );
  expect(selectSeen).toEqual(['select-value']);
  expect(providerSeen).toEqual([['first', undefined]]);
  expect(localSeen).toEqual([['first', undefined]]);
  expect(fixture.get('.real-autocomplete').classes()).not.toContain('select-config');
  expect(fixture.get('.real-select').classes()).toContain('select-config');
  acValue.value = 'second';
  await nextTick();
  expect(selectSeen).toEqual(['select-value']);
  expect(providerSeen).toEqual([
    ['first', undefined],
    ['second', undefined],
  ]);
  expect(localSeen).toEqual([
    ['first', undefined],
    ['second', undefined],
  ]);
  components.value = {
    select: selectConfig,
    autoComplete: { className: 'ac-replaced', styles: { input: { color: 'blue' } } },
  };
  await nextTick();
  expect(fixture.get('.real-autocomplete').classes()).toContain('ac-replaced');
  expect(fixture.get('.real-autocomplete').classes()).not.toContain('ac-initial');
  expect(fixture.get<HTMLInputElement>('.real-autocomplete input').element.style.color).toBe(
    'blue',
  );
  components.value = { select: selectConfig };
  await nextTick();
  const ac = fixture.get('.real-autocomplete');
  expect(ac.classes()).not.toContain('ac-replaced');
  expect(ac.classes()).not.toContain('select-config');
  expect(ac.classes()).toContain('local-second');
  expect(fixture.get<HTMLInputElement>('.real-autocomplete input').element.style.color).toBe('');
  expect(fixture.get<HTMLInputElement>('.real-select input').element.style.color).toBe('green');
});

it('commits the keyboard candidate on Tab while preserving native focus navigation', async () => {
  const wrapper = mountAC({
    backfill: true,
    open: true,
    defaultValue: 'typed',
    filterOption: false,
  });
  await flush();
  await wrapper.get('input').trigger('keydown', { key: 'ArrowDown' });
  const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
  wrapper.get('input').element.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(false);
  await flush();
  expect(wrapper.emitted('change')?.at(-1)?.[0]).toBe('bb');
});
