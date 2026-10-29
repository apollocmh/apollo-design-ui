import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type Component, defineComponent, h, nextTick, ref, shallowRef, type VNode } from 'vue';
import {
  Affix,
  App,
  BackTop,
  BorderBeam,
  Card,
  CardMeta,
  Cascader,
  Checkbox,
  CheckboxGroup,
  Drawer,
  Dropdown,
  List,
  Radio,
  RadioGroup,
  Select,
  Switch,
  Table,
  Tabs,
  Transfer,
  Tree,
  TreeSelect,
  Watermark,
} from '../../index';
import useMessage from '../../message/useMessage';
import useNotification from '../../notification/useNotification';
import BaseSelect from '../../select/engine/BaseSelect';
import { ConfigProvider } from '../ConfigProvider';
import type { ComponentConfigLike, RenderEmptyHandler } from '../interface';

const wrappers: Array<{ unmount(): void }> = [];
afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount();
  document.body.replaceChildren();
});
function render(content: () => VNode) {
  const wrapper = mount(defineComponent({ setup: () => content }), {
    attachTo: document.body,
    global: { stubs: { teleport: false } },
  });
  wrappers.push(wrapper);
  return wrapper;
}
async function settle() {
  await nextTick();
  await nextTick();
}
type Case = { name: string; component: Component; props: Record<string, unknown> };

