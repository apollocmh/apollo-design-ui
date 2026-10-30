/**
 * L3 · 类型测试（含负例）
 *
 * ⚠️ `*.test-d.ts` 会被 vitest **真的执行**：负例必须包在**永不调用的闭包**里，
 *    否则运行时崩溃（TESTING.md / PITFALLS 74）。
 *
 * ── 本文件钉的六类判据 ───────────────────────────────────────────────────────
 *
 * 1. 内容使用具名槽；tabChange 与 update:activeTabKey 是所属事件。
 * 2. **`ref` 的形状**：`{ nativeElement: HTMLDivElement | null }` —— 是**对象**，
 *    不是 DOM 本身（上游 `Card` 是 `forwardRef<HTMLDivElement>`，本仓统一成对象）。
 * 3. **`CardSize` 含 `'default'`**（上游已废弃但**未移除**，`COMPONENT-RULES.md` §4）。
 * 4. **`tabList` 的两个通道**：`tab`（deprecated）与 `label` **都存在**。
 * 5. **语义化**：`Card` **7 槽** / `CardMeta` **5 槽**，且都支持**函数形态**。
 * 6. **复合组件**：`Card.Grid` / `Card.Meta` 在**类型层**可见（`Object.assign` 的
 *    交叉类型），且三个组件都带 `install`。
 */

import { describe, expectTypeOf, it } from 'vitest';
import { h, type VNodeChild } from 'vue';
import type { SizeType } from '../../config-provider/size-context';
import type { TabsExtraContent, TabsProps } from '../../tabs/interface';
import { Card, CardGrid, CardMeta } from '../index';
import type {
  CardConfig,
  CardEmits,
  CardGridProps,
  CardGridRef,
  CardGridSlots,
  CardMetaProps,
  CardMetaRef,
  CardMetaSemanticClassNames,
  CardMetaSemanticStyles,
  CardMetaSemanticValue,
  CardMetaSlots,
  CardProps,
  CardRef,
  CardSemanticClassNames,
  CardSemanticStyles,
  CardSemanticValue,
  CardSize,
  CardSlots,
  CardTabListType,
  CardType,
} from '../interface';

