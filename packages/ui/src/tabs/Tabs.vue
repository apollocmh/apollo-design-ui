<script lang="ts">
/** Vue-native Tabs; geometry and static styles retain the original rc-tabs reference. */
import { CloseOutlined, EllipsisOutlined, PlusOutlined } from '@apollo-design/icons';
import { devUseWarning, useControlledValue } from '@apollo-design/utils';
import {
  type CSSProperties,
  computed,
  defineComponent,
  h,
  onMounted,
  normalizeStyle,
  type PropType,
  ref,
  type SlotsType,
  type VNodeChild,
  useId,
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
  TabsRenderTabBarProps,
  TabsSemanticClassNames,
  TabsSemanticStyles,
  TabsSlots,
  TabsType,
} from './interface';
import TabNavList from './TabNavList';
import TabPanelList from './TabPanelList';
import { useTabsTheme } from './use-tabs-theme';
import { filterItems, isMobile } from './util';

/**
 * ConfigProvider 上 `components.tabs` 的分片形状（= antd 的 `TabsConfig`）。
 */
export interface TabsConfig {
  className?: string;
  style?: CSSProperties;
  classNames?: TabsProps['classNames'];
  styles?: TabsProps['styles'];
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
}

const contentSlots: SlotsType<TabsSlots> = {};

