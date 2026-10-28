/** Public Vue content, native attrs and menu data, with meaningful positive/negative cases. */

import { describe, expectTypeOf, it } from 'vitest';
import type { VNodeChild } from 'vue';
import { Breadcrumb, BreadcrumbItem, BreadcrumbSeparator, BreadcrumbWithSub } from '../index';
import type {
  BreadcrumbExpose,
  BreadcrumbItemInput,
  BreadcrumbItemMenu,
  BreadcrumbItemProps,
  BreadcrumbItemSlotProps,
  BreadcrumbItemSlots,
  BreadcrumbItemType,
  BreadcrumbKey,
  BreadcrumbMenuItem,
  BreadcrumbParams,
  BreadcrumbProps,
  BreadcrumbRef,
  BreadcrumbSemanticClassNames,
  BreadcrumbSemanticStyles,
  BreadcrumbSeparatorType,
  BreadcrumbSlots,
} from '../interface';

describe('Breadcrumb · Props 类型', () => {
  it('核心 props 的形态', () => {
    expectTypeOf<BreadcrumbProps['prefixCls']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<BreadcrumbProps['separator']>().toEqualTypeOf<VNodeChild>();
    expectTypeOf<BreadcrumbProps['dropdownIcon']>().toEqualTypeOf<VNodeChild>();
    expectTypeOf<BreadcrumbProps['items']>().toEqualTypeOf<BreadcrumbItemInput[] | undefined>();
    expectTypeOf<BreadcrumbProps['routes']>().toEqualTypeOf<BreadcrumbItemInput[] | undefined>();
    expectTypeOf<BreadcrumbProps['params']>().toEqualTypeOf<BreadcrumbParams | undefined>();
  });

  it('根 `class` / `style` 是 Vue 原生 attrs，不重复声明为 BreadcrumbProps', () => {
    type PublicProps = InstanceType<typeof Breadcrumb>['$props'];
    const nativeAttrs: PublicProps = {
      class: ['native-breadcrumb', { active: true }],
      style: { color: 'red' },
    };
    expectTypeOf(nativeAttrs).toMatchTypeOf<PublicProps>();

    const _never = () => {
      // @ts-expect-error `className` 由 Vue 原生 `class` 取代
      const badClassName: BreadcrumbProps = { className: 'legacy' };
      // @ts-expect-error `rootClassName` 不是 Breadcrumb 的 prop
      const badRootClassName: BreadcrumbProps = { rootClassName: 'legacy' };
      // @ts-expect-error 原生 `style` 不是 BreadcrumbProps
      const badStyle: BreadcrumbProps = { style: { color: 'red' } };
      return [badClassName, badRootClassName, badStyle];
    };
    void _never;
  });

  it('🚨 `params` 是 `Record<string, unknown>`（泛型 `<T>` 非泛型实例化的结果）', () => {
    expectTypeOf<BreadcrumbParams>().toEqualTypeOf<Record<string, unknown>>();
  });

  it('itemRender slot accepts one named object including resolved paths/href', () => {
    expectTypeOf<NonNullable<BreadcrumbSlots['itemRender']>>().parameters.toEqualTypeOf<
      [BreadcrumbItemSlotProps]
    >();
    expectTypeOf<NonNullable<BreadcrumbSlots['itemRender']>>().returns.toEqualTypeOf<VNodeChild>();
    expectTypeOf<BreadcrumbItemSlotProps['href']>().toEqualTypeOf<string | undefined>();
  });

  it('语义化槽是**三个**（root / item / separator），且都支持**函数形态**', () => {
    expectTypeOf<keyof BreadcrumbSemanticClassNames>().toEqualTypeOf<
      'root' | 'item' | 'separator'
    >();
    expectTypeOf<keyof BreadcrumbSemanticStyles>().toEqualTypeOf<'root' | 'item' | 'separator'>();
    // 函数形态：入参是 `{ props }`
    expectTypeOf<NonNullable<BreadcrumbProps['classNames']>>().toMatchTypeOf<
      | BreadcrumbSemanticClassNames
      | ((info: { props: BreadcrumbProps }) => BreadcrumbSemanticClassNames)
    >();
  });

  it('`BreadcrumbKey` 与上游的 `React.Key` 对应', () => {
    expectTypeOf<BreadcrumbKey>().toEqualTypeOf<string | number>();
  });
});