describe('Card · Props 类型', () => {
  it('核心 props 的形态', () => {
    expectTypeOf<CardProps['prefixCls']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<CardProps['title']>().toEqualTypeOf<VNodeChild>();
    expectTypeOf<CardProps['extra']>().toEqualTypeOf<VNodeChild>();
    expectTypeOf<CardProps['loading']>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<CardProps['hoverable']>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<CardProps['id']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<CardProps['cover']>().toEqualTypeOf<VNodeChild>();
    expectTypeOf<CardProps['actions']>().toEqualTypeOf<VNodeChild[] | undefined>();
    expectTypeOf<CardProps['variant']>().toEqualTypeOf<'borderless' | 'outlined' | undefined>();
  });

  it('根 `class` / `style` 是 Vue 原生 attrs，不重复声明为 Props', () => {
    type CardPublic = InstanceType<typeof Card>['$props'];
    type GridPublic = InstanceType<typeof CardGrid>['$props'];
    type MetaPublic = InstanceType<typeof CardMeta>['$props'];

    const nativeAttrs: CardPublic = { class: ['c', { active: true }], style: { color: 'red' } };
    expectTypeOf(nativeAttrs).toMatchTypeOf<CardPublic>();
    expectTypeOf<{ class: string }>().toMatchTypeOf<GridPublic>();
    expectTypeOf<{ class: string }>().toMatchTypeOf<MetaPublic>();

    const _never = () => {
      // @ts-expect-error `className` 由 Vue 原生 `class` 取代
      const badCardClassName: CardProps = { className: 'legacy' };
      // @ts-expect-error `rootClassName` 不是 Card 的 prop
      const badCardRoot: CardProps = { rootClassName: 'legacy' };
      // @ts-expect-error 原生 `style` 不是 CardProps
      const badCardStyle: CardProps = { style: { color: 'red' } };
      // @ts-expect-error CardGridProps 不再声明 className
      const badGrid: CardGridProps = { className: 'legacy' };
      // @ts-expect-error CardMetaProps 不再声明 style
      const badMeta: CardMetaProps = { style: { color: 'red' } };
      return [badCardClassName, badCardRoot, badCardStyle, badGrid, badMeta];
    };
    void _never;
  });

  it("🚨 `CardSize` 含 `'default'`（已废弃但**未移除**）+ 排除 `'large'`", () => {
    expectTypeOf<CardSize>().toEqualTypeOf<Exclude<SizeType, 'large'> | 'default'>();
    expectTypeOf<CardType>().toEqualTypeOf<'inner'>();
  });

  it('tabList 的**两个**通道都存在（`tab` deprecated / `label`）', () => {
    expectTypeOf<CardTabListType['key']>().toEqualTypeOf<string>();
    expectTypeOf<CardTabListType['tab']>().toEqualTypeOf<VNodeChild>();
    expectTypeOf<CardTabListType['label']>().toEqualTypeOf<VNodeChild>();
    expectTypeOf<CardProps['tabList']>().toEqualTypeOf<CardTabListType[] | undefined>();
  });

  it('页签相关：受控/非受控两个键 + `tabProps` + `tabBarExtraContent`', () => {
    expectTypeOf<CardProps['activeTabKey']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<CardProps['defaultActiveTabKey']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<CardProps['tabProps']>().toEqualTypeOf<TabsProps | undefined>();
    expectTypeOf<CardProps['tabBarExtraContent']>().toEqualTypeOf<TabsExtraContent | undefined>();
  });

  it('JSX listener 使用所属事件的 string 载荷', () => {
    expectTypeOf<NonNullable<CardProps['onTabChange']>>().parameters.toEqualTypeOf<[key: string]>();
    expectTypeOf<NonNullable<CardProps['onTabChange']>>().returns.toEqualTypeOf<void>();
    expectTypeOf<CardEmits['tabChange']>().toEqualTypeOf<[key: string]>();
    expectTypeOf<CardEmits['update:activeTabKey']>().toEqualTypeOf<[key: string]>();
  });

  it('real constructors, named slots and emits share the public contract', () => {
    expectTypeOf<keyof CardSlots>().toEqualTypeOf<
      'default' | 'title' | 'extra' | 'cover' | 'actions'
    >();
    expectTypeOf<keyof CardGridSlots>().toEqualTypeOf<'default'>();
    expectTypeOf<keyof CardMetaSlots>().toEqualTypeOf<
      'default' | 'avatar' | 'title' | 'description'
    >();
    const check = (
      card: InstanceType<typeof Card>,
      grid: InstanceType<typeof CardGrid>,
      meta: InstanceType<typeof CardMeta>,
    ) => {
      h(Card, {
        activeTabKey: 'a',
        tabList: [{ key: 'a', label: h('strong', 'Alpha') }],
        onTabChange: (key: string) => void key,
        'onUpdate:activeTabKey': (key: string) => void key,
      });
      h(CardGrid, { hoverable: false });
      h(CardMeta, { description: 0 });
      card.$emit('tabChange', 'a');
      card.$emit('update:activeTabKey', 'b');
      card.$slots.actions?.();
      grid.$slots.default?.();
      meta.$slots.description?.();
      meta.$slots.default?.();
      expectTypeOf(card.nativeElement).toEqualTypeOf<HTMLDivElement | null>();
      expectTypeOf(grid.nativeElement).toEqualTypeOf<HTMLDivElement | null>();
      expectTypeOf(meta.nativeElement).toEqualTypeOf<HTMLDivElement | null>();
      // @ts-expect-error Card model proposals carry the key, not a DOM event.
      card.$emit('update:activeTabKey', new Event('change'));
      // @ts-expect-error The actual constructor listener expects a string key.
      h(Card, { onTabChange: (_event: Event) => {} });
      // @ts-expect-error Card does not own a generic change event.
      card.$emit('change', 'a');
    };
    void check;
  });
});

