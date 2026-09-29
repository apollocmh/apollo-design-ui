/**
 * L3 类型测试 —— 钉住 Tabs 的**对外契约形状**（G2 的 `interface.ts` 定稿）。
 *
 * 负例用 `@ts-expect-error`（`*.test-d.ts` 会被 vitest **真执行**，所以负例不能是「不编译的
 * 死代码」，而是「必然报错但被显式豁免」的赋值）。
 *
 * ── 覆盖面 ────────────────────────────────────────────────────────────────────
 *   - 值域：`type` / `size` / `tabPlacement` / `tabPosition` / `activeKey` / `items`
 *   - 联合：`indicator`（`{align, size}`）、`animated`（`boolean | TabsAnimatedConfig`）
 *   - `items` 的 `TabsItem`（`key` 必填 `string`、`label` 是 `VNodeChild`、
 *     `destroyInactiveTabPane` 的 deprecated 通道）
 *   - 语义槽 **8 平铺 + 1 嵌套**（`popup` 是 `{ root }`）
 *   - emits 的载荷：`update:activeKey`（`[string]`）、`change`（`[string]`）、
 *     `tabClick`（`[string, TabsEditEvent]`）、`edit`（`[TabsEditEvent | string, TabsEditAction]`）
 *   - 三个 scoped slot 的签名
 *   - `TabsRenderTabBarProps`（= rc 的 `RenderTabBarProps` 的 Vue 化）
 *   - `TabsRef.nativeElement`
 */

import { describe, expectTypeOf, it } from 'vitest';
import type { CSSProperties, VNodeChild } from 'vue';
import type {
  GetIndicatorSize,
  TabPlacement,
  TabPosition,
  TabsAnimatedConfig,
  TabsEditAction,
  TabsEditableConfig,
  TabsEditEvent,
  TabsEmits,
  TabsExtraContent,
  TabsIndicator,
  TabsItem,
  TabsLocale,
  TabsMorePopupInfo,
  TabsMoreProps,
  TabsProps,
  TabsRef,
  TabsRenderTabBarProps,
  TabsSemanticClassNames,
  TabsSemanticStyles,
  TabsSemanticValue,
  TabsSlots,
  TabsType,
} from '../interface';

