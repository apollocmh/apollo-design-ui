/**
 * L3 类型（G7）—— 正例 + 负例（负例包在永不调用的闭包里，CHECKLIST §一）。
 */
import { describe, expectTypeOf, it } from 'vitest';
import { type CSSProperties, h } from 'vue';
import {
  Menu,
  type MenuDivider,
  type MenuItem,
  type MenuItemGroup,
  type MenuSubMenu,
} from '../index';
import type {
  ItemType,
  MenuEmits,
  MenuItemSlots,
  MenuMode,
  MenuProps,
  MenuRef,
  MenuSlots,
  MenuSubMenuSlots,
} from '../interface';

describe('Menu · 类型', () => {
  it('mode 是 3 值联合', () => {
    expectTypeOf<MenuMode>().toEqualTypeOf<'horizontal' | 'vertical' | 'inline'>();
  });

  it('正例：合法 prop 与 items 组合', () => {
    const sample: Pick<MenuProps, 'items' | 'mode' | 'theme' | 'selectable'> = {
      items: [
        { key: '1', label: 'a' },
        { key: 'sub', label: 's', children: [{ key: '2', label: 'b' }] },
        { type: 'divider' },
        { type: 'group', label: 'g', children: [{ key: '3', label: 'c' }] },
      ],
      mode: 'inline',
      theme: 'dark',
      selectable: false,
    };
    expectTypeOf(sample).not.toBeNever();
    const items: NonNullable<MenuProps['items']> = sample.items ?? [];
    void items;
  });

  it('负例（永不调用的闭包）', () => {
    const negative = () => {
      const props: MenuProps = {
        // @ts-expect-error mode 不接受任意字符串
        mode: 'diagonal',
        // @ts-expect-error theme 不接受 'blue'
        theme: 'blue',
      };
      return props;
    };
    void negative;
  });
});

it('owns typed models, notifications, native keys, exact static constructors and scoped slots', () => {
  const css: CSSProperties = { color: undefined, '--owned-menu': '#123', marginInlineStart: 8 };
  const props: MenuProps = {
    items: [
      {
        type: 'submenu',
        key: 'empty',
        children: [],
        popupStyle: css,
        expandIcon: ({ isOpen }) => h('i', String(isOpen)),
      },
    ],
    'onUpdate:selectedKeys': (_keys: string[]) => {},
    'onUpdate:openKeys': (_keys: string[]) => {},
    onClick: (info) => {
      void info.itemData;
    },
    onKeydown: (event) => event.preventDefault(),
    styles: {
      root: css,
      item: css,
      itemTitle: css,
      itemIcon: css,
      itemContent: css,
      list: css,
      popup: { root: css },
      subMenu: { item: css, list: css },
    },
    tooltip: { styles: { container: css } },
  };
  const slots: MenuSlots = {
    expandIcon: ({ isOpen, disabled }) => [h('b', String(isOpen)), disabled ? null : h('i', 'I')],
  };
  h(Menu, props, slots);
  const itemSlots: MenuItemSlots = {
    default: () => [h('span', 'Text'), 0],
    icon: ({ isSelected }) => h('i', String(isSelected)),
    extra: () => [],
  };
  const subSlots: MenuSubMenuSlots = {
    title: () => [h('b', 'Title'), h('i', 'Suffix')],
    expandIcon: () => [],
  };
  h(Menu.Item, {}, itemSlots);
  h(Menu.SubMenu, { eventKey: 'sub', popupOffset: [1, 2] }, subSlots);
  h(Menu.Divider, { dashed: true });
  h(Menu.ItemGroup, {}, { title: () => [] });
  expectTypeOf(Menu.Item).toEqualTypeOf<typeof MenuItem>();
  expectTypeOf(Menu.SubMenu).toEqualTypeOf<typeof MenuSubMenu>();
  expectTypeOf(Menu.Divider).toEqualTypeOf<typeof MenuDivider>();
  expectTypeOf(Menu.ItemGroup).toEqualTypeOf<typeof MenuItemGroup>();
  expectTypeOf<MenuRef['list']>().toEqualTypeOf<HTMLUListElement | null>();
  expectTypeOf<Parameters<MenuEmits['openChange']>>().toEqualTypeOf<[keys: string[]]>();
  const negative = () => {
    const old: MenuProps = {
      // @ts-expect-error Native keyboard listeners use Vue onKeydown.
      onKeyDown: () => {},
    };
    const renderer: MenuProps = {
      // @ts-expect-error Top-level expand icon rendering uses #expandIcon.
      expandIcon: () => h('i'),
    };
    const children: MenuProps = {
      // @ts-expect-error Menu uses items data; children was never a rendering channel.
      children: h('li'),
    };
    const bad: ItemType = {
      key: 'bad',
      type: 'submenu',
      children: [],
      popupStyle: {
        // @ts-expect-error Popup styles retain real CSS property value types.
        position: 'floating',
      },
    };
    // @ts-expect-error Popup offsets contain exactly two numeric coordinates.
    h(Menu.SubMenu, { popupOffset: [1] });
    return [old, renderer, children, bad];
  };
  void negative;
});