export default defineComponent({
  name: 'ATabs',
  inheritAttrs: false,
  slots: contentSlots,
  expose: ['nativeElement'],
  props: {
    prefixCls: { type: String as PropType<string | undefined>, default: undefined },
    type: { type: String as PropType<TabsType>, default: undefined },
    centered: { type: Boolean as PropType<boolean | undefined>, default: undefined },
    size: { type: String as PropType<SizeType>, default: undefined },
    tabPlacement: { type: String as PropType<TabPlacement>, default: undefined },
    direction: { type: String as PropType<'ltr' | 'rtl'>, default: undefined },
    /** @deprecated 用 `tabPlacement`。 */
    tabPosition: { type: String as PropType<TabPosition>, default: undefined },
    activeKey: { type: String as PropType<string | undefined>, default: undefined },
    defaultActiveKey: { type: String as PropType<string | undefined>, default: undefined },
    items: { type: Array as PropType<TabsItem[]>, default: undefined },
    hideAdd: { type: Boolean as PropType<boolean | undefined>, default: undefined },
    addIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    removeIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    /** @deprecated 用 `more.icon`。 */
    moreIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    // ⚠️ 同上：用公开类型（`TabsMoreProps`），不要写 `Record<string, unknown>`。
    more: { type: Object as PropType<TabsProps['more']>, default: undefined },
    /** @deprecated 用 `classNames.popup`。 */
    popupClassName: { type: String as PropType<string | undefined>, default: undefined },
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
    tabBarGutter: { type: Number as PropType<number | undefined>, default: undefined },
    tabBarStyle: { type: Object as PropType<CSSProperties | undefined>, default: undefined },
    tabBarExtraContent: { type: null as unknown as PropType<TabsExtraContent>, default: undefined },
    destroyOnHidden: { type: Boolean as PropType<boolean | undefined>, default: undefined },
    /** @deprecated 用 `destroyOnHidden`。 */
    destroyInactiveTabPane: { type: Boolean as PropType<boolean | undefined>, default: undefined },
    // ⚠️ 同上：用公开类型（`TabsLocale`）。
    locale: { type: Object as PropType<TabsProps['locale']>, default: undefined },
    getPopupContainer: {
      type: Function as PropType<((node: HTMLElement) => HTMLElement) | undefined>,
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
    id: { type: String as PropType<string | undefined>, default: undefined },
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
  setup(props, { slots, emit, attrs }) {
    const configTabs = useComponentConfig<TabsConfig>('tabs');
    const prefixCls = computed(() => configTabs.getPrefixCls('tabs', props.prefixCls));
    const rootPrefixCls = computed(() => configTabs.getPrefixCls());
    const themeStyle = useTabsTheme(() => prefixCls.value);
    const popupZIndex = computed(() => {
      const value = themeStyle.value[`--${prefixCls.value}-z-index-popup`];
      return value === undefined ? undefined : Number(value);
    });
    const rootRef = ref<HTMLElement | null>(null);

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
      () => props.destroyInactiveTabPane,
      (value) => {
        if (value !== undefined) {
          devUseWarning('Tabs').deprecated(false, 'destroyInactiveTabPane', 'destroyOnHidden');
        }
      },
      { immediate: true },
    );

    // ======================== size ========================
    // ⚠️ 必须用**函数形态**（PITFALLS 163：`useSize(props.size)` 非响应式）
    const size = useSize((ctx) => props.size ?? configTabs.size ?? ctx);
    const mergedType = computed(() => props.type ?? configTabs.type ?? 'line');
    const mergedCentered = computed(() => props.centered ?? configTabs.centered ?? false);

    // ======================== items 归一 ========================
    const mergedItems = computed<TabsItem[]>(() =>
      // ⚠️ 先 filter 再归一：`items` 里可能有 `null`/字符串等非法项（有 `filterItems`
      //    的用例钉着），直接读 `item.destroyOnHidden` 会抛错。
      filterItems(props.items).map((item) => ({
        ...item,
        destroyOnHidden: item.destroyOnHidden ?? item.destroyInactiveTabPane,
      })),
    );

    // ======================== animated / indicator / placement ========================
    const mergedAnimated = computed(() => getAnimateConfig(prefixCls.value, props.animated));

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

    const semanticProps = computed<TabsProps>(() => ({
      ...props,
      size: size.value,
      type: mergedType.value,
      centered: mergedCentered.value,
      direction: direction.value,
      tabPlacement: props.tabPlacement ?? 'top',
      indicator: mergedIndicator.value,
      animated: mergedAnimated.value,
      items: mergedItems.value,
    }));
    const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
      TabsProps,
      TabsSemanticClassNames,
      TabsSemanticStyles
    >(
      [() => configTabs.classNames, () => props.classNames],
      [() => configTabs.styles, () => semanticRootStyle(configTabs.style), () => props.styles],
      semanticProps,
      { popup: { _default: 'root' } },
    );

    // ======================== editable ========================
    const editable = computed<TabsEditableConfig | undefined>(() => {
      if (mergedType.value !== 'editable-card') return undefined;
      return {
        onEdit: (...args: Parameters<TabsEditableConfig['onEdit']>) => {
          const [editType, info] = args;
          // ⚠️ 载荷改写：**add 传事件、remove 传 key**
          if (editType === 'add') emit('edit', info.event, editType);
          else emit('edit', info.key, editType);
        },
        removeIcon: props.removeIcon ?? configTabs.removeIcon ?? h(CloseOutlined),
        addIcon: props.addIcon ?? configTabs.addIcon ?? h(PlusOutlined),
        showAdd: props.hideAdd !== true,
      };
    });

    // ======================== more 的三源合并 ========================
    const mergedMore = computed(() => ({
      icon: configTabs.more?.icon ?? configTabs.moreIcon ?? props.moreIcon ?? h(EllipsisOutlined),
      // Default popup motion uses the root prefix; explicit more.transitionName may override it.
      transitionName: `${rootPrefixCls.value}-slide-up`,
      ...(props.more ?? {}),
    }));

    // ======================== 状态机 ========================
    // ⚠️ 渲染列表必须吃**归一后**的 items：`destroyInactiveTabPane → destroyOnHidden` 的
    //    映射只在 mergedItems 里做，直接用 props.items 会让单项卸载配置失效
    //    （`TabPanelList` 的 `removeOnLeave = 组件级 ?? item 级`）—— Issue #23.1。
    const tabs = computed(() => filterItems(mergedItems.value));

    const [mergedActiveKey, setActiveKey] = useControlledValue<string | undefined>({
      getValue: () => props.activeKey,
      defaultValue: () => props.defaultActiveKey ?? tabs.value.find((tab) => !tab.disabled)?.key,
    });
    const activeIndex = ref(
      tabs.value.findIndex((tab) => tab.key === mergedActiveKey.value),
    );
    watch(
      [() => tabs.value.map((tab) => tab.key), mergedActiveKey],
      () => {
        const currentIndex = tabs.value.findIndex((tab) => tab.key === mergedActiveKey.value);
        if (currentIndex !== -1) {
          activeIndex.value = currentIndex;
        } else if (props.activeKey === undefined) {
          const index = Math.max(0, Math.min(activeIndex.value, tabs.value.length - 1));
          const candidate = tabs.value[index];
          const next = candidate && !candidate.disabled ? candidate
            : tabs.value.slice(index).find((tab) => !tab.disabled)
              ?? tabs.value.findLast((tab) => !tab.disabled);
          setActiveKey(next?.key);
          activeIndex.value = index;
        }
      },
      { immediate: true },
    );

    const mobile = ref(false);
    onMounted(() => {
      mobile.value = isMobile();
    });

    // Vue's per-application id remains deterministic through SSR and hydration.
    const generatedId = useId();
    const mergedId = computed(() => props.id ?? `${prefixCls.value}-${generatedId}`);

    const onInternalTabClick = (key: string, e: TabsEditEvent): void => {
      const tab = tabs.value.find((item) => item.key === key);
      if (!tab || tab.disabled) return;
      emit('tabClick', key, e);
      const isActiveChanged = key !== mergedActiveKey.value;
      setActiveKey(key);
      if (isActiveChanged) {
        emit('update:activeKey', key);
        emit('change', key);
      }
    };

    // `#extra` 槽（带 position 参数）与 `tabBarExtraContent` prop 两通道
    const resolveExtra = (): TabsExtraContent => {
      const slot = slots.extra;
      if (slot) {
        return {
          left: slot({ position: 'left' }),
          right: slot({ position: 'right' }),
        };
      }
      return props.tabBarExtraContent;
    };

    // ======================== 供 `#tabBar` 槽的参数（= rc 的 RenderTabBarProps）===========
    const tabBarProps = computed(() => ({
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
      style: props.tabBarStyle,
      getPopupContainer: props.getPopupContainer,
      indicator: mergedIndicator.value,
      popupClassName: [props.popupClassName, mergedClassNames.value.popup?.root].filter(Boolean).join(' ') || undefined,
      popupStyle: { ...themeStyle.value, ...mergedStyles.value.popup?.root },
      popupZIndex: popupZIndex.value,
      prefixCls: prefixCls.value,
      tabs: tabs.value,
      classNames: mergedClassNames.value,
      styles: mergedStyles.value,
    }));

    const renderTabs = () => {
      const mergedPlacementValue = mergedPlacement.value ?? 'top';
      const sizeValue = size.value;

      const rootClass = [
        prefixCls.value,
        `${prefixCls.value}-${mergedPlacementValue}`,
        {
          [`${prefixCls.value}-large`]: sizeValue === 'large',
          [`${prefixCls.value}-small`]: sizeValue === 'small',
          [`${prefixCls.value}-card`]: ['card', 'editable-card'].includes(mergedType.value),
          [`${prefixCls.value}-editable-card`]: mergedType.value === 'editable-card',
          [`${prefixCls.value}-centered`]: mergedCentered.value,
          [`${prefixCls.value}-mobile`]: mobile.value,
          [`${prefixCls.value}-editable`]: !!editable.value,
          [`${prefixCls.value}-rtl`]: rtl.value,
        },
        // 调用方原生 class（位置与原先的 props.className/rootClassName 一致）
        configTabs.className,
        attrs.class,
        mergedClassNames.value.root,
      ];

      const navProps = { ...tabBarProps.value, extra: resolveExtra() } satisfies TabsRenderTabBarProps;
      const navNode = slots.tabBar
        ? slots.tabBar(navProps)
        : h(
            TabNavList,
            navProps,
            slots.popupRender ? { popupRender: slots.popupRender } : {},
          );

      const panelNode = h(
        TabPanelList,
        {
          prefixCls: prefixCls.value,
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
        },
      );

      const { class: _attrsClass, style: _attrsStyle, ...restAttrs } = attrs;
      return h('div', {
        ...restAttrs,
        ref: rootRef,
        id: props.id,
        class: rootClass,
        style: normalizeStyle([themeStyle.value, mergedStyles.value.root, attrs.style]),
      }, [navNode, panelNode]);
    };
    return { get nativeElement() { return rootRef.value; }, renderTabs };
  },
  render() {
    return this.renderTabs();
  },
});
</script>