describe('Breadcrumb · 数据项类型', () => {
  it('`BreadcrumbItemInput` = `Partial<BreadcrumbItemType & BreadcrumbSeparatorType>`', () => {
    expectTypeOf<BreadcrumbItemInput>().toEqualTypeOf<
      Partial<BreadcrumbItemType & BreadcrumbSeparatorType>
    >();
    // `type` 只接受字面量 `'separator'`（可选）
    expectTypeOf<BreadcrumbItemInput['type']>().toEqualTypeOf<'separator' | undefined>();
  });

  it('🚨 `BreadcrumbItemType.children` 是**去掉 `children` 的自身数组**（`Omit`，不是递归）', () => {
    expectTypeOf<NonNullable<BreadcrumbItemType['children']>>().toEqualTypeOf<
      Omit<BreadcrumbItemType, 'children'>[]
    >();
    expectTypeOf<NonNullable<BreadcrumbItemType['children']>[number]>().not.toHaveProperty(
      'children',
    );
  });

  it('`menu` 的形状：`Omit<MenuProps, "items"> & { items?: BreadcrumbMenuItem[] }`', () => {
    expectTypeOf<BreadcrumbItemMenu>().toHaveProperty('items');
    expectTypeOf<NonNullable<BreadcrumbItemMenu['items']>>().toEqualTypeOf<BreadcrumbMenuItem[]>();
    expectTypeOf<BreadcrumbMenuItem['label']>().toEqualTypeOf<VNodeChild>();
    expectTypeOf<BreadcrumbMenuItem['path']>().toEqualTypeOf<string | undefined>();
  });

  it('`aria-*` / `data-*` 可透传（模板字面量索引签名）', () => {
    const item: BreadcrumbItemInput = {
      title: 'A',
      'aria-label': 'x',
      'aria-current': true,
      'data-testid': 'y',
    };
    expectTypeOf(item).toMatchTypeOf<BreadcrumbItemInput>();
  });

  it('`BreadcrumbItemProps`（废弃的 `Breadcrumb.Item`）带 `separator` 与 `menu`', () => {
    expectTypeOf<BreadcrumbItemProps['separator']>().toEqualTypeOf<VNodeChild>();
    expectTypeOf<BreadcrumbItemProps['href']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<BreadcrumbItemProps['menu']>().toEqualTypeOf<BreadcrumbItemMenu | undefined>();
  });
});

describe('Breadcrumb · 本组件「没有」的东西', () => {
  it('🚨 没有 `children` prop（Vue 侧是默认插槽，规则 C19）', () => {
    expectTypeOf<BreadcrumbProps>().not.toHaveProperty('children');
  });

  it('🚨 根上**没有任何组件事件**（`onChange` / `onClick` 都不是 `Breadcrumb` 的 prop）', () => {
    expectTypeOf<BreadcrumbProps>().not.toHaveProperty('onChange');
    expectTypeOf<BreadcrumbProps>().not.toHaveProperty('onClick');
    expectTypeOf<BreadcrumbProps>().not.toHaveProperty('onSelect');
  });

  it('🚨 `ref` 是 `{ nativeElement }`（**不是** DOM 本身），且可空', () => {
    expectTypeOf<BreadcrumbExpose>().toHaveProperty('nativeElement');
    expectTypeOf<BreadcrumbExpose['nativeElement']>().toEqualTypeOf<HTMLElement | null>();
    expectTypeOf<BreadcrumbRef>().toEqualTypeOf<BreadcrumbExpose>();
    // ⚠️ **不要**断言 `InstanceType<typeof Breadcrumb>` 上有 `nativeElement`：
    //    Vue 的 `expose` **不反映到组件实例的类型**（`InstanceType` 只给 `$xxx` 与 props）
    //    ⇒ 那条断言必然编译失败。运行时形状由 L1 的
    //    `expect((w.vm as {nativeElement}).nativeElement).toBe(w.element)` 钉住。
  });

  it('★ 三个组件都是可安装的（`withInstall` 的产物）', () => {
    expectTypeOf(Breadcrumb).toHaveProperty('install');
    expectTypeOf(BreadcrumbItem).toHaveProperty('install');
    expectTypeOf(BreadcrumbSeparator).toHaveProperty('install');
  });

  it('★ 复合组件挂了 `Item` / `Separator`', () => {
    expectTypeOf(BreadcrumbWithSub).toHaveProperty('Item');
    expectTypeOf(BreadcrumbWithSub).toHaveProperty('Separator');
  });
});

