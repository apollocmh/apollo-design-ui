<script lang="ts">
/**
 * Tabs 主实现 —— antd 6.6.4 `es/tabs/index.js`（**169 行壳**）+
 * rc-tabs@1.13.0 内核（`Tabs.js` 153 + `TabNavList` 593 + `OperationNode` 198 + `TabNode` 107
 * + hooks 462，共 17 文件）的 Vue 等价物。
 *
 * 判据逐条见 `docs/analysis/tabs.md`。子组件分工：
 *
 * | 文件 | 对应上游 | 职责 |
 * |---|---|---|
 * | `TabNavList.ts` | `TabNavList/index.js`（593） | 测量 / 滚动 / 指示条 / 键盘 / 溢出 |
 * | `TabNode.ts` | `TabNavList/TabNode.js` | 单个页签的 DOM 与 ARIA（规范主力） |
 * | `OperationNode.ts` | `TabNavList/OperationNode.js` | 溢出下拉（listbox） |
 * | `AddButton.ts` / `ExtraContent.ts` | 同名 | 「+」按钮 / 两侧附加内容 |
 * | `TabPanelList.ts` + `TabPane.ts` | `TabPanelList/*` | 面板区（CSSMotion） |
 * | `hooks/*` | `hooks/*` | 纯函数化的 offsets/visibleRange/indicator + 动效配置 |
 *
 * ── 壳层（antd，本文件）────────────────────────────────────────────────────────
 * 1. **5 条废弃/移除告警**（popupClassName、tabPosition、indicatorSize、
 *    destroyInactiveTabPane、onPrevClick/onNextClick）；
 * 2. `tabPlacement ?? tabPosition` + RTL 的 `start⇄right` / `end⇄left` 映射；
 * 3. `type='editable-card'` ⇒ 组装 `editable`（onEdit 载荷改写：**add 传事件、remove 传 key**）；
 * 4. `more` 的三源合并（`tabs.more?.icon` → `tabs.moreIcon` → `moreIcon`）并**强制**
 *    `transitionName = {rootPrefixCls}-slide-up`；
 * 5. `indicator` 的四源合并（`indicator.*` ?? `indicatorSize` ?? `tabs.indicator.*` ?? `tabs.indicatorSize`）；
 * 6. items 归一：item 级 `destroyInactiveTabPane` → `destroyOnHidden`；
 * 7. 语义槽合并（**8 个平铺 + 1 个嵌套 `popup`**，传给内部时把 popup 展平）。
 *
 * ── 状态机（rc）──────────────────────────────────────────────────────────────
 * `activeKey` 受控 + **自动重置**（当前 key 被删 ⇒ 用**旧索引**夹到新长度）；
 * `id` **异步生成**（首帧 `null` ⇒ 首帧没有 `aria-controls` / `aria-labelledby`）；
 * `mobile`（挂载后求值）；`onInternalTabClick`（`change` 只在**真的变了**时发，
 * `tabClick` 每次都发）。
 *
 * ── Vue 化差异（登记 README §2）────────────────────────────────────────────────
 *   - `v-model:activeKey`（C11：`update:activeKey` 与 `change` 同发）；
 *   - `renderTabBar` / `more.popupRender` / `tabBarExtraContent` → **scoped slot**
 *     （`#tabBar` / `#morePopup` / `#extra`，C8）；
 *   - `expose({ nativeElement })`（与上游 `TabsRef` 同形）；
 *   - `children`（`Tabs.TabPane` 兼容写法）**只发告警不实现**（上游 v6 已 deprecated）；
 *   - 面板 id 前缀是 `apollo-tabs-N`（上游是 `rc-tabs-N`）—— 平台差异，见 README §2。
 */