describe('ConfigProvider current configuration at existing consumers', () => {
  const cases: Case[] = [
    { name: 'app', component: App, props: {} },
    { name: 'drawer', component: Drawer, props: { open: true, autoFocus: false } },
    {
      name: 'dropdown',
      component: Dropdown,
      props: { open: true, menu: { items: [{ key: 'a', label: 'Menu item' }] } },
    },
    {
      name: 'table',
      component: Table,
      props: {
        columns: [{ title: 'Name', dataIndex: 'name' }],
        dataSource: [{ key: 'a', name: 'One' }],
        pagination: false,
      },
    },
    {
      name: 'tabs',
      component: Tabs,
      props: { items: [{ key: 'a', label: 'Tab A', children: 'Panel A' }] },
    },
  ];
  it.each(cases)('$name reads the current global prefix', async ({ name, component, props }) => {
    const prefix = ref('first');
    render(() =>
      h(ConfigProvider, { prefixCls: prefix.value }, () =>
        h(component, props, () => h('button', { type: 'button' }, 'Slot')),
      ),
    );
    await settle();
    expect(document.querySelector(`.first-${name}`)).not.toBeNull();
    prefix.value = 'second';
    await settle();
    await vi.waitFor(() => expect(document.querySelector(`.second-${name}`)).not.toBeNull());
    expect(document.querySelector(`.first-${name}`)).toBeNull();
  });

  const styled: Case[] = [
    { name: 'affix', component: Affix, props: {} },
    { name: 'borderBeam', component: BorderBeam, props: {} },
    { name: 'card', component: Card, props: { title: 'Title' } },
    { name: 'cardMeta', component: CardMeta, props: { title: 'Title' } },
    {
      name: 'watermark',
      component: Watermark,
      props: {
        image: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>',
      },
    },
  ];
  it.each(styled)(
    '$name reads current component class and style defaults',
    async ({ name, component, props }) => {
      const components = ref<Record<string, ComponentConfigLike>>({
        [name]: { className: 'first-config', style: { color: 'rgb(1, 2, 3)' } },
      });
      const wrapper = render(() =>
        h(ConfigProvider, { components: components.value }, () =>
          h(component, props, () => h('button', { type: 'button' }, 'Slot')),
        ),
      );
      await settle();
      expect(wrapper.find('.first-config').exists()).toBe(true);
      components.value = {
        [name]: { className: 'second-config', style: { color: 'rgb(4, 5, 6)' } },
      };
      await settle();
      expect(wrapper.find('.second-config').exists()).toBe(true);
      expect(wrapper.get('.second-config').attributes('style')).toContain('rgb(4, 5, 6)');
      components.value = {};
      await settle();
      expect(wrapper.find('.second-config').exists()).toBe(false);
    },
  );

  const directional: Case[] = [
    { name: 'app', component: App, props: {} },
    { name: 'back-top', component: BackTop, props: { visibilityHeight: 0 } },
    { name: 'checkbox', component: Checkbox, props: {} },
    { name: 'checkbox-group', component: CheckboxGroup, props: { options: ['One'] } },
    { name: 'radio', component: Radio, props: {} },
    { name: 'radio-group', component: RadioGroup, props: { options: ['One'] } },
    { name: 'switch', component: Switch, props: {} },
  ];
  it.each(directional)(
    '$name follows direction changes and withdrawal',
    async ({ name, component, props }) => {
      const direction = ref<'ltr' | 'rtl' | undefined>('ltr');
      const wrapper = render(() =>
        h(ConfigProvider, { direction: direction.value }, () =>
          h(component, props, () => h('span', 'Label')),
        ),
      );
      direction.value = 'rtl';
      await settle();
      expect(wrapper.find(`[class*="${name}"][class*="-rtl"]`).exists()).toBe(true);
      direction.value = undefined;
      await settle();
      expect(wrapper.find(`[class*="${name}"][class*="-rtl"]`).exists()).toBe(false);
    },
  );

  it.each([Select, TreeSelect])(
    'select-like motion uses the current root prefix',
    async (component) => {
      const prefix = ref('first');
      const wrapper = render(() =>
        h(ConfigProvider, { prefixCls: prefix.value }, () => h(component)),
      );
      expect(wrapper.findComponent(BaseSelect).props('transitionName')).toBe('first-slide-up');
      prefix.value = 'second';
      await settle();
      expect(wrapper.findComponent(BaseSelect).props('transitionName')).toBe('second-slide-up');
    },
  );

  it('Dropdown uses and moves to the current global popup container', async () => {
    const first = document.createElement('section');
    const second = document.createElement('section');
    document.body.append(first, second);
    const target = shallowRef(first);
    render(() =>
      h(ConfigProvider, { getPopupContainer: () => target.value }, () =>
        h(Dropdown, { open: true, menu: { items: [{ key: 'a', label: 'Item A' }] } }, () =>
          h('button', { type: 'button' }, 'Menu'),
        ),
      ),
    );
    await settle();
    expect(first.querySelector('.apollo-dropdown')).not.toBeNull();
    target.value = second;
    await settle();
    expect(first.querySelector('.apollo-dropdown')).toBeNull();
    expect(second.querySelector('.apollo-dropdown')).not.toBeNull();
  });

  it('TreeSelect inherits global virtual and popup-width flags with explicit local overrides', async () => {
    const virtual = ref(true);
    const match = ref(true);
    const own = ref<boolean>();
    const wrapper = render(() =>
      h(ConfigProvider, { virtual: virtual.value, popupMatchSelectWidth: match.value }, () =>
        h(TreeSelect, {
          open: true,
          virtual: own.value,
          popupMatchSelectWidth: own.value,
          treeData: Array.from({ length: 40 }, (_, index) => ({
            value: String(index),
            title: `Node ${index}`,
          })),
        }),
      ),
    );
    await settle();
    expect(wrapper.findComponent(Tree).props('virtual')).toBe(true);
    virtual.value = false;
    await settle();
    expect(wrapper.findComponent(Tree).props('virtual')).toBe(false);
    virtual.value = true;
    match.value = false;
    await settle();
    expect(wrapper.findComponent(Tree).props('virtual')).toBe(false);
    own.value = true;
    await settle();
    expect(wrapper.findComponent(Tree).props('virtual')).toBe(true);
    own.value = undefined;
    await settle();
    expect(wrapper.findComponent(Tree).props('virtual')).toBe(false);
  });

  it('Cascader applies global popup width before its false default', async () => {
    const wrapper = render(() =>
      h(ConfigProvider, { popupMatchSelectWidth: true }, () =>
        h(Cascader, { open: true, options: [{ value: 'a', label: 'Alpha' }] }),
      ),
    );
    await settle();
    expect(wrapper.findComponent(BaseSelect).props('popupMatchSelectWidth')).toBe(true);
  });

  it('Table follows replacement of the global empty-state renderer', async () => {
    const renderer = shallowRef<RenderEmptyHandler>(() => 'First empty');
    const wrapper = render(() =>
      h(ConfigProvider, { renderEmpty: renderer.value }, () =>
        h(Table, { dataSource: [], columns: [], pagination: false }),
      ),
    );
    expect(wrapper.text()).toContain('First empty');
    renderer.value = () => 'Second empty';
    await settle();
    expect(wrapper.text()).toContain('Second empty');
  });

  it('Tabs reads current semantic configuration', async () => {
    const config = ref({
      classNames: { root: 'first-tabs-root' },
      styles: { root: { color: 'rgb(1, 2, 3)' } },
    });
    const wrapper = render(() =>
      h(ConfigProvider, { components: { tabs: config.value } }, () =>
        h(Tabs, { items: [{ key: 'a', label: 'Tab A', children: 'Panel A' }] }),
      ),
    );
    expect(wrapper.find('.first-tabs-root').exists()).toBe(true);
    config.value = {
      classNames: { root: 'second-tabs-root' },
      styles: { root: { color: 'rgb(4, 5, 6)' } },
    };
    await settle();
    expect(wrapper.find('.second-tabs-root').exists()).toBe(true);
    expect(wrapper.get('.second-tabs-root').attributes('style')).toContain('rgb(4, 5, 6)');
  });

  it('message and notification hooks use the current prefix for existing holders and new notices', async () => {
    const prefix = ref('first');
    const captured: {
      message?: ReturnType<typeof useMessage>[0];
      notification?: ReturnType<typeof useNotification>[0];
    } = {};
    const Probe = defineComponent({
      setup() {
        const [message, messageHolder] = useMessage();
        const [notification, notificationHolder] = useNotification();
        captured.message = message;
        captured.notification = notification;
        return () => h('section', [messageHolder(), notificationHolder()]);
      },
    });
    render(() => h(ConfigProvider, { prefixCls: prefix.value }, () => h(Probe)));
    await settle();
    if (!captured.message || !captured.notification)
      throw new Error('Expected both mounted service consumers');
    captured.message.open({ content: 'First message', duration: 0 });
    captured.notification.open({ title: 'First notification', duration: 0 });
    await settle();
    await vi.waitFor(() => {
      expect(document.querySelector('.first-message')).not.toBeNull();
      expect(document.querySelector('.first-notification')).not.toBeNull();
    });
    prefix.value = 'second';
    await settle();
    captured.message.open({ content: 'Second message', duration: 0 });
    captured.notification.open({ title: 'Second notification', duration: 0 });
    await settle();
    await vi.waitFor(() => {
      expect(document.querySelector('.second-message')).not.toBeNull();
      expect(document.querySelector('.second-notification')).not.toBeNull();
    });
  });
});

