import { CSSMotion } from '@apollo-design/motion';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import {
  defineComponent,
  Fragment,
  h,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
} from 'vue';
import { ConfigProvider } from '../../config-provider';
import { Collapse, type CollapseItemType, CollapsePanel } from '../index';

const items: CollapseItemType[] = [
  { key: 'a', label: 'Alpha', children: h('input', { value: 'Initial' }) },
  { key: 'b', label: 'Beta', children: 'Second' },
];
const expanded = (w: ReturnType<typeof mount>) =>
  w.findAll('.apollo-collapse-trigger').map((node) => node.attributes('aria-expanded'));

describe('Collapse complete source regressions', () => {
  it('mixed explicit and omitted Panel keys use the full initial Panel order', async () => {
    const w = mount(Collapse, {
      props: { defaultActiveKey: '1' },
      slots: {
        default: () => [
          h(CollapsePanel, { key: '0', header: 'Explicit' }),
          h(CollapsePanel, { header: 'Implicit' }),
        ],
      },
    });
    expect(expanded(w)).toEqual(['false', 'true']);
    await w.findAll('.apollo-collapse-trigger')[0]?.trigger('click');
    expect(expanded(w)).toEqual(['true', 'true']);
    await w.findAll('.apollo-collapse-trigger')[1]?.trigger('click');
    expect(expanded(w)).toEqual(['true', 'false']);
  });
  it('current Provider icon factories update and a present empty local icon slot takes priority', async () => {
    const factory = ref('First');
    const local = ref(false);
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            { components: { collapse: { expandIcon: () => h('b', factory.value) } } },
            () => h(Collapse, { items }, local.value ? { expandIcon: () => null } : {}),
          ),
      }),
    );
    expect(w.get('.apollo-collapse-arrow b').text()).toBe('First');
    factory.value = 'Current';
    await nextTick();
    expect(w.get('.apollo-collapse-arrow b').text()).toBe('Current');
    local.value = true;
    await nextTick();
    expect(w.find('.apollo-collapse-arrow b').exists()).toBe(false);
    expect(w.get('.apollo-collapse-trigger').attributes('aria-labelledby')).toBeTruthy();
  });
  it('externally closing an editor with a disabled trigger moves focus to its owning root', async () => {
    const key = ref<(string | number)[]>(['a']);
    const disabled = ref(false);
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(Collapse, {
            items,
            activeKey: key.value,
            collapsible: disabled.value ? 'disabled' : undefined,
          }),
      }),
      { attachTo: document.body },
    );
    w.get<HTMLInputElement>('input').element.focus();
    disabled.value = true;
    await nextTick();
    key.value = [];
    await nextTick();
    expect(document.activeElement).toBe(w.get('.apollo-collapse').element);
    expect(w.get('.apollo-collapse').attributes('tabindex')).toBe('-1');
    w.get<HTMLElement>('.apollo-collapse').element.blur();
    expect(w.get('.apollo-collapse').attributes('tabindex')).toBeUndefined();
  });
  it('copies default arrays once, while controlled array mutations stay reactive', async () => {
    const defaults = ref(['a']);
    const controlled = ref<(string | number)[] | undefined>(undefined);
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(Collapse, { items, defaultActiveKey: defaults.value, activeKey: controlled.value }),
      }),
    );
    defaults.value.push('b');
    await nextTick();
    expect(expanded(w)).toEqual(['true', 'false']);
    controlled.value = ['b'];
    await nextTick();
    expect(expanded(w)).toEqual(['false', 'true']);
    controlled.value.push('a');
    await nextTick();
    expect(expanded(w)).toEqual(['true', 'true']);
  });
  it('releases control to the last accepted value, never to a rejected request', async () => {
    const key = ref<(string | number)[] | undefined>(['a']);
    const w = mount(
      defineComponent({ setup: () => () => h(Collapse, { items, activeKey: key.value }) }),
    );
    await w.findAll('button')[1]?.trigger('click');
    key.value = undefined;
    await nextTick();
    expect(expanded(w)).toEqual(['true', 'false']);
    key.value = ['b'];
    await nextTick();
    key.value = undefined;
    await nextTick();
    expect(expanded(w)).toEqual(['false', 'true']);
  });
  it('preserves native input identity, draft and selection across a completed close', async () => {
    const w = mount(Collapse, { props: { items, defaultActiveKey: 'a' } });
    const input = w.get<HTMLInputElement>('input').element;
    input.value = 'Saved draft';
    input.setSelectionRange(2, 5);
    await w.get('button').trigger('click');
    await vi.waitFor(() => expect(w.get('[role=region]').attributes('hidden')).toBeDefined());
    await w.get('button').trigger('click');
    expect(w.get('input').element).toBe(input);
    expect(input.value).toBe('Saved draft');
    expect([input.selectionStart, input.selectionEnd]).toEqual([2, 5]);
  });
  it('forceRender wins destroy, then releasing force on a closed Panel removes content', async () => {
    const force = ref(true);
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(Collapse, { destroyOnHidden: true }, () =>
            h(CollapsePanel, { key: 'a', header: 'Alpha', forceRender: force.value }, () =>
              h('input'),
            ),
          ),
      }),
    );
    const input = w.get('input').element;
    await w.get('button').trigger('click');
    await w.get('button').trigger('click');
    await vi.waitFor(() => expect(w.get('[role=region]').attributes('hidden')).toBeDefined());
    expect(w.get('input').element).toBe(input);
    force.value = false;
    await nextTick();
    expect(w.find('input').exists()).toBe(false);
    await w.get('button').trigger('click');
    expect(w.get('input').element).not.toBe(input);
  });
  it('item destroy overrides root, and unopened bodies are lazy', async () => {
    const first = items[0];
    const second = items[1];
    if (!first || !second) throw new Error('The fixture requires two distinct panels');
    const w = mount(Collapse, {
      props: {
        destroyOnHidden: true,
        defaultActiveKey: 'a',
        items: [{ ...first, key: 'a', destroyOnHidden: false }, second],
      },
    });
    expect(w.findAll('.apollo-collapse-body')).toHaveLength(1);
    const input = w.get('input').element;
    await w.get('button').trigger('click');
    expect(w.get('input').element).toBe(input);
  });
  it('actual Panels run lifecycle hooks and Vue once event listeners', async () => {
    const mounted = vi.fn(),
      unmounted = vi.fn(),
      once = vi.fn(),
      native = vi.fn(),
      vnodeMounted = vi.fn();
    const visible = ref(true);
    const Content = defineComponent({
      setup() {
        onMounted(mounted);
        onUnmounted(unmounted);
        return () => h('input');
      },
    });
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(Collapse, { defaultActiveKey: 'a' }, () =>
            visible.value
              ? h(
                  CollapsePanel,
                  {
                    key: 'a',
                    header: 'Alpha',
                    onItemClickOnce: once,
                    onClick: native,
                    onVnodeMounted: vnodeMounted,
                  },
                  () => h(Content),
                )
              : null,
          ),
      }),
    );
    expect(mounted).toHaveBeenCalledTimes(1);
    expect(vnodeMounted).toHaveBeenCalledTimes(1);
    await w.get('button').trigger('click');
    await w.get('button').trigger('click');
    expect(once).toHaveBeenCalledExactlyOnceWith('a');
    expect(native).toHaveBeenCalledTimes(2);
    visible.value = false;
    await nextTick();
    expect(unmounted).toHaveBeenCalledTimes(1);
  });
  it('retains keyed Panels and their editors when the actual Vue tree is reordered', async () => {
    const order = ref(['a', 'b']);
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(Collapse, { defaultActiveKey: ['a', 'b'] }, () =>
            h(
              Fragment,
              {},
              order.value.map((key) =>
                h(CollapsePanel, { key, header: key }, () => h('input', { 'data-key': key })),
              ),
            ),
          ),
      }),
    );
    const input = w.get<HTMLInputElement>('input[data-key=a]').element;
    input.value = 'Draft';
    order.value = ['b', 'a', 'c'];
    await nextTick();
    expect(w.get('input[data-key=a]').element).toBe(input);
    expect(input.value).toBe('Draft');
    expect(w.findAll('.apollo-collapse-title').map((n) => n.text())).toEqual(['b', 'a', 'c']);
  });
  it('preserves items (including empty arrays) priority over the default slot', async () => {
    const list = shallowRef<CollapseItemType[] | undefined>([]);
    const render = vi.fn(() => h(CollapsePanel, { key: 's', header: 'Slot' }));
    const w = mount(
      defineComponent({
        setup: () => () => h(Collapse, { items: list.value }, { default: render }),
      }),
    );
    expect(w.find('button').exists()).toBe(false);
    expect(render).not.toHaveBeenCalled();
    list.value = items;
    await nextTick();
    expect(w.findAll('button')).toHaveLength(2);
    list.value = undefined;
    await nextTick();
    expect(w.get('.apollo-collapse-title').text()).toBe('Slot');
  });
  it('header slot presence wins text/label including empty output; VNode labels work', async () => {
    const slot = ref(true);
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(Collapse, {}, () => [
            h(
              CollapsePanel,
              { key: 'a', header: 'Text', label: h('em', 'Label') },
              slot.value ? { header: () => null } : {},
            ),
            h(CollapsePanel, { key: 'b', label: h('em', 'Data label') }),
          ]),
      }),
    );
    expect(w.findAll('.apollo-collapse-title')[0]?.text()).toBe('');
    expect(w.get('em').text()).toBe('Data label');
    slot.value = false;
    await nextTick();
    expect(w.findAll('.apollo-collapse-title')[0]?.text()).toBe('Text');
  });
  it('extra controls activate independently for click and keyboard events without stopping propagation', async () => {
    const action = vi.fn(),
      change = vi.fn();
    const w = mount(Collapse, {
      props: { onChange: change },
      slots: {
        default: () =>
          h(
            CollapsePanel,
            { key: 'a', header: 'Alpha' },
            { extra: () => h('button', { class: 'action', onClick: action }, 'Save') },
          ),
      },
    });
    expect(w.get('.action').element.closest('h3')).toBeNull();
    await w.get('.action').trigger('keydown', { key: 'Enter' });
    w.get('.action').element.dispatchEvent(new MouseEvent('click', { detail: 0, bubbles: true }));
    await nextTick();
    expect(action).toHaveBeenCalledTimes(1);
    expect(change).not.toHaveBeenCalled();
    expect(expanded(w)).toEqual(['false']);
  });
  it('empty extra has no host while numeric zero survives', async () => {
    const value = ref<null | number>(null);
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(Collapse, {}, () =>
            h(CollapsePanel, { header: 'Alpha' }, { extra: () => value.value }),
          ),
      }),
    );
    expect(w.find('.apollo-collapse-extra').exists()).toBe(false);
    value.value = 0;
    await nextTick();
    expect(w.get('.apollo-collapse-extra').text()).toBe('0');
  });
  it('zero and empty custom icons keep the icon-only control, full fragments survive', async () => {
    const value = ref(0);
    const w = mount(Collapse, {
      props: { items, collapsible: 'icon' },
      slots: {
        expandIcon: () =>
          value.value === 0 ? 0 : value.value === 1 ? null : [h('b', 'One'), h('i', 'Two')],
      },
    });
    expect(w.get('button').text()).toBe('0');
    await w.get('button').trigger('click');
    expect(expanded(w)[0]).toBe('true');
    value.value = 1;
    await nextTick();
    expect(w.get('button').attributes('aria-labelledby')).toBeTruthy();
    value.value = 2;
    await nextTick();
    expect(w.get('button b').text()).toBe('One');
    expect(w.get('button i').text()).toBe('Two');
  });
  it('icon-only without an arrow is explicitly disabled and warns', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onChange = vi.fn();
    const w = mount(Collapse, {
      props: {
        onChange,
        collapsible: 'icon',
        items: [{ key: 'a', label: 'Alpha', showArrow: false }],
      },
    });
    expect(w.get<HTMLButtonElement>('button').element.disabled).toBe(true);
    expect(error.mock.calls.flat().join(' ')).toContain('collapsible=icon requires showArrow');
    await w.get('button').trigger('click');
    expect(onChange).not.toHaveBeenCalled();
    error.mockRestore();
  });
  it('legacy disabled works and explicit collapsible takes precedence', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const w = mount(Collapse, {
      slots: {
        default: () => [
          h(CollapsePanel, { key: 'a', header: 'Alpha', disabled: true }),
          h(CollapsePanel, { key: 'b', header: 'Beta', disabled: true, collapsible: 'header' }),
        ],
      },
    });
    expect(w.findAll<HTMLButtonElement>('button').map((n) => n.element.disabled)).toEqual([
      true,
      false,
    ]);
    expect(error.mock.calls.flat().join(' ')).toContain('disabled');
    error.mockRestore();
  });
  it('Panel native attrs, legacy item aliases and root/body/header/title/icon semantics are all consumed', () => {
    const w = mount(Collapse, {
      props: {
        defaultActiveKey: 'a',
        classNames: { header: 'global-header', body: 'global-body' },
        styles: { body: { padding: '8px' } },
      },
      slots: {
        default: () =>
          h(
            CollapsePanel,
            {
              key: 'a',
              header: 'Alpha',
              id: 'panel-a',
              class: 'native',
              className: 'legacy',
              'data-panel': 'yes',
              tabindex: 4,
              style: [{ color: 'red' }, { '--panel-custom': '31px' }],
              classNames: {
                root: 'item-root',
                header: 'item-header',
                title: 'item-title',
                body: 'item-body',
                icon: 'item-icon',
              },
              styles: {
                root: { marginTop: '3px' },
                header: { gap: '2px' },
                title: { fontWeight: 700 },
                body: { padding: '17px' },
                icon: { color: 'blue' },
              },
            },
            () => h('input'),
          ),
      },
    });
    const panel = w.get<HTMLElement>('#panel-a');
    expect(panel.classes()).toEqual(expect.arrayContaining(['native', 'legacy', 'item-root']));
    expect(panel.attributes()).toMatchObject({ 'data-panel': 'yes', tabindex: '4' });
    expect(panel.element.style.color).toBe('red');
    expect(panel.element.style.marginTop).toBe('3px');
    expect(panel.element.style.getPropertyValue('--panel-custom')).toBe('31px');
    expect(w.get('.item-header').classes()).toContain('global-header');
    expect(w.get<HTMLElement>('.item-title').element.style.fontWeight).toBe('700');
    expect(w.get<HTMLElement>('.item-body').element.style.padding).toBe('17px');
    expect(w.get('.item-body').classes()).toContain('global-body');
    expect(w.get<HTMLElement>('.item-icon').element.style.color).toBe('blue');
  });
  it('item semantic fields and callbacks share the real Panel renderer', async () => {
    const click = vi.fn();
    const w = mount(Collapse, {
      props: {
        items: [
          {
            key: 'a',
            label: 'Alpha',
            children: 'Body',
            className: 'legacy',
            headerClass: 'old-header',
            id: 'data-panel',
            classNames: { root: 'item', body: 'body' },
            styles: { body: { padding: '23px' } },
            onItemClick: click,
          },
        ],
      },
    });
    expect(w.get('#data-panel').classes()).toEqual(expect.arrayContaining(['legacy', 'item']));
    expect(w.find('.old-header').exists()).toBe(true);
    await w.get('button').trigger('click');
    expect(w.get<HTMLElement>('.body').element.style.padding).toBe('23px');
    expect(click).toHaveBeenCalledExactlyOnceWith('a');
  });
  it('Provider object replacement/removal updates this same root and Panel', async () => {
    const classes = ref<{ root?: string; header?: string }>({ root: 'one', header: 'header-one' });
    const padding = ref('7px');
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            {
              components: {
                collapse: {
                  classNames: classes.value,
                  styles: { header: { padding: padding.value } },
                },
              },
            },
            () => h(Collapse, { items }),
          ),
      }),
    );
    const root = w.get('.apollo-collapse').element;
    classes.value = { root: 'two', header: 'header-two' };
    padding.value = '19px';
    await nextTick();
    expect(w.get('.two').element).toBe(root);
    expect(w.get<HTMLElement>('.header-two').element.style.padding).toBe('19px');
    classes.value = {};
    await nextTick();
    expect(w.find('.one,.two,.header-one,.header-two').exists()).toBe(false);
  });
  it('inherits current global size, direction and prefix while local size wins', async () => {
    const size = ref<'small' | 'large'>('small'),
      prefix = ref('first'),
      rtl = ref<'ltr' | 'rtl'>('ltr');
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            { componentSize: size.value, prefixCls: prefix.value, direction: rtl.value },
            () => [
              h(Collapse, { id: 'one', items }),
              h(Collapse, { id: 'two', items, size: 'middle' }),
            ],
          ),
      }),
    );
    const root = w.get('#one').element;
    expect(w.get('#one').classes()).toContain('first-collapse-small');
    size.value = 'large';
    prefix.value = 'second';
    rtl.value = 'rtl';
    await nextTick();
    expect(w.get('#one').element).toBe(root);
    expect(w.get('#one').classes()).toEqual(
      expect.arrayContaining(['second-collapse-large', 'second-collapse-rtl']),
    );
    expect(w.get('#two').classes()).not.toContain('second-collapse-large');
    expect(
      w
        .findAllComponents(CSSMotion)
        .every((m) => m.props('motionName') === 'second-collapse-motion'),
    ).toBe(true);
  });
  it('honors an existing Panel prefix and aliases its inherited component variables', () => {
    const w = mount(Collapse, {
      props: { prefixCls: 'host-collapse' },
      slots: { default: () => h(CollapsePanel, { header: 'Alpha', prefixCls: 'local-collapse' }) },
    });
    const panel = w.get<HTMLElement>('.local-collapse-item');
    expect(w.find('.local-collapse-trigger').exists()).toBe(true);
    expect(panel.element.style.getPropertyValue('--local-collapse-header-padding')).toBe(
      'var(--host-collapse-header-padding)',
    );
  });
  it('increments nested heading levels and keeps independent state and IDs across siblings', async () => {
    const w = mount(
      defineComponent({
        setup: () => () => [
          h(Collapse, { defaultActiveKey: 'outer', headingLevel: 4 }, () =>
            h(CollapsePanel, { key: 'outer', header: 'Outer' }, () => h(Collapse, { items })),
          ),
          h(Collapse, { items }),
        ],
      }),
    );
    expect(w.findAll('h4 > button')).toHaveLength(1);
    expect(w.findAll('h5 > button')).toHaveLength(2);
    expect(w.findAll('h3 > button')).toHaveLength(2);
    const buttons = w.findAll('button');
    expect(new Set(buttons.map((b) => b.attributes('id'))).size).toBe(5);
    await buttons[1]?.trigger('click');
    expect(buttons[0]?.attributes('aria-expanded')).toBe('true');
    expect(buttons[3]?.attributes('aria-expanded')).toBe('false');
    for (const button of buttons) {
      const id = button.attributes('aria-controls');
      expect(w.get(`#${id}`).attributes('aria-labelledby')).toBe(button.attributes('id'));
    }
  });
  it('closing an owned focused editor returns focus; outside focus remains outside', async () => {
    const key = ref<(string | number)[]>(['a']);
    const w = mount(
      defineComponent({
        setup: () => () =>
          h('div', [
            h('button', { id: 'outside' }, 'Outside'),
            h(Collapse, { items, activeKey: key.value }),
          ]),
      }),
      { attachTo: document.body },
    );
    w.get<HTMLInputElement>('input').element.focus();
    key.value = [];
    await nextTick();
    expect(document.activeElement).toBe(w.get('.apollo-collapse-trigger').element);
    key.value = ['a'];
    await nextTick();
    w.get<HTMLButtonElement>('#outside').element.focus();
    key.value = [];
    await nextTick();
    expect(document.activeElement).toBe(w.get('#outside').element);
  });
});
