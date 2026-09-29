/**
 * Menu —— rc-menu `Menu.js`（440 行）的 Vue 化 + antd `menu.tsx` 壳的合并。
 *
 * 核心协议（rc 逐条）：
 * - **双渲染**：measure 子树（PathRegister 注入，子组件只登记路径渲染 null）
 *   + 可见子树（PathTracker 注入 keyPath）。provide 在 setup 顶层；
 *   measure 分支经 `MeasureProvider` 包装组件注入。
 * - **状态族**：selectedKeys / openKeys / activeKey（useControlledValue）。
 * - **Overflow 接入**：horizontal && !disabledOverflow ⇒ Overflow（RESPONSIVE），
 *   其余 INVALIDATE；overflowed 区子项经 context `overflowDisabled` 抑制 hover。
 * - 选择协议：onClick(info) 永远触发；selectable 时更新 selectedKeys 并
 *   onSelect/onDeselect；!multiple && 非 inline ⇒ 选择后关闭全部子菜单。
 *
 * v1 裁剪（analysis §6）：flushSync 同步批（D87）；children 写法（D89）；
 * semantic 的 popup/subMenu 槽后续补；inline 模式的 Overflow 恒 INVALIDATE。
 */

import { EllipsisOutlined } from '@apollo-design/icons';
import { useControlledValue } from '@apollo-design/utils';
import {
  type ComputedRef,
  computed,
  defineComponent,
  Fragment,
  h,
  inject,
  type PropType,
  provide,
  ref,
  shallowRef,
  type VNodeChild,
} from 'vue';
import Overflow, { INVALIDATE, RESPONSIVE } from '../_internal/overflow';
import {
  isSubPathKeyKey,
  type MenuContextData,
  type MenuOverrideData,
  menuContextKey,
  menuOverrideKey,
  pathRegisterKey,
  pathTrackerKey,
} from './context';
import { OVERFLOW_KEY, useKeyRecords } from './engine/key-records';
import { type ParsedNode, parseItems } from './engine/parse-items';
import { useAccessibility } from './engine/use-accessibility';
import type {
  ItemType,
  MenuInfo,
  MenuMode,
  MenuTheme,
  RenderIconType,
  SelectInfo,
  TriggerSubMenuAction,
} from './interface';
import MenuDivider from './MenuDivider';
import MenuItem from './MenuItem';
import MenuItemGroup from './MenuItemGroup';
import SubMenu from './SubMenu';

let uuid = 0;

