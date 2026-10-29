/** State and Vue disclosure contracts; native key activation is exercised in browser.mjs. */
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { getActiveKeysArray } from '../engine';
import {
  Collapse,
  type CollapseExpandIconScope,
  type CollapseProps,
  type CollapseRef,
} from '../index';

const ITEMS = [
  { key: '1', label: 'Header 1', children: 'Content 1' },
  { key: '2', label: 'Header 2', children: 'Content 2' },
];
const makeCollapse = (props: CollapseProps = {}) =>
  mount(Collapse, { props: { items: ITEMS, ...props } });

describe('Collapse state and native disclosure', () => {
  it('normalizes arrays, scalar numbers/strings and undefined without retaining the input array', () => {
    const keys = ['a', 2];
    expect(getActiveKeysArray(keys)).toEqual(['a', '2']);
    expect(getActiveKeysArray(keys)).not.toBe(keys);
    expect(getActiveKeysArray('1')).toEqual(['1']);
    expect(getActiveKeysArray(3)).toEqual(['3']);
    expect(getActiveKeysArray(undefined)).toEqual([]);
  });
  it('uncontrolled activation emits exactly one update and change per request', async () => {
    const onChange = vi.fn();
    const w = makeCollapse({ onChange });
    await w.get('.apollo-collapse-trigger').trigger('click');
    expect(onChange).toHaveBeenCalledExactlyOnceWith(['1']);
    expect(w.emitted('update:activeKey')).toEqual([[['1']]]);
    expect(w.findAll('.apollo-collapse-item-active')).toHaveLength(1);
    await w.get('.apollo-collapse-trigger').trigger('click');
    expect(onChange.mock.calls).toEqual([[['1']], [[]]]);
  });
  it('uses a native button in a heading; keyboard generated click has one activation', async () => {
    const onChange = vi.fn();
    const w = makeCollapse({ onChange });
    const button = w.get('h3 > button');
    expect(button.attributes('type')).toBe('button');
    button.element.dispatchEvent(new MouseEvent('click', { detail: 0, bubbles: true }));
    await nextTick();
    expect(onChange).toHaveBeenCalledExactlyOnceWith(['1']);
  });
  it('Escape does not activate the native button', async () => {
    const onChange = vi.fn();
    const w = makeCollapse({ onChange });
    await w.get('button').trigger('keydown', { key: 'Escape' });
    expect(onChange).not.toHaveBeenCalled();
  });
  it('controlled requests leave accepted presentation unchanged', async () => {
    const w = makeCollapse({ activeKey: ['2'] });
    await w.get('button').trigger('click');
    expect(w.findAll('button').map((n) => n.attributes('aria-expanded'))).toEqual([
      'false',
      'true',
    ]);
    expect(w.emitted('change')).toEqual([[['2', '1']]]);
  });
  it('accordion has one open disclosure without false tab roles', async () => {
    const w = makeCollapse({ accordion: true, defaultActiveKey: '1' });
    await w.findAll('button')[1]?.trigger('click');
    expect(w.findAll('button').map((n) => n.attributes('aria-expanded'))).toEqual([
      'false',
      'true',
    ]);
    expect(w.find('[role=tablist],[role=tab],[role=tabpanel]').exists()).toBe(false);
  });
  it('numeric item keys match numeric model values', () => {
    const w = makeCollapse({
      items: [{ key: 1, label: 'H1', children: 'C1' }],
      defaultActiveKey: 1,
    });
    expect(w.get('button').attributes('aria-expanded')).toBe('true');
    expect(w.text()).toContain('C1');
  });
  it('disabled native button is excluded from interaction', async () => {
    const onChange = vi.fn();
    const w = makeCollapse({ collapsible: 'disabled', onChange });
    expect(w.get<HTMLButtonElement>('button').element.disabled).toBe(true);
    expect(w.get('button').attributes('aria-disabled')).toBe('true');
    await w.get('button').trigger('click');
    expect(onChange).not.toHaveBeenCalled();
  });
  it('header mode places both title and icon in the native button', () => {
    const w = makeCollapse({ collapsible: 'header' });
    expect(w.get('button .apollo-collapse-title').text()).toBe('Header 1');
    expect(w.find('button .apollo-collapse-expand-icon').exists()).toBe(true);
    expect(w.get('.apollo-collapse-header').attributes('role')).toBeUndefined();
  });
  it('icon mode keeps title outside the named native button', () => {
    const w = makeCollapse({ collapsible: 'icon' });
    expect(w.find('button .apollo-collapse-title').exists()).toBe(false);
    expect(w.get('button').attributes('aria-labelledby')).toBe(
      w.get('.apollo-collapse-title').attributes('id'),
    );
  });
  it('default retains opened content after completed close', async () => {
    const w = makeCollapse({ defaultActiveKey: '1' });
    const body = w.get('.apollo-collapse-body').element;
    await w.get('button').trigger('click');
    await vi.waitFor(() => expect(w.get('[role=region]').attributes('hidden')).toBeDefined());
    expect(w.get('.apollo-collapse-body').element).toBe(body);
    expect(w.get('[role=region]').attributes('inert')).toBeDefined();
    expect(w.get('[role=region]').attributes('hidden')).toBeDefined();
  });
  it('destroyOnHidden removes body after close while keeping the controlled region ID', async () => {
    const w = makeCollapse({ defaultActiveKey: '1', destroyOnHidden: true });
    const id = w.get('[role=region]').attributes('id');
    await w.get('button').trigger('click');
    await vi.waitFor(() => expect(w.find('.apollo-collapse-body').exists()).toBe(false));
    expect(w.get('[role=region]').attributes('id')).toBe(id);
    expect(w.get('button').attributes('aria-controls')).toBe(id);
  });
  it('item collapsible overrides root mode', () => {
    const w = makeCollapse({
      collapsible: 'disabled',
      items: [
        { key: '1', label: 'H1', collapsible: 'header' },
        { key: '2', label: 'H2' },
      ],
    });
    expect(w.findAll<HTMLButtonElement>('button').map((n) => n.element.disabled)).toEqual([
      false,
      true,
    ]);
  });
  it('expandIcon slot receives the complete named scope and preserves its VNode', () => {
    const expandIcon = vi.fn((_scope: CollapseExpandIconScope) =>
      h('span', { class: 'my-icon' }, 'ICON'),
    );
    const w = mount(Collapse, {
      props: { items: ITEMS, defaultActiveKey: '1' },
      slots: { expandIcon },
    });
    expect(expandIcon).toHaveBeenCalledWith({
      key: '1',
      isActive: true,
      prefixCls: 'apollo-collapse',
      collapsible: undefined,
      direction: 'ltr',
    });
    expect(w.get('.apollo-collapse-arrow .my-icon').text()).toBe('ICON');
  });
  it('legacy destroy/placement aliases warn and still work', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const w = makeCollapse({
      destroyInactivePanel: true,
      expandIconPosition: 'end',
      defaultActiveKey: '1',
    });
    expect(error).toHaveBeenCalled();
    expect(w.classes()).toContain('apollo-collapse-icon-placement-end');
    await w.get('button').trigger('click');
    await vi.waitFor(() => expect(w.find('.apollo-collapse-body').exists()).toBe(false));
    error.mockRestore();
  });
  it('forwards ordinary aria, data and role to the root', () => {
    const w = mount(Collapse, {
      props: { items: ITEMS },
      attrs: { 'data-x': '1', 'aria-label': 'faq', role: 'group' },
    });
    expect(w.attributes()).toMatchObject({ 'data-x': '1', 'aria-label': 'faq', role: 'group' });
  });
  it('exposes the actual root element', () => {
    const reference = ref<CollapseRef | null>(null);
    const w = mount(
      defineComponent({ setup: () => () => h(Collapse, { ref: reference, items: ITEMS }) }),
    );
    expect(reference.value?.nativeElement).toBe(w.element);
  });
  it('maps local sizes to root and Panel classes', () => {
    expect(makeCollapse({ size: 'small' }).get('.apollo-collapse-item').classes()).toContain(
      'apollo-collapse-item-small',
    );
    expect(makeCollapse({ size: 'large' }).classes()).toContain('apollo-collapse-large');
  });
  it('v-model writes one string-array value and emits one change', async () => {
    const onChange = vi.fn(),
      activeKey = ref<(string | number)[]>([]);
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(Collapse, {
            items: ITEMS,
            activeKey: activeKey.value,
            'onUpdate:activeKey': (value) => {
              activeKey.value = value;
            },
            onChange,
          }),
      }),
    );
    await w.get('button').trigger('click');
    expect(activeKey.value).toEqual(['1']);
    expect(onChange).toHaveBeenCalledExactlyOnceWith(['1']);
    expect(w.get('button').attributes('aria-expanded')).toBe('true');
  });
});