describe('Tabs · L3 类型', () => {
  it('值域：type / size / placement 都是字面量联合', () => {
    expectTypeOf<TabsProps['type']>().toEqualTypeOf<TabsType | undefined>();
    expectTypeOf<TabsType>().toEqualTypeOf<'line' | 'card' | 'editable-card'>();
    expectTypeOf<TabsProps['size']>().toEqualTypeOf<'small' | 'default' | 'large' | undefined>();
    expectTypeOf<TabsProps['tabPlacement']>().toEqualTypeOf<TabPlacement | undefined>();
    expectTypeOf<TabPlacement>().toEqualTypeOf<'top' | 'end' | 'bottom' | 'start'>();
    // `tabPosition` 是**废弃**通道，值域不同（left/right 而非 start/end）
    expectTypeOf<TabPosition>().toEqualTypeOf<'top' | 'right' | 'bottom' | 'left'>();
  });

  it('键与受控面都是 string', () => {
    expectTypeOf<TabsProps['activeKey']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<TabsProps['defaultActiveKey']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<TabsProps['id']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<TabsItem['key']>().toEqualTypeOf<string>();
    expectTypeOf<TabsItem['label']>().toEqualTypeOf<VNodeChild>();
  });

  it('`indicator` / `animated` 的形状', () => {
    expectTypeOf<TabsProps['indicator']>().toEqualTypeOf<TabsIndicator | undefined>();
    expectTypeOf<TabsIndicator['align']>().toEqualTypeOf<'start' | 'center' | 'end' | undefined>();
    // `size` 是**三形态**：数字 / 按基准长度求值 / 缺省
    expectTypeOf<GetIndicatorSize>().toEqualTypeOf<number | ((origin: number) => number)>();
    expectTypeOf<TabsProps['animated']>().toEqualTypeOf<boolean | TabsAnimatedConfig | undefined>();
    expectTypeOf<TabsAnimatedConfig['tabPane']>().toEqualTypeOf<boolean | undefined>();
  });

  it('★ 语义槽是「8 平铺 + 1 嵌套」：`popup` 的形状是 `{ root }`（**不是** string）', () => {
    expectTypeOf<TabsSemanticClassNames['root']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<TabsSemanticClassNames['item']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<TabsSemanticClassNames['remove']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<TabsSemanticClassNames['indicator']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<TabsSemanticClassNames['header']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<TabsSemanticClassNames['body']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<TabsSemanticClassNames['content']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<TabsSemanticClassNames['popup']>().toEqualTypeOf<{ root?: string } | undefined>();
    expectTypeOf<TabsSemanticStyles['popup']>().toEqualTypeOf<
      { root?: CSSProperties } | undefined
    >();
  });

  it('语义槽可以是「对象 | 函数」两形态', () => {
    expectTypeOf<TabsSemanticValue<TabsSemanticClassNames>>().toEqualTypeOf<
      TabsSemanticClassNames | ((info: { props: TabsProps }) => TabsSemanticClassNames)
    >();
  });

  it('emits 的载荷（与 antd 同形）', () => {
    expectTypeOf<TabsEmits['update:activeKey']>().toEqualTypeOf<[activeKey: string]>();
    expectTypeOf<TabsEmits['change']>().toEqualTypeOf<[activeKey: string]>();
    expectTypeOf<TabsEmits['tabClick']>().toEqualTypeOf<[key: string, event: TabsEditEvent]>();
    // ⚠️ `edit` 的载荷是**联合**：add ⇒ 事件、remove ⇒ key
    expectTypeOf<TabsEmits['edit']>().toEqualTypeOf<
      [target: TabsEditEvent | string, action: TabsEditAction]
    >();
    expectTypeOf<TabsEditAction>().toEqualTypeOf<'add' | 'remove'>();
  });

  it('`editable`（内部配置）的 onEdit 载荷与 emits 同形', () => {
    expectTypeOf<NonNullable<TabsEditableConfig['onEdit']>>().toEqualTypeOf<
      (type: TabsEditAction, info: { key?: string; event: TabsEditEvent }) => void
    >();
    expectTypeOf<TabsEditableConfig['showAdd']>().toEqualTypeOf<boolean | undefined>();
  });

  it('三个 scoped slot 的签名', () => {
    expectTypeOf<TabsSlots['tabBar']>().toEqualTypeOf<
      ((props: TabsRenderTabBarProps) => VNodeChild) | undefined
    >();
    expectTypeOf<TabsSlots['popupRender']>().toEqualTypeOf<
      ((menu: VNodeChild, info: TabsMorePopupInfo) => VNodeChild) | undefined
    >();
    expectTypeOf<TabsSlots['extra']>().toEqualTypeOf<
      ((props: { position: 'left' | 'right' }) => VNodeChild) | undefined
    >();
    expectTypeOf<TabsMorePopupInfo['restTabs']>().toEqualTypeOf<TabsItem[]>();
    expectTypeOf<TabsMorePopupInfo['onClose']>().toEqualTypeOf<() => void>();
  });

  it('`TabsRenderTabBarProps` 的形状（= rc 的 RenderTabBarProps 的 Vue 化）', () => {
    expectTypeOf<TabsRenderTabBarProps['activeKey']>().toEqualTypeOf<string>();
    expectTypeOf<TabsRenderTabBarProps['rtl']>().toEqualTypeOf<boolean>();
    expectTypeOf<TabsRenderTabBarProps['more']>().toEqualTypeOf<TabsMoreProps>();
    expectTypeOf<TabsRenderTabBarProps['indicator']>().toEqualTypeOf<TabsIndicator | undefined>();
    expectTypeOf<TabsRenderTabBarProps['extra']>().toEqualTypeOf<TabsExtraContent | undefined>();
  });

  it('`tabBarExtraContent` 两形态：节点 或 `{left,right}`', () => {
    expectTypeOf<TabsExtraContent>().toEqualTypeOf<
      VNodeChild | { left?: VNodeChild; right?: VNodeChild }
    >();
  });

  it('`TabsRef` 只有 `nativeElement`（与上游一致）', () => {
    expectTypeOf<TabsRef>().toEqualTypeOf<{ nativeElement: HTMLElement | null }>();
  });

  it('`locale` 的三个键都是可选 string', () => {
    expectTypeOf<TabsLocale['dropdownAriaLabel']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<TabsLocale['removeAriaLabel']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<TabsLocale['addAriaLabel']>().toEqualTypeOf<string | undefined>();
  });
});

describe('Tabs · L3 负例', () => {
  it('`items[].key` 必填（不接受缺 key 的项）', () => {
    type Acceptable = TabsItem;
    // @ts-expect-error key 是必填
    const bad: Acceptable = { label: 'no key' };
    expectTypeOf(bad).not.toBeNever();
  });

  it('`size` 不接受「middle」（只有三档）', () => {
    type Acceptable = TabsProps['size'];
    // @ts-expect-error 'middle' 不是本仓的尺寸值
    const bad: Acceptable = 'middle';
    expectTypeOf(bad).not.toBeNever();
  });

  it('语义槽 `popup` 不接受字符串（必须是 `{ root }`）', () => {
    type Acceptable = TabsSemanticClassNames;
    // @ts-expect-error popup 是嵌套形状（`{ root?: string }`）
    const bad: Acceptable = { popup: 'x' };
    expectTypeOf(bad).not.toBeNever();
  });

  it('语义槽不接受未知键', () => {
    type Acceptable = TabsSemanticClassNames;
    // @ts-expect-error 'tab' 不是语义槽（只有那 8 个平铺的）
    const bad: Acceptable = { tab: 'x' };
    expectTypeOf(bad).not.toBeNever();
  });

  it('`animated` 不接受对象里的未知键', () => {
    type Acceptable = TabsAnimatedConfig;
    // @ts-expect-error 只有 inkBar / tabPane
    const bad: Acceptable = { inkbar: true };
    expectTypeOf(bad).not.toBeNever();
  });

  it('`edit` 事件的动作只有 add / remove', () => {
    type Acceptable = TabsEditAction;
    // @ts-expect-error 'delete' 不是动作
    const bad: Acceptable = 'delete';
    expectTypeOf(bad).not.toBeNever();
  });
});