describe('Card · 语义化类型', () => {
  it('`Card` 是 **7 槽**，`CardMeta` 是 **5 槽**', () => {
    expectTypeOf<keyof CardSemanticClassNames>().toEqualTypeOf<
      'root' | 'header' | 'body' | 'extra' | 'title' | 'actions' | 'cover'
    >();
    expectTypeOf<keyof CardSemanticStyles>().toEqualTypeOf<
      'root' | 'header' | 'body' | 'extra' | 'title' | 'actions' | 'cover'
    >();
    expectTypeOf<keyof CardMetaSemanticClassNames>().toEqualTypeOf<
      'root' | 'section' | 'avatar' | 'title' | 'description'
    >();
    expectTypeOf<keyof CardMetaSemanticStyles>().toEqualTypeOf<
      'root' | 'section' | 'avatar' | 'title' | 'description'
    >();
  });

  it('支持**函数形态**（`GenerateSemantic` 的 `classNamesAndFn`）', () => {
    expectTypeOf<CardSemanticValue<CardSemanticClassNames>>().toEqualTypeOf<
      CardSemanticClassNames | ((info: { props: CardProps }) => CardSemanticClassNames)
    >();
    expectTypeOf<CardProps['classNames']>().toEqualTypeOf<
      CardSemanticValue<CardSemanticClassNames> | undefined
    >();
    expectTypeOf<CardMetaProps['styles']>().toEqualTypeOf<
      CardMetaSemanticValue<CardMetaSemanticStyles> | undefined
    >();
  });
});

describe('Card · ref / 子组件 / 可安装', () => {
  it('`CardRef` 是**对象**（`{ nativeElement }`），不是 DOM 本身', () => {
    expectTypeOf<CardRef>().toEqualTypeOf<{ nativeElement: HTMLDivElement | null }>();
    expectTypeOf<CardGridRef>().toEqualTypeOf<{ nativeElement: HTMLDivElement | null }>();
    expectTypeOf<CardMetaRef>().toEqualTypeOf<{ nativeElement: HTMLDivElement | null }>();
  });

  it('🚨 `Card.Grid` / `Card.Meta` 在**类型层**可见（`Object.assign` 的交叉类型）', () => {
    expectTypeOf<typeof Card>().toHaveProperty('Grid');
    expectTypeOf<typeof Card>().toHaveProperty('Meta');
    expectTypeOf<typeof Card.Grid>().toHaveProperty('install');
    expectTypeOf<typeof Card.Meta>().toHaveProperty('install');
  });

  it('三个组件都带 `install`（`withInstall` 的产物）', () => {
    expectTypeOf<typeof CardGrid>().toHaveProperty('install');
    expectTypeOf<typeof CardMeta>().toHaveProperty('install');
    expectTypeOf<typeof Card>().toHaveProperty('install');
  });

  it('`CardGridProps` / `CardMetaProps` 的形态', () => {
    expectTypeOf<CardGridProps['hoverable']>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<CardGridProps['prefixCls']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<CardMetaProps['avatar']>().toEqualTypeOf<VNodeChild>();
    expectTypeOf<CardMetaProps['title']>().toEqualTypeOf<VNodeChild>();
    expectTypeOf<CardMetaProps['description']>().toEqualTypeOf<VNodeChild>();
  });

  it('ConfigProvider 的配置键是 `card` / `cardMeta` 两个', () => {
    expectTypeOf<CardConfig>().toHaveProperty('classNames');
    expectTypeOf<CardConfig>().toHaveProperty('className');
  });
});

describe('Card · 负例（永不调用的闭包内）', () => {
  it('非法的 size / type / variant / children 必须被拒绝', () => {
    const _never = () => {
      // @ts-expect-error `children` 不是 prop（Vue 侧是默认插槽，规则 C19）
      const badChildren: CardProps = { children: 'x' };
      // @ts-expect-error `CardSize` 不含 `'large'`（上游 `Exclude<SizeType, 'large'>`）
      const badSize: CardProps = { size: 'large' };
      // @ts-expect-error `type` 只有 `'inner'`
      const badType: CardProps = { type: 'outer' };
      // @ts-expect-error `variant` 只有 `'borderless' | 'outlined'`
      const badVariant: CardProps = { variant: 'filled' };
      return [badChildren, badSize, badType, badVariant];
    };
    void _never;
  });

  it('`onTabChange` / `actions` 的载荷类型必须被拒绝', () => {
    const _never = () => {
      // @ts-expect-error `onTabChange` 只收一个 `string`
      const badHandler: CardProps = { onTabChange: (key: number) => void key };
      // @ts-expect-error `actions` 必须是数组
      const badActions: CardProps = { actions: 'nope' };
      return [badHandler, badActions];
    };
    void _never;
  });
});
