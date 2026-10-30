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
  type ComponentPublicInstance,
  computed,
  defineComponent,
  Fragment,
  h,
  inject,
  mergeProps,
  normalizeClass,
  onMounted,
  type PropType,
  provide,
  ref,
  type SlotsType,
  shallowRef,
  useId,
  type VNodeChild,
  watch,
} from 'vue';
import Overflow, { INVALIDATE, RESPONSIVE } from '../_internal/overflow';
import { useMergeSemantic } from '../_internal/use-merge-semantic';
import {
  type ComponentStyleConfig,
  useComponentConfig,
  useDirection,
} from '../config-provider/context';
import { useDisabled } from '../config-provider/disabled-context';
import { useSiderContext } from '../layout/context';
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
import { getMenuId, useAccessibility } from './engine/use-accessibility';
import type {
  ItemType,
  MenuInfo,
  MenuMode,
  MenuProps,
  MenuRef,
  MenuSlots,
  MenuTheme,
  SelectInfo,
  TriggerSubMenuAction,
} from './interface';
import MenuDivider from './MenuDivider';
import MenuItem from './MenuItem';
import MenuItemGroup from './MenuItemGroup';
import SubMenu from './SubMenu';
import { useMenuTheme } from './use-menu-theme';

const Menu = defineComponent({
  name: 'AMenu',
  inheritAttrs: false,
  slots: Object as SlotsType<MenuSlots>,
  props: {
    prefixCls: { type: String, default: undefined },
    mode: { type: String as PropType<MenuMode>, default: 'vertical' },
    theme: { type: String as PropType<MenuTheme>, default: 'light' },
    items: { type: Array as PropType<ItemType[]>, default: undefined },
    inlineCollapsed: { type: Boolean, default: undefined },
    disabled: { type: Boolean, default: undefined },
    disabledOverflow: { type: Boolean, default: false },
    selectable: { type: Boolean, default: undefined },
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
    /** 折叠态 item 标题的 Tooltip 配置（`false` 关闭）；与 antd Menu 同判。 */
    tooltip: {
      type: [Boolean, Object] as PropType<MenuProps['tooltip']>,
      default: undefined,
    },
    triggerSubMenuAction: {
      type: String as PropType<TriggerSubMenuAction>,
      default: 'hover',
    },
    getPopupContainer: {
      type: Function as PropType<MenuProps['getPopupContainer']>,
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
    /**
     * 语义化槽位（Issue #22.6）：`root / list / item / itemTitle / itemIcon / itemContent`
     * + 嵌套的 `popup` / `subMenu`。
     *
     * ⚠️ 必须**显式声明成 prop**：本组件 `inheritAttrs: false`，漏声明会被静默丢弃
     * （类型合法但运行不生效 —— 正是 #22.6 的症状）。
     */
    classNames: {
      type: Object as PropType<MenuProps['classNames']>,
      default: undefined,
    },
    styles: { type: Object as PropType<MenuProps['styles']>, default: undefined },
  },
  emits: {
    'update:selectedKeys': (_keys: string[]) => true,
    'update:openKeys': (_keys: string[]) => true,
    click: (_info: MenuInfo) => true,
    select: (_info: SelectInfo) => true,
    deselect: (_info: SelectInfo) => true,
    openChange: (_keys: string[]) => true,
  },
  setup(props, { emit, expose, attrs, slots }) {
    // rc OverrideProvider（dropdown 等包装者）的覆盖通道
    const override = inject<MenuOverrideData | null>(menuOverrideKey, null);
    const menuConfig = useComponentConfig<
      ComponentStyleConfig & Pick<MenuProps, 'classNames' | 'styles'>
    >('menu');
    const disabled = useDisabled(() => props.disabled);
    const theme = useMenuTheme();
    // antd menu.js:76：`getPrefixCls('menu', customizePrefixCls || overrideObj.prefixCls)`
    const prefixCls = computed(() =>
      menuConfig.getPrefixCls('menu', props.prefixCls || override?.prefixCls),
    );
    // antd menu.js:65：motion 类名前缀取自**根前缀**（默认 `apollo`），不是 `apollo-menu`。
    const rootPrefixCls = computed(() => menuConfig.getPrefixCls());
    const instanceId = useId();
    const menuId = computed(() => props.id ?? `apollo-menu-${instanceId}`);
    const containerRef = shallowRef<HTMLUListElement | null>(null);
    /**
     * 横向 Overflow 当前可见项数量。
     *
     * ⚠️ 必须在 setup 期创建：原先写在 render 函数体内，每次重渲染都重置为 0，
     * 而 `onVisibleChange` 是本轮渲染后才写它 ⇒ 后续渲染期间 `overflowDisabled`
     * 判定拿到的永远是 0（溢出区子项会被误当成可见项，出现重复/错位）。
     */
    const overflowIndex = ref(0);

    // ====================== Semantic ======================
    // Issue #22.6：`classNames` / `styles` 此前只在 interface 里声明、运行时零消费
    // （`inheritAttrs: false` ⇒ 传进来被静默丢弃）。这里按 antd menu.tsx 的槽位合并：
    // `root / list / item / itemTitle / itemIcon / itemContent` + 嵌套 `popup` / `subMenu`。
    // ⚠️ 第四参 schema 是**必需**的：`classNames.popup = 'x'`（字符串）要落到
    //    `popup.root`，否则会被无 schema 路径当成对象递归（`Object.keys('x')`）。
    const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
      MenuProps,
      NonNullable<MenuProps['classNames']>,
      NonNullable<MenuProps['styles']>
    >(
      [() => menuConfig.classNames, () => props.classNames],
      [() => menuConfig.styles, () => props.styles],
      () => props,
      {
        popup: { _default: 'root' },
        subMenu: { _default: 'root' },
      },
    );

    const parsedNodes = computed<ParsedNode[]>(() => parseItems(props.items));

    // ⚠️ Sider 联动（Issue #32.1）：上游 Menu 用 `SiderContext.siderCollapsed` 作为
    //    `inlineCollapsed` 的**回退源** ⇒ 侧栏折叠时导航自动进入 inline-collapsed。
    //    之前本仓只读 `props.inlineCollapsed` ⇒ 宽度变了、导航不折叠。
    const siderContext = useSiderContext();
    // rc：只有 inline / vertical 才消费 inlineCollapsed（horizontal 的收起由 Overflow 负责）。
    const mergedInlineCollapsed = computed(() => {
      if (props.mode !== 'inline' && props.mode !== 'vertical') return false;
      return props.inlineCollapsed ?? siderContext.siderCollapsed?.value ?? false;
    });
    const mergedMode = computed<MenuMode>(
      () => override?.mode ?? (mergedInlineCollapsed.value ? 'vertical' : props.mode),
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
    const mergedOpenKeys = computed<string[]>(() => mergedOpenKeysValue.value ?? []);

    const triggerOpenKeys = (keys: string[]): void => {
      setOpenKeys(keys);
      emit('openChange', keys);
    };

    // rc `Menu.js` 的 inlineCacheOpenKeys：折叠时清空 openKeys（弹层只由 hover 开），
    // 展开时回放折叠前的展开项。缺了这段时「折叠前已展开的 key」会一直留在
    // openKeys 里，mode 变成 vertical 后 popup 立刻常驻（且其定位在旧的 hidden
    // 状态上），表现为「鼠标一离开就收起 / 菜单看起来坏了」。
    const inlineCacheOpenKeys = ref<string[]>(mergedOpenKeys.value);
    watch(mergedOpenKeys, (keys) => {
      if (mergedMode.value === 'inline') inlineCacheOpenKeys.value = keys;
    });
    watch(mergedMode, (mode) => {
      if (mode === 'inline') {
        triggerOpenKeys(inlineCacheOpenKeys.value);
      } else {
        triggerOpenKeys([]);
      }
    });

    // ====================== Active =======================
    const [activeKey, setActiveKey] = useControlledValue<string | undefined>({
      defaultValue: undefined,
      getValue: () => props.activeKey,
    });
    const onActive = (key: string): void => setActiveKey(key);
    const onInactive = (key: string): void => {
      if (activeKey.value === key) setActiveKey(undefined);
    };

    // ===================== Selection =====================
    // ⚠️ antd menu.js:85：`selectable ?? overrideObj.selectable` —— **props 优先**，
    //    override 只是兜底（Dropdown override 的 selectable=false 不应盖掉
    //    Table 过滤菜单显式传的 selectable=true）；props 未给时默认 true。
    const mergedSelectable = computed(() => props.selectable ?? override?.selectable ?? true);
    const triggerSelection = (info: MenuInfo): void => {
      if (mergedSelectable.value) {
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
        if (props.multiple && exist) emit('deselect', selectInfo);
        else emit('select', selectInfo);
      }
      // Whatever selectable, always close it（非 inline）
      if (!props.multiple && mergedOpenKeys.value.length && mergedMode.value !== 'inline') {
        triggerOpenKeys([]);
      }
    };

    const onInternalClick = (info: MenuInfo): void => {
      override?.onClick?.();
      emit('click', info);
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
    // ⚠️ rc `Menu.js:104`：`isRtl = direction === 'rtl'` —— 写死 false 会让左右键
    //    导航、箭头与 popup 方向全部失效（Issue #22.5）。
    const direction = useDirection();
    const isRtl = computed(() => direction.value === 'rtl');
    const onInternalKeyDown = useAccessibility({
      mode: mergedMode,
      activeKey,
      isRtl,
      id: menuId,
      containerRef,
      getKeys,
      getKeyPath,
      onActive,
      triggerOpen: triggerAccessibilityOpen,
    });

    // ====================== Context ======================
    /**
     * 子菜单弹层的关闭计时器登记表。
     *
     * 嵌套弹层 Teleport 到 body：指针从父弹层移入三级弹层时，父弹层会收到
     * mouseleave 并启动关闭计时器。进入后代弹层时取消**祖先**的计时器即可，
     * 兄弟弹层不互相取消（父层该收仍然收）。见 SubMenu 的 onPopupMouseEnter。
     */
    const popupCloseCancelers = new Map<() => void, () => string[]>();
    const registerPopupClose = (path: () => string[], cancel: () => void): (() => void) => {
      popupCloseCancelers.set(cancel, path);
      return () => {
        popupCloseCancelers.delete(cancel);
      };
    };
    const cancelAncestorPopupClose = (keyPath: string[]): void => {
      const isPrefix = (prefix: string[]): boolean =>
        prefix.length <= keyPath.length && prefix.every((key, index) => keyPath[index] === key);
      for (const [cancel, path] of popupCloseCancelers) {
        if (isPrefix(path())) cancel();
      }
    };

    const mounted = ref(false);
    onMounted(() => {
      mounted.value = true;
    });
    const menuContext: MenuContextData = {
      mounted,
      get prefixCls() {
        return prefixCls.value;
      },
      get rootPrefixCls() {
        return rootPrefixCls.value;
      },
      get menuId() {
        return menuId.value;
      },
      mode: mergedMode,
      get disabled() {
        return disabled.value;
      },
      activeKey,
      onActive,
      onInactive,
      selectedKeys: mergedSelectKeys,
      // ⚠️ 以下是 **getter**：context 对象在 setup 里只建一次，写成普通值就是快照 ⇒
      //    运行时改 `disabled`/`inlineIndent`/延迟/`collapsed`/`theme` 等配置，
      //    MenuItem / SubMenu 完全感知不到（Issue #22.7）。getter 让消费处在
      //    渲染/computed 里读到最新值并被追踪（与 table 的 ctx getter 同判）。
      get inlineIndent() {
        return props.inlineIndent;
      },
      get subMenuOpenDelay() {
        return props.subMenuOpenDelay;
      },
      get subMenuCloseDelay() {
        return props.subMenuCloseDelay;
      },
      get forceSubMenuRender() {
        return props.forceSubMenuRender;
      },
      get triggerSubMenuAction() {
        return props.triggerSubMenuAction;
      },
      get getPopupContainer() {
        // antd useComponentConfig('menu') 的 getPopupContainer 是 props 未传时的回退；
        // 默认再回落到 ConfigProvider 顶层（antd `getPopupContainer` 契约）。
        return props.getPopupContainer ?? menuConfig.getPopupContainer;
      },
      motion: null,
      defaultMotions: null,
      onItemClick: onInternalClick,
      onOpenChange: onInternalOpenChange,
      openKeys: mergedOpenKeys,
      renderNode,
      registerPopupClose,
      cancelAncestorPopupClose,
      get inlineCollapsed() {
        return mergedInlineCollapsed.value;
      },
      get tooltip() {
        return props.tooltip;
      },
      firstLevel: true,
      get theme() {
        return props.theme;
      },
      get expandIcon() {
        return override?.expandIcon;
      },
      get direction() {
        return direction.value;
      },
      get renderExpandIcon() {
        return slots.expandIcon;
      },
      // 语义槽（Issue #22.6）：computed 直接下发，子组件在渲染里读 ⇒ 响应式
      semanticClassNames: mergedClassNames,
      semanticStyles: mergedStyles,
    };
    provide(menuContextKey, menuContext);
    provide(isSubPathKeyKey, isSubPathKey);
    // 可见子树的 keyPath 根
    provide(
      pathTrackerKey,
      computed<string[]>(() => []),
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
    const publicApi: MenuRef = {
      get list() {
        return containerRef.value;
      },
      focus: (options?: FocusOptions) => {
        const first = containerRef.value?.querySelector<HTMLElement>(
          '[data-menu-id]:not([aria-disabled="true"]):not([aria-hidden="true"])',
        );
        first?.focus(options);
      },
      findItem: ({ key }) => {
        const id = getMenuId(menuId.value, key);
        return (
          [
            ...(containerRef.value?.ownerDocument.querySelectorAll<HTMLElement>('[data-menu-id]') ??
              []),
          ].find((element) => element.getAttribute('data-menu-id') === id) ?? null
        );
      },
    };
    expose(publicApi);

    // ====================== Render =======================
    /**
     * items 数据项上允许落到 `li` 的 DOM/ARIA 键（rc：`parseItems` 的 restProps 原样进
     * MenuItem ⇒ `id`/`role`/`aria-*` 都能表达；antd 的 Tabs 溢出下拉就靠
     * `<MenuItem role="option" aria-controls=...>` 把菜单当 listbox 用 —— Issue #22.4）。
     * ⚠️ 只放纯 DOM 语义的键：`tabindex` / `data-menu-id` / 事件仍由 MenuItem 决定。
     */
    /** 规范节点 → vnode（可见/measure 两棵子树共用）。 */
    function renderNode(
      node: ParsedNode,
      keyPath: string[],
      overflowDisabled = false,
      overflowCls?: string,
    ): VNodeChild {
      const eventKey = node.key;
      const childPath = [...keyPath, eventKey];
      switch (node.kind) {
        case 'item':
          return h(
            MenuItem,
            {
              id: node.id,
              role: node.role,
              'aria-controls': node['aria-controls'],
              'aria-expanded': node['aria-expanded'],
              'aria-haspopup': node['aria-haspopup'],
              'aria-label': node['aria-label'],
              'aria-describedby': node['aria-describedby'],
              key: eventKey,
              eventKey,
              disabled: node.disabled,
              danger: node.danger,
              // title/extra 经 slot 下发（items 的 VNodeChild 富内容；C8-R2）
              title: typeof node.title === 'string' ? node.title : undefined,
              labelText: typeof node.label === 'string' ? node.label : undefined,
              overflowDisabled,
              overflowCls,
              itemData: node,
              onClick: node.onClick,
              onMouseEnter: node.onMouseEnter,
              onMouseLeave: node.onMouseLeave,
            },
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
              // antd SubMenuType.theme：该子菜单弹层独立主题（不改变根主题）
              theme: node.theme,
              // title 经 slot 下发（items 的 VNodeChild 富内容；C8-R2）
              title: node.title ?? (typeof node.label === 'string' ? node.label : undefined),
              popupClassName: normalizeClass([node.rootClassName, node.popupClassName]),
              popupOffset: node.popupOffset,
              popupStyle: node.popupStyle,
              overflowDisabled,
              overflowCls,
              childrenNodes: node.children,
              itemData: node,
              onMouseEnter: node.onMouseEnter,
              onMouseLeave: node.onMouseLeave,
              onTitleClick: node.onTitleClick,
              onTitleMouseEnter: node.onTitleMouseEnter,
              onTitleMouseLeave: node.onTitleMouseLeave,
              onClick: node.onClick,
            },
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
            { key: eventKey, eventKey, label: node.label },
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

      // ---- 可见子树 ----
      // menu root 的公共 attrs（horizontal 时由 Overflow 直接渲染 root ul ——
      // rc 的 Overflow component='ul' 同构；ul > div > li 会破坏 menu 的 DOM 语义）
      // `aria-*` 从 attrs 放行（与 rc-menu 的 `...restProps` 同判）：
      // 溢出下拉要用 `aria-activedescendant` / `aria-label`。
      const { class: nativeClass, style: nativeStyle, ...nativeAttrs } = attrs;
      const rootAttrs = mergeProps(nativeAttrs, {
        'data-menu-list': true,
        role: props.role,
        tabindex: attrs.tabindex ?? props.tabIndex,
        id: props.id,
        style: [
          theme.style.value,
          menuConfig.style,
          mergedStyles.value.root,
          mergedStyles.value.list,
          nativeStyle,
        ],
        class: [
          prefixCls.value,
          `${prefixCls.value}-root`,
          `${prefixCls.value}-${mergedMode.value}`,
          `${prefixCls.value}-${props.theme}`,
          mergedInlineCollapsed.value ? `${prefixCls.value}-inline-collapsed` : undefined,
          isRtl.value ? `${prefixCls.value}-rtl` : undefined,
          menuConfig.className,
          mergedClassNames.value.root,
          mergedClassNames.value.list,
          nativeClass,
        ],
        dir: direction.value,
        onKeydown: onInternalKeyDown,
      });

      const { class: overflowClass, ...overflowAttrs } = rootAttrs;
      const container = useOverflow
        ? h(Overflow, {
            key: 'overflow',
            prefixCls: `${prefixCls.value}-overflow`,
            component: 'ul',
            ...overflowAttrs,
            // Overflow has one native ul root; normalize the actual Vue component ref at this boundary.
            ref: (value: Element | ComponentPublicInstance | null) => {
              const element = value && '$el' in value ? value.$el : value;
              containerRef.value = element instanceof HTMLUListElement ? element : null;
            },
            className: normalizeClass(overflowClass),
            ssr: 'full',
            data: parsedNodes.value,
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
                `${prefixCls.value}-overflow-item`,
              ),
            renderRawRest: (omittedItems: unknown[]) =>
              h(
                SubMenu,
                {
                  key: OVERFLOW_KEY,
                  eventKey: OVERFLOW_KEY,
                  // ⚠️ rc `Menu.js:361-371`：省略项**作为 children 进子菜单**，
                  //    `internalPopupClose = len === 0`。原来写死 `true` + 空 children
                  //    ⇒ 「更多」永远是个空菜单（Issue #22.3）。
                  internalPopupClose: omittedItems.length === 0,
                  childrenNodes: omittedItems as ParsedNode[],
                },
                // 溢出「更多」指示：程序化 VNode ⇒ 走 #title slot（C8-R2）
                { title: () => h(EllipsisOutlined) },
              ),
          })
        : h('ul', { ...rootAttrs, ref: containerRef }, renderList());

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