const Menu = defineComponent({
  name: 'AMenu',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    mode: { type: String as PropType<MenuMode>, default: 'vertical' },
    theme: { type: String as PropType<MenuTheme>, default: 'light' },
    items: { type: Array as PropType<ItemType[]>, default: undefined },
    inlineCollapsed: { type: Boolean, default: undefined },
    disabled: { type: Boolean, default: false },
    disabledOverflow: { type: Boolean, default: false },
    selectable: { type: Boolean, default: true },
    multiple: { type: Boolean, default: false },
    selectedKeys: { type: Array as PropType<string[]>, default: undefined },
    defaultSelectedKeys: { type: Array as PropType<string[]>, default: undefined },
    openKeys: { type: Array as PropType<string[]>, default: undefined },
    defaultOpenKeys: { type: Array as PropType<string[]>, default: undefined },
    activeKey: { type: String, default: undefined },
    inlineIndent: { type: Number, default: 24 },
    subMenuOpenDelay: { type: Number, default: 0.1 },
    subMenuCloseDelay: { type: Number, default: 0.1 },
    forceSubMenuRender: { type: Boolean, default: false },
    triggerSubMenuAction: {
      type: String as PropType<TriggerSubMenuAction>,
      default: 'hover',
    },
    getPopupContainer: {
      type: Function as PropType<(node: HTMLElement) => HTMLElement>,
      default: undefined,
    },
    tabIndex: { type: Number, default: 0 },
    /**
     * 根 `<ul>` 的 role。默认 `'menu'`。
     *
     * ⚠️ 2026-09-30 补：rc-menu 的 `role` 是**可被 restProps 覆盖**的
     * （源码里 `role: "menu"` 写在 `_extends({...}, restProps)` **之前**），
     * antd 的 Tabs 溢出下拉就是靠这条把菜单当 **`role="listbox"`** 用
     * （`<Menu role="listbox" aria-activedescendant=… aria-label=…>`）。
     * 本仓原先硬编码 `'menu'` 且只放行 `class` / `style` ⇒ 那个用法**无法表达**。
     */
    role: { type: String, default: 'menu' },
    id: { type: String, default: undefined },
    onClick: { type: Function as PropType<(info: MenuInfo) => void>, default: undefined },
    onSelect: { type: Function as PropType<(info: SelectInfo) => void>, default: undefined },
    onDeselect: { type: Function as PropType<(info: SelectInfo) => void>, default: undefined },
    onOpenChange: {
      type: Function as PropType<(openKeys: string[]) => void>,
      default: undefined,
    },
    onKeyDown: { type: Function as PropType<(e: KeyboardEvent) => void>, default: undefined },
  },
  emits: {
    'update:selectedKeys': (_keys: string[]) => true,
    'update:openKeys': (_keys: string[]) => true,
  },
  setup(props, { emit, expose, attrs }) {
    // rc OverrideProvider（dropdown 等包装者）的覆盖通道
    const override = inject<MenuOverrideData | null>(menuOverrideKey, null);
    const prefixCls = override?.prefixCls ?? props.prefixCls ?? 'apollo-menu';
    const menuId = props.id ?? `apollo-menu-${uuid++}`;
    const containerRef = shallowRef<HTMLElement | null>(null);

    const parsedNodes = computed<ParsedNode[]>(() => parseItems(props.items));
    const mergedMode = computed<MenuMode>(
      () => override?.mode ?? (props.inlineCollapsed ? 'vertical' : props.mode),
    );

    // ======================= Path ========================
    const {
      registerPath,
      unregisterPath,
      refreshOverflowKeys,
      getKeys,
      getKeyPath,
      getSubPathKeys,
      isSubPathKey,
    } = useKeyRecords();

    // ====================== Select =======================
    const [mergedSelectKeys, setSelectKeys] = useControlledValue<string[]>({
      defaultValue: () => props.defaultSelectedKeys ?? [],
      getValue: () => props.selectedKeys,
      onChange: (next: string[]) => {
        emit('update:selectedKeys', next);
      },
    });

    // ======================= Open ========================
    const [mergedOpenKeysValue, setOpenKeys] = useControlledValue<string[]>({
      defaultValue: () => props.defaultOpenKeys ?? [],
      getValue: () => props.openKeys,
      onChange: (next: string[]) => {
        emit('update:openKeys', next);
      },
    });
    // rc 的 inlineCacheOpenKeys 仅在折叠切换瞬间注入（v1 不做折叠切换的缓存回放）
    const mergedOpenKeys = computed<string[]>(() => mergedOpenKeysValue.value ?? []);

    const triggerOpenKeys = (keys: string[]): void => {
      setOpenKeys(keys);
      props.onOpenChange?.(keys);
    };

    // ====================== Active =======================
    const activeKey = ref<string | undefined>(props.activeKey);
    const onActive = (key: string): void => {
      activeKey.value = key;
    };
    const onInactive = (key: string): void => {
      if (activeKey.value === key) activeKey.value = undefined;
    };

    // ===================== Selection =====================
    const mergedSelectable = override?.selectable ?? props.selectable;
    const triggerSelection = (info: MenuInfo): void => {
      if (mergedSelectable) {
        const targetKey = info.key;
        const exist = mergedSelectKeys.value.includes(targetKey);
        let newSelectKeys: string[];
        if (props.multiple) {
          newSelectKeys = exist
            ? mergedSelectKeys.value.filter((key) => key !== targetKey)
            : [...mergedSelectKeys.value, targetKey];
        } else {
          newSelectKeys = [targetKey];
        }
        setSelectKeys(newSelectKeys);
        const selectInfo: SelectInfo = { ...info, selectedKeys: newSelectKeys };
        if (exist) {
          props.onDeselect?.(selectInfo);
        } else {
          props.onSelect?.(selectInfo);
        }
      }
      // Whatever selectable, always close it（非 inline）
      if (!props.multiple && mergedOpenKeys.value.length && mergedMode.value !== 'inline') {
        triggerOpenKeys([]);
      }
    };

    const onInternalClick = (info: MenuInfo): void => {
      override?.onClick?.();
      props.onClick?.(info);
      triggerSelection(info);
    };

    const onInternalOpenChange = (key: string, open: boolean): void => {
      let newOpenKeys = mergedOpenKeys.value.filter((k) => k !== key);
      if (open) {
        newOpenKeys.push(key);
      } else if (mergedMode.value !== 'inline') {
        // 关闭全部相关 popup 子菜单
        const subPathKeys = getSubPathKeys(key);
        newOpenKeys = newOpenKeys.filter((k) => !subPathKeys.has(k));
      }
      triggerOpenKeys(newOpenKeys);
    };

    // =================== Accessibility ===================
    const triggerAccessibilityOpen = (key: string, open?: boolean): void => {
      const nextOpen = open ?? !mergedOpenKeys.value.includes(key);
      onInternalOpenChange(key, nextOpen);
    };
    const isRtl = computed(() => false);
    const onInternalKeyDown = useAccessibility({
      mode: mergedMode,
      activeKey: activeKey as ComputedRef<string | undefined>,
      isRtl,
      id: computed(() => menuId),
      containerRef,
      getKeys,
      getKeyPath,
      onActive,
      triggerOpen: triggerAccessibilityOpen,
      originOnKeyDown: props.onKeyDown,
    });

    // ====================== Context ======================
    const menuContext: MenuContextData = {
      prefixCls,
      menuId,
      mode: mergedMode,
      disabled: props.disabled,
      activeKey: activeKey as ComputedRef<string | undefined>,
      onActive,
      onInactive,
      selectedKeys: mergedSelectKeys as ComputedRef<string[]>,
      inlineIndent: props.inlineIndent,
      subMenuOpenDelay: props.subMenuOpenDelay,
      subMenuCloseDelay: props.subMenuCloseDelay,
      forceSubMenuRender: props.forceSubMenuRender,
      triggerSubMenuAction: props.triggerSubMenuAction,
      getPopupContainer: props.getPopupContainer,
      motion: null,
      defaultMotions: null,
      onItemClick: onInternalClick as (info: unknown) => void,
      onOpenChange: onInternalOpenChange,
      openKeys: mergedOpenKeys,
      renderNode: renderNode as unknown as (node: unknown, keyPath: string[]) => unknown,
      inlineCollapsed: props.inlineCollapsed ?? false,
      firstLevel: true,
      theme: props.theme,
      expandIcon: override?.expandIcon as RenderIconType | undefined,
    };
    provide(menuContextKey, menuContext);
    provide(isSubPathKeyKey, isSubPathKey);
    // 可见子树的 keyPath 根
    provide(
      pathTrackerKey,
      computed(() => [] as string[]),
    );

    /** measure 子树的注入包装（rc PathRegisterContext.Provider 同构）。 */
    const MeasureProvider = defineComponent({
      name: 'AMenuMeasureProvider',
      setup(_, { slots }) {
        provide(pathRegisterKey, { registerPath, unregisterPath });
        return () => slots.default?.();
      },
    });

    // ======================= Expose ======================
    expose({
      list: containerRef,
      focus: (options?: FocusOptions) => {
        const first = containerRef.value?.querySelector<HTMLElement>('[role="menuitem"]');
        first?.focus(options);
      },
      findItem: ({ key }: { key: string }) =>
        containerRef.value?.querySelector<HTMLElement>(`[data-menu-id='${menuId}-${key}']`) ?? null,
    });

    // ====================== Render =======================
    /** 规范节点 → vnode（可见/measure 两棵子树共用）。 */
    function renderNode(
      node: ParsedNode,
      keyPath: string[],
      overflowDisabled: boolean,
      overflowCls?: string,
    ): VNodeChild {
      const eventKey = node.key;
      const childPath = [...keyPath, eventKey];
      switch (node.kind) {
        case 'item':
          return h(
            MenuItem,
            {
              key: eventKey,
              eventKey,
              disabled: node.disabled,
              danger: node.danger,
              icon: node.icon,
              // title/extra 经 slot 下发（items 的 VNodeChild 富内容；C8-R2）
              title: typeof node.title === 'string' ? node.title : undefined,
              labelText: typeof node.label === 'string' ? node.label : undefined,
              overflowDisabled,
              overflowCls,
              itemData: { ...node, key: eventKey } as Record<string, unknown>,
              onClick: node.onClick,
              onMouseEnter: node.onMouseEnter,
              onMouseLeave: node.onMouseLeave,
            } as never,
            {
              default: () => node.label,
              // title 解析为 node.title ?? node.label（items 富内容走 slot）
              title: () => node.title ?? node.label,
              extra: node.extra !== undefined ? () => node.extra : undefined,
            },
          );
        case 'submenu':
          return h(
            SubMenu,
            {
              key: eventKey,
              eventKey,
              disabled: node.disabled,
              danger: node.danger,
              icon: node.icon,
              // title 经 slot 下发（items 的 VNodeChild 富内容；C8-R2）
              title:
                typeof (node.title ?? node.label) === 'string'
                  ? (node.title ?? node.label)
                  : undefined,
              popupClassName: node.popupClassName,
              overflowDisabled,
              overflowCls,
              childrenNodes: node.children,
            } as never,
            {
              // title 解析为 node.title ?? node.label（items 富内容走 slot）
              title: () => node.title ?? node.label,
            },
          );
        case 'group':
          // ⚠️ group 的 li 本体不带 overflow-item 类（rc：Divider/Group 不消费
          // OverflowContext）；子项经递归携带。
          return h(
            MenuItemGroup,
            { key: eventKey, eventKey, label: node.label as VNodeChild },
            {
              default: () =>
                (node.children ?? []).map((c) =>
                  renderNode(c, childPath, overflowDisabled, overflowCls),
                ),
            },
          );
        case 'divider':
          return h(MenuDivider, { key: eventKey, eventKey, dashed: node.dashed });
        default:
          return null;
      }
    }

    const renderList = (): VNodeChild[] =>
      parsedNodes.value.map((node) => renderNode(node, [], false));

    return () => {
      const useOverflow = mergedMode.value === 'horizontal' && !props.disabledOverflow;
      const maxCount = useOverflow ? RESPONSIVE : INVALIDATE;
      const overflowIndex = ref<number>(0);

      // ---- 可见子树 ----
      // menu root 的公共 attrs（horizontal 时由 Overflow 直接渲染 root ul ——
      // rc 的 Overflow component='ul' 同构；ul > div > li 会破坏 menu 的 DOM 语义）
      // `aria-*` 从 attrs 放行（与 rc-menu 的 `...restProps` 同判）：
      // 溢出下拉要用 `aria-activedescendant` / `aria-label`。
      const ariaAttrs = Object.fromEntries(
        Object.entries(attrs).filter(([key]) => key.startsWith('aria-')),
      );
      const rootAttrs = {
        ref: containerRef as never,
        'data-menu-list': true,
        role: props.role,
        tabindex: props.tabIndex,
        id: props.id,
        ...ariaAttrs,
        ...(typeof attrs.style === 'object'
          ? { style: attrs.style as Record<string, string | number> }
          : {}),
        class: [
          prefixCls,
          `${prefixCls}-root`,
          `${prefixCls}-${mergedMode.value}`,
          `${prefixCls}-${props.theme}`,
          props.inlineCollapsed ? `${prefixCls}-inline-collapsed` : undefined,
          typeof attrs.class === 'string' ? attrs.class : undefined,
        ],
        onKeydown: onInternalKeyDown,
      };

      const container = useOverflow
        ? h(Overflow, {
            key: 'overflow',
            prefixCls: `${prefixCls}-overflow`,
            component: 'ul',
            'data-menu-list': true,
            role: props.role,
            tabindex: props.tabIndex,
            ...ariaAttrs,
            id: props.id,
            onKeydown: onInternalKeyDown,
            className: rootAttrs.class,
            ssr: 'full',
            data: parsedNodes.value as unknown[],
            itemKey: (item: unknown) => (item as ParsedNode).key,
            maxCount,
            onVisibleChange: (count: number) => {
              overflowIndex.value = count;
              const omitKeys = parsedNodes.value.slice(count + 1).map((n) => n.key);
              refreshOverflowKeys(omitKeys);
            },
            renderRawItem: (item: unknown, index: number) =>
              renderNode(
                item as ParsedNode,
                [],
                index > overflowIndex.value,
                `${prefixCls}-overflow-item`,
              ),
            renderRawRest: () =>
              h(
                SubMenu,
                {
                  key: OVERFLOW_KEY,
                  eventKey: OVERFLOW_KEY,
                  internalPopupClose: true,
                  childrenNodes: [],
                } as never,
                // 溢出「更多」指示：程序化 VNode ⇒ 走 #title slot（C8-R2）
                { title: () => h(EllipsisOutlined) },
              ),
          } as never)
        : h('ul', rootAttrs, renderList());

      // ---- measure 子树（display:none，只登记路径）----
      const measureTree = h(
        'div',
        { style: { display: 'none' }, 'aria-hidden': true },
        renderList(),
      );

      // antd 的 SSR 输出是两个根（ul + measure div）—— Fragment 平铺
      return h(Fragment, null, [container, h(MeasureProvider, null, () => measureTree)]);
    };
  },
});

export default Menu;