import { CloseOutlined, EllipsisOutlined, PlusOutlined } from '@apollo-design/icons';
import { devUseWarning } from '@apollo-design/utils';
import {
  type CSSProperties,
  computed,
  defineComponent,
  h,
  onMounted,
  type PropType,
  ref,
  type VNodeChild,
  watch,
} from 'vue';
import { semanticRootStyle, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { type SizeType, useSize } from '../config-provider/size-context';
import { getAnimateConfig } from './hooks/use-animate-config';
import type {
  TabPlacement,
  TabPosition,
  TabsAnimatedConfig,
  TabsEditAction,
  TabsEditableConfig,
  TabsEditEvent,
  TabsExtraContent,
  TabsIndicator,
  TabsItem,
  TabsProps,
  TabsSemanticClassNames,
  TabsSemanticStyles,
  TabsType,
} from './interface';
import TabNavList from './TabNavList';
import TabPanelList from './TabPanelList';
import { filterItems, isMobile } from './util';

/** 面板 id 的计数器（上游是模块级 `let uuid = 0`）。 */
let uuid = 0;

/**
 * ConfigProvider 上 `components.tabs` 的分片形状（= antd 的 `TabsConfig`）。
 */
export interface TabsConfig {
  className?: string;
  style?: Record<string, unknown>;
  classNames?: TabsSemanticClassNames;
  styles?: TabsSemanticStyles;
  type?: TabsType;
  /** ⚠️ 与公开的 `TabsProps['size']` 同源：必须是 `SizeType`（见 `interface.ts` 的说明）。 */
  size?: SizeType;
  centered?: boolean;
  more?: { icon?: VNodeChild };
  /** @deprecated 用 `more.icon`。 */
  moreIcon?: VNodeChild;
  addIcon?: VNodeChild;
  removeIcon?: VNodeChild;
  indicator?: TabsIndicator;
  /** @deprecated 用 `indicator.size`。 */
  indicatorSize?: number | ((origin: number) => number);
  [key: string]: unknown;
}

export default defineComponent({
  name: 'ATabs',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    type: { type: String as PropType<TabsType>, default: undefined },
    centered: { type: Boolean, default: undefined },
    size: { type: String as PropType<SizeType>, default: undefined },
    tabPlacement: { type: String as PropType<TabPlacement>, default: undefined },
    direction: { type: String as PropType<'ltr' | 'rtl'>, default: undefined },
    /** @deprecated 用 `tabPlacement`。 */
    tabPosition: { type: String as PropType<TabPosition>, default: undefined },
    activeKey: { type: String, default: undefined },
    defaultActiveKey: { type: String, default: undefined },
    items: { type: Array as PropType<TabsItem[]>, default: undefined },
    /** ⚠️ 兼容形态：只发 deprecated 告警，**不实现**（用 `items`）。 */
    children: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    /**
     * ⚠️ 用**公开类型**（`TabsProps['renderTabBar']`）而不是宽松的
     * `(props: Record<string, unknown>) => VNodeChild` —— 后者会让
     * `InstanceType<typeof Tabs>['$props']` 与 `TabsProps` 因**函数参数逆变**而**双向不可赋值**
     * ⇒ 消费方（card 的 `tabProps`）转发时必须过一次 `unknown`（2026-10-03 修正）。
     */
    renderTabBar: {
      type: Function as PropType<TabsProps['renderTabBar']>,
      default: undefined,
    },
    hideAdd: { type: Boolean, default: undefined },
    addIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    removeIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    /** @deprecated 用 `more.icon`。 */
    moreIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    // ⚠️ 同上：用公开类型（`TabsMoreProps`），不要写 `Record<string, unknown>`。
    more: { type: Object as PropType<TabsProps['more']>, default: undefined },
    /** @deprecated 用 `classNames.popup`。 */
    popupClassName: { type: String, default: undefined },
    indicator: { type: Object as PropType<TabsIndicator | undefined>, default: undefined },
    /** @deprecated 用 `indicator.size`。 */
    indicatorSize: {
      type: [Number, Function] as unknown as PropType<
        number | ((origin: number) => number) | undefined
      >,
      default: undefined,
    },
    animated: {
      type: [Boolean, Object] as unknown as PropType<boolean | TabsAnimatedConfig | undefined>,
      default: undefined,
    },
    tabBarGutter: { type: Number, default: undefined },
    tabBarStyle: { type: Object as PropType<CSSProperties | undefined>, default: undefined },
    tabBarExtraContent: { type: null as unknown as PropType<TabsExtraContent>, default: undefined },
    destroyOnHidden: { type: Boolean, default: undefined },
    /** @deprecated 用 `destroyOnHidden`。 */
    destroyInactiveTabPane: { type: Boolean, default: undefined },
    // ⚠️ 同上：用公开类型（`TabsLocale`）。
    locale: { type: Object as PropType<TabsProps['locale']>, default: undefined },
    getPopupContainer: {
      type: Function as PropType<(node: HTMLElement) => HTMLElement>,
      default: undefined,
    },
    // ⚠️ `PropType` 必须用**公开类型**（含**函数形态** `(info) => 对象`）——
    //    写成 `TabsSemanticClassNames` 会让 `TabsProps` 的函数形态**无法赋给** `$props`
    //    ⇒ 消费方转发时被迫过一次 `unknown`。运行时的 `[Object, Function]` 本来就对
    //    （PITFALLS 21），这里只是把**类型面**补齐。
    classNames: {
      type: [Object, Function] as unknown as PropType<TabsProps['classNames']>,
      default: undefined,
    },
    styles: {
      type: [Object, Function] as unknown as PropType<TabsProps['styles']>,
      default: undefined,
    },
    id: { type: String, default: undefined },
  },
  emits: {
    // 🚨 **不要**同时把这三个声明成 props（`onTabClick` / `onEdit` / `onTabScroll`）：
    //    Vue 的 `emit('tabClick')` 会去找 `props.onTabClick` **或** `attrs.onTabClick`
    //    —— 两边都有时回调会被调**两次**（L2 的 `onTabClick` 用例就是这条的哨兵）。
    //    本仓约定（C5）：React 的 `onXxx` 回调在 Vue 侧就是 `emit('xxx')`，
    //    调用方写 `@tab-click` / `:on-tab-click` 都能收到（同一份 handler）。
    'update:activeKey': (_key: string) => true,
    change: (_key: string) => true,
    // ⚠️ **载荷类型必须用公开类型**（`TabsEditEvent` / `TabsEditAction` / 方向联合），
    //    不能图省事写 `unknown` —— `$props` 的事件处理器类型由这里派生，写成 `unknown`
    //    会让「`TabsProps` → `$props`」因**参数逆变**失败（`unknown` 不可赋给 `TabsEditEvent`）
    //    ⇒ 消费方（card 的 `tabProps`）转发时被迫过一次 `unknown`（2026-10-03 修正）。
    tabClick: (_key: string, _event: TabsEditEvent) => true,
    tabScroll: (_info: { direction: 'left' | 'right' | 'top' | 'bottom' }) => true,
    edit: (_target: TabsEditEvent | string, _action: TabsEditAction) => true,
  },
  setup(props, { slots, emit, attrs, expose }) {
    const {
      getPrefixCls,
      getPopupContainer: contextGetPopupContainer,
      classNames: contextClassNames,
      styles: contextStyles,
      ...configTabs
    } = useComponentConfig<TabsConfig>('tabs');

    const prefixCls = props.prefixCls ?? getPrefixCls('tabs');
    const rootPrefixCls = getPrefixCls();
    const rootRef = ref<HTMLElement | null>(null);

    expose({ nativeElement: (): HTMLElement | null => rootRef.value });

    // ======================== Warning（5 条） ========================
    watch(
      () => [props.tabPosition, props.popupClassName, props.indicatorSize] as const,
      ([tabPosition, popupClassName, indicatorSize]) => {
        const warning = devUseWarning('Tabs');
        if (tabPosition !== undefined) warning.deprecated(false, 'tabPosition', 'tabPlacement');
        if (popupClassName !== undefined) {
          warning.deprecated(false, 'popupClassName', 'classNames.popup');
        }
        if (indicatorSize !== undefined) {
          warning.deprecated(false, 'indicatorSize', 'indicator.size');
        }
      },
      { immediate: true },
    );
    watch(
      () => [props.destroyInactiveTabPane, props.children] as const,
      ([destroyInactiveTabPane, children], prev) => {
        const warning = devUseWarning('Tabs');
        if (destroyInactiveTabPane !== undefined) {
          warning.deprecated(false, 'destroyInactiveTabPane', 'destroyOnHidden');
        }
        // `children` 每次渲染都是新数组 ⇒ 只在「第一次出现」时告警（否则会刷屏）
        if (children !== undefined && (prev === undefined || prev[1] === undefined)) {
          warning.deprecated(false, 'Tabs.TabPane', 'items');
        }
        if (attrs.onPrevClick !== undefined || attrs.onNextClick !== undefined) {
          // ⚠️ 本仓的 `DevWarning` **没有** antd 那个 `(valid, 'breaking', msg)` 三元形态
          //    （只有 `(valid, message)` 与 `.deprecated(...)`）⇒ 把 `breaking` 写进正文。
          warning(
            false,
            '[breaking] `onPrevClick` and `onNextClick` has been removed. Please use `onTabScroll` instead.',
          );
        }
      },
      { immediate: true },
    );

    // ======================== size ========================
    // ⚠️ 必须用**函数形态**（PITFALLS 163：`useSize(props.size)` 非响应式）
    const size = useSize((ctx) => props.size ?? ctx);
    void configTabs.size;

    // ======================== items 归一 ========================
    const mergedItems = computed<TabsItem[]>(() =>
      (props.items ?? []).map((item) => ({
        ...item,
        destroyOnHidden: item.destroyOnHidden ?? item.destroyInactiveTabPane,
      })),
    );

    // ======================== animated / indicator / placement ========================
    const mergedAnimated = computed(() => getAnimateConfig(prefixCls, props.animated));

    const mergedIndicator = computed<TabsIndicator>(() => ({
      align: props.indicator?.align ?? configTabs.indicator?.align,
      size:
        props.indicator?.size ??
        props.indicatorSize ??
        configTabs.indicator?.size ??
        configTabs.indicatorSize,
    }));

    // ⚠️ 必须走 `useDirection()`：`useComponentConfig()` 解构出的 `direction` 是
    //    **快照**（`inject` 只在 setup 期解析一次），ConfigProvider 之后改它不会响应
    //    （差异 D27；`direction` 甚至可能是 `undefined` ⇒ 直接 `.value` 会抛）
    const contextDirection = useDirection();
    // ⚠️ rc TabsProps 的 `direction` prop 优先于 ConfigProvider（§2.2 审计补齐）
    const direction = computed<'ltr' | 'rtl' | undefined>(
      () => props.direction ?? contextDirection.value,
    );
    const rtl = computed(() => direction.value === 'rtl');

    const mergedPlacement = computed<TabPosition | undefined>(() => {
      const placement = props.tabPlacement ?? props.tabPosition;
      switch (placement) {
        case 'start':
          return rtl.value ? 'right' : 'left';
        case 'end':
          return rtl.value ? 'left' : 'right';
        default:
          return placement;
      }
    });

    // ======================== 语义槽 ========================
    // ⚠️ antd 的第四参是 `{ popup: { _default: 'root' } }`（KNOWN-ISSUES §1.7b 已补）：
    //    字符串形态 `classNames.popup = 'x'` 会被归到 `popup.root`，混用不再产垃圾键。
    const { classNames: mergedClassNamesRaw, styles: mergedStylesRaw } = useMergeSemantic<
      Record<string, unknown>,
      TabsSemanticClassNames,
      TabsSemanticStyles
    >(
      [contextClassNames as TabsSemanticClassNames, props.classNames as TabsSemanticClassNames],
      [
        contextStyles as TabsSemanticStyles,
        semanticRootStyle(attrs.style as CSSProperties | undefined) as TabsSemanticStyles,
        props.styles as TabsSemanticStyles,
        semanticRootStyle(attrs.style as CSSProperties | undefined) as TabsSemanticStyles,
      ],
      { props: props as unknown as Record<string, unknown> },
      { popup: { _default: 'root' } },
    );

    const mergedClassNames = computed<TabsSemanticClassNames>(() => {
      const raw = mergedClassNamesRaw.value;
      // 展平后按**嵌套形状**的公开类型断言（`popup` 的公开形态是 `{ root }`）
      return {
        ...raw,
        popup: (raw.popup as { root?: string } | undefined)?.root,
      } as TabsSemanticClassNames;
    });
    const mergedStyles = computed<TabsSemanticStyles>(() => {
      const raw = mergedStylesRaw.value;
      return {
        ...raw,
        popup: (raw.popup as { root?: Record<string, unknown> } | undefined)?.root,
      } as TabsSemanticStyles;
    });

    // ======================== editable ========================
    const editable = computed<TabsEditableConfig | undefined>(() => {
      if (props.type !== 'editable-card') return undefined;
      return {
        onEdit: (editType: TabsEditAction, info: { key?: string; event: TabsEditEvent }) => {
          // ⚠️ 载荷改写：**add 传事件、remove 传 key**
          emit('edit', editType === 'add' ? info.event : (info.key as string), editType);
        },
        removeIcon: props.removeIcon ?? configTabs.removeIcon ?? h(CloseOutlined),
        addIcon: props.addIcon ?? configTabs.addIcon ?? h(PlusOutlined),
        showAdd: props.hideAdd !== true,
      };
    });

    // ======================== more 的三源合并 ========================
    const mergedMore = computed(() => ({
      icon: configTabs.more?.icon ?? configTabs.moreIcon ?? props.moreIcon ?? h(EllipsisOutlined),
      // ⚠️ antd 强制这个动效名（**rootPrefixCls**，不是组件前缀；PITFALLS 180 同族）
      transitionName: `${rootPrefixCls}-slide-up`,
      ...(props.more ?? {}),
    }));

    // ======================== 状态机 ========================
    const tabs = computed(() => filterItems(props.items));

    const innerActiveKey = ref<string | undefined>(props.defaultActiveKey ?? tabs.value[0]?.key);
    const mergedActiveKey = computed(() => props.activeKey ?? innerActiveKey.value);
    const activeIndex = ref<number>(
      tabs.value.findIndex((tab) => tab.key === (props.activeKey ?? innerActiveKey.value)),
    );

    // Reset active key if not exist anymore
    // ⚠️ 依赖里有一项是「key 串」（数组每轮都是新引用 —— 上游同判）
    watch(
      () => [tabs.value.map((tab) => tab.key).join('_'), mergedActiveKey.value, activeIndex.value],
      () => {
        let newActiveIndex = tabs.value.findIndex((tab) => tab.key === mergedActiveKey.value);
        if (newActiveIndex === -1) {
          // 用**旧索引**夹到新长度
          newActiveIndex = Math.max(0, Math.min(activeIndex.value, tabs.value.length - 1));
          innerActiveKey.value = tabs.value[newActiveIndex]?.key;
        }
        activeIndex.value = newActiveIndex;
      },
      { immediate: true },
    );

    const mobile = ref(false);
    onMounted(() => {
      mobile.value = isMobile();
    });

    // Accessibility：`id` **异步生成**（首帧 null ⇒ 首帧没有 aria 关联）
    const innerId = ref<string | null>(null);
    const mergedId = computed<string | null>(() => props.id ?? innerId.value);
    onMounted(() => {
      if (!props.id) {
        // 上游是 `rc-tabs-${NODE_ENV === 'test' ? 'test' : uuid++}`；本仓前缀随库
        innerId.value = `${prefixCls}-${uuid}`;
        uuid += 1;
      }
    });

    const onInternalTabClick = (key: string, e: TabsEditEvent): void => {
      emit('tabClick', key, e);
      const isActiveChanged = key !== mergedActiveKey.value;
      innerActiveKey.value = key;
      if (isActiveChanged) {
        emit('update:activeKey', key);
        emit('change', key);
      }
    };

    // `#extra` 槽（带 position 参数）与 `tabBarExtraContent` prop 两通道
    const mergedExtra = computed<TabsExtraContent>(() => {
      const slot = slots.extra;
      if (slot) {
        return {
          left: slot({ position: 'left' }),
          right: slot({ position: 'right' }),
        };
      }
      return props.tabBarExtraContent;
    });

    // ======================== 供 `#tabBar` 槽的参数（= rc 的 RenderTabBarProps）===========
    const tabBarProps = computed<Record<string, unknown>>(() => ({
      id: mergedId.value,
      activeKey: mergedActiveKey.value,
      animated: mergedAnimated.value,
      tabPosition: mergedPlacement.value ?? 'top',
      rtl: rtl.value,
      mobile: mobile.value,
      editable: editable.value,
      locale: props.locale,
      more: mergedMore.value,
      tabBarGutter: props.tabBarGutter,
      onTabClick: onInternalTabClick,
      onTabScroll: (info: { direction: 'left' | 'right' | 'top' | 'bottom' }) => {
        emit('tabScroll', info);
      },
      extra: mergedExtra.value,
      style: props.tabBarStyle,
      getPopupContainer: props.getPopupContainer ?? contextGetPopupContainer,
      indicator: mergedIndicator.value,
      popupClassName: mergedClassNames.value.popup,
      popupStyle: mergedStyles.value.popup,
      prefixCls,
      tabs: tabs.value,
      classNames: mergedClassNames.value,
      styles: mergedStyles.value,
    }));

    return () => {
      const mergedPlacementValue = mergedPlacement.value ?? 'top';
      const sizeValue = size.value;

      const rootClass = [
        prefixCls,
        `${prefixCls}-${mergedPlacementValue}`,
        {
          [`${prefixCls}-large`]: sizeValue === 'large',
          [`${prefixCls}-small`]: sizeValue === 'small',
          [`${prefixCls}-card`]: ['card', 'editable-card'].includes(props.type ?? ''),
          [`${prefixCls}-editable-card`]: props.type === 'editable-card',
          [`${prefixCls}-centered`]: props.centered,
          [`${prefixCls}-mobile`]: mobile.value,
          [`${prefixCls}-editable`]: !!editable.value,
          [`${prefixCls}-rtl`]: rtl.value,
        },
        // 调用方原生 class（位置与原先的 props.className/rootClassName 一致）
        attrs.class,
        mergedClassNames.value.root,
      ];

      const navNode = slots.tabBar
        ? slots.tabBar(tabBarProps.value as never)
        : h(TabNavList as never, tabBarProps.value as never);

      const panelNode = h(
        TabPanelList as never,
        {
          prefixCls,
          id: mergedId.value,
          tabs: tabs.value,
          activeKey: mergedActiveKey.value,
          animated: mergedAnimated.value,
          tabPosition: mergedPlacementValue,
          destroyOnHidden: props.destroyOnHidden ?? props.destroyInactiveTabPane,
          bodyStyle: mergedStyles.value.body,
          bodyClassName: mergedClassNames.value.body,
          contentStyle: mergedStyles.value.content,
          contentClassName: mergedClassNames.value.content,
        } as never,
      );

      // ⚠️ 末尾的 `...attrs` 会**覆盖** `class`（Vue 的对象展开语义）⇒
      //    必须先把 `class` 摘掉，否则调用方传 class 时整条 rootClass 全丢。
      const { class: _attrsClass, ...restAttrs } = attrs;
      void _attrsClass;
      return h(
        'div',
        {
          ref: rootRef,
          id: props.id,
          class: rootClass,
          ...restAttrs,
        },
        [navNode, panelNode] as never,
      );
    };
  },
});
</script>

<template>
  <!--
    ⚠️ 本组件是 `<script lang="ts">` + 渲染函数（与 pagination 同形态）。
    模板只留一个占位 —— 真正的渲染在 `setup` 返回的 render 里，
    因为「属性透传顺序 / `VNodeChild` / 条件节点」这三点用模板表达会失真。
    该占位**不会**进入 DOM（有 render 返回时模板被忽略）。
  -->
  <span />
</template>