describe('Breadcrumb · 负例（永不调用的闭包内）', () => {
  it('非法的 `items` / `params` / `type` 必须被拒绝', () => {
    const _never = () => {
      // @ts-expect-error `items` 必须是数组
      const badItems: BreadcrumbProps = { items: 'nope' };
      // @ts-expect-error `params` 必须是对象
      const badParams: BreadcrumbProps = { params: 'nope' };
      // @ts-expect-error `type` 只接受字面量 `'separator'`
      const badType: BreadcrumbItemInput = { type: 'divider' };
      // @ts-expect-error `prefixCls` 是字符串
      const badPrefix: BreadcrumbProps = { prefixCls: 1 };
      return [badItems, badParams, badType, badPrefix];
    };
    void _never;
  });

  it('`itemRender` 的返回值必须是 `VNodeChild`', () => {
    const _never = () => {
      // @ts-expect-error 返回 `Symbol` 不是 `VNodeChild`
      const bad: BreadcrumbSlots = { itemRender: () => Symbol('x') };
      return bad;
    };
    void _never;
  });

  it('`BreadcrumbItemType.children` 的元素**不含** `children`（`Omit` 生效）', () => {
    const _never = () => {
      const bad: BreadcrumbItemType = {
        title: 'A',
        children: [
          // @ts-expect-error 子项不能有 `children`（只有一层）
          { title: 'B', children: [{ title: 'C' }] },
        ],
      };
      return bad;
    };
    void _never;
  });
});

const checkRemovedRenderer = () => {
  // @ts-expect-error ADR0006/0007: custom content uses native slots, not function props.
  const props: BreadcrumbProps = { itemRender: () => null };
  // @ts-expect-error The scoped slot accepts one named object, not positional callback arguments.
  const slot: BreadcrumbSlots['itemRender'] = (
    _route: BreadcrumbItemInput,
    _params: BreadcrumbParams,
  ) => null;
  void props;
  void slot;
};
void checkRemovedRenderer;

it('current content slots and native Item attrs have public types', () => {
  expectTypeOf<keyof BreadcrumbItemSlots>().toEqualTypeOf<
    'default' | 'separator' | 'dropdownIcon'
  >();
  expectTypeOf<BreadcrumbSlots>().toHaveProperty('separator');
  expectTypeOf<BreadcrumbSlots>().toHaveProperty('dropdownIcon');
  type ItemProps = InstanceType<typeof BreadcrumbItem>['$props'];
  const native: ItemProps = {
    class: ['native', { active: true }],
    style: ['color: red', { padding: '2px' }],
  };
  expectTypeOf(native).toMatchTypeOf<ItemProps>();
  const menuItem: BreadcrumbMenuItem = {
    key: 0,
    href: '#route',
    disabled: true,
    onClick: ({ domEvent, key }) => {
      void domEvent;
      void key;
    },
  };
  expectTypeOf(menuItem).toMatchTypeOf<BreadcrumbMenuItem>();
  const negative = () => {
    // @ts-expect-error Native root class replaces the old React-style Item prop.
    const badClass: BreadcrumbItemProps = { className: 'legacy' };
    // @ts-expect-error Native style is an attr; it is not a component-specific content prop.
    const badStyle: BreadcrumbItemProps = { style: { color: 'red' } };
    // @ts-expect-error Menu business clicks receive MenuInfo, not a DOM MouseEvent.
    const badMenu: BreadcrumbMenuItem = { onClick: (_event: MouseEvent) => {} };
    return [badClass, badStyle, badMenu];
  };
  void negative;
});