describe('Intentional empty global renderer results', () => {
  const cases: Case[] = [
    { name: 'Table', component: Table, props: { dataSource: [], columns: [], pagination: false } },
    { name: 'List', component: List, props: { dataSource: [] } },
    { name: 'Select', component: Select, props: { open: true, options: [] } },
    { name: 'TreeSelect', component: TreeSelect, props: { open: true, treeData: [] } },
    { name: 'Cascader', component: Cascader, props: { open: true, options: [] } },
    { name: 'Transfer', component: Transfer, props: { dataSource: [] } },
  ];
  it.each(cases)('$name preserves an intentional empty result', async ({ component, props }) => {
    render(() => h(ConfigProvider, { renderEmpty: () => null }, () => h(component, props)));
    await settle();
    expect(document.querySelector('.apollo-empty')).toBeNull();
  });
});

it('Tabs consumes current size, type, centered and class defaults with explicit prop priority', async () => {
  const tabs = ref({ size: 'small', type: 'card', centered: true, className: 'first-tabs' });
  const explicit = ref(false);
  const wrapper = render(() =>
    h(ConfigProvider, { components: { tabs: tabs.value } }, () =>
      h(Tabs, {
        items: [{ key: 'a', label: 'Tab A', children: 'Body' }],
        ...(explicit.value ? { size: 'middle', type: 'line', centered: false } : {}),
      }),
    ),
  );
  expect(
    wrapper.find('.apollo-tabs-small.apollo-tabs-card.apollo-tabs-centered.first-tabs').exists(),
  ).toBe(true);
  tabs.value = { size: 'large', type: 'editable-card', centered: false, className: 'second-tabs' };
  await settle();
  expect(wrapper.find('.apollo-tabs-large.apollo-tabs-editable-card.second-tabs').exists()).toBe(
    true,
  );
  expect(wrapper.find('.apollo-tabs-centered').exists()).toBe(false);
  explicit.value = true;
  await settle();
  expect(wrapper.find('.apollo-tabs-large').exists()).toBe(false);
  expect(wrapper.find('.apollo-tabs-card').exists()).toBe(false);
  expect(wrapper.find('.apollo-tabs-editable').exists()).toBe(false);
});
