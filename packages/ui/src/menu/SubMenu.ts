/**
 * SubMenu —— rc-menu `SubMenu/index.js` 的 Vue 版。
 *
 * 结构（rc 逐条）：
 *   li[role=none].{p}-submenu.{p}-submenu-{mode}
 *     ├─ div.{p}-submenu-title[aria-expanded/haspopup/controls]
 *     │    ├─ span.{p}-item-icon（有 icon 时，必须在标题文字之前）
 *     │    ├─ span.{p}-title-content
 *     │    └─ i.{p}-submenu-arrow / expand-icon
 *     ├─ popup（horizontal/vertical）：由内部 Trigger 负责 portal / 定位 / 翻转 / 进出场
 *     └─ inline：展开列表（点击或键盘切换）
 *
 * ⚠️ 三条行为判据（2026-10-22 专项审计修正）：
 *   1. **inline 模式不参与 hover**：只有 click/keyboard 修改 openKeys。
 *      原来 title 的 mouseleave 会在指针移入子项时启动 100ms 关闭计时器，
 *      导致「展开 → 移到 Option → 子菜单自己收起」。
 *   2. title 与 li 的事件语义分离：title 负责 active（以及非 inline 的 hover 开合），
 *      li 只维护 childrenActive 与用户 onMouseEnter/onMouseLeave，不重复起计时器。
 *   3. 弹层几何/进出场**复用 `_internal/trigger`**（portal + position + motion），
 *      不再手写 getBoundingClientRect + 双 rAF 的简化定位。
 */

import {
  cloneVNode,
  computed,
  defineComponent,
  h,
  inject,
  isVNode,
  mergeProps,
  normalizeClass,
  onUnmounted,
  type PropType,
  provide,
  ref,
  type SlotsType,
  Text,
  type VNode,
  type VNodeChild,
  watch,
} from 'vue';

import type { TriggerAlign } from '../_internal/trigger';
import { useMergeSemantic } from '../_internal/use-merge-semantic';
import {
  inheritMenuContext,
  isSubPathKeyKey,
  type MenuContextData,
  menuContextKey,
  pathTrackerKey,
  useFullPath,
  useMeasure,
  useMenuContext,
  usePathRegister,
} from './context';
import type { ParsedNode } from './engine/parse-items';
import { getMenuId } from './engine/use-accessibility';
import InlineSubMenuList from './InlineSubMenuList';
import type {
  MenuInfo,
  MenuSubMenuSlots,
  MenuTheme,
  SubMenuSemanticType,
  SubMenuType,
} from './interface';
import PopupTrigger from './PopupTrigger';
import { useMenuTheme } from './use-menu-theme';

/**
 * rc `@rc-component/menu/es/placements.js` 的 8 个 placement。
 * 菜单弹层没有箭头，overflow 只做翻转（adjustX/adjustY），不做平移。
 */
const AUTO_ADJUST_OVERFLOW = { adjustX: 1, adjustY: 1 };
const MENU_PLACEMENTS: Record<string, TriggerAlign> = {
  topLeft: { points: ['bl', 'tl'], overflow: AUTO_ADJUST_OVERFLOW },
  topRight: { points: ['br', 'tr'], overflow: AUTO_ADJUST_OVERFLOW },
  bottomLeft: { points: ['tl', 'bl'], overflow: AUTO_ADJUST_OVERFLOW },
  bottomRight: { points: ['tr', 'br'], overflow: AUTO_ADJUST_OVERFLOW },
  leftTop: { points: ['tr', 'tl'], overflow: AUTO_ADJUST_OVERFLOW },
  leftBottom: { points: ['br', 'bl'], overflow: AUTO_ADJUST_OVERFLOW },
  rightTop: { points: ['tl', 'tr'], overflow: AUTO_ADJUST_OVERFLOW },
  rightBottom: { points: ['bl', 'br'], overflow: AUTO_ADJUST_OVERFLOW },
};
const MENU_PLACEMENTS_RTL: Record<string, TriggerAlign> = {
  topLeft: { points: ['bl', 'tl'], overflow: AUTO_ADJUST_OVERFLOW },
  topRight: { points: ['br', 'tr'], overflow: AUTO_ADJUST_OVERFLOW },
  bottomLeft: { points: ['tl', 'bl'], overflow: AUTO_ADJUST_OVERFLOW },
  bottomRight: { points: ['tr', 'br'], overflow: AUTO_ADJUST_OVERFLOW },
  rightTop: { points: ['tr', 'tl'], overflow: AUTO_ADJUST_OVERFLOW },
  rightBottom: { points: ['br', 'bl'], overflow: AUTO_ADJUST_OVERFLOW },
  leftTop: { points: ['tl', 'tr'], overflow: AUTO_ADJUST_OVERFLOW },
  leftBottom: { points: ['bl', 'br'], overflow: AUTO_ADJUST_OVERFLOW },
};

const SubMenu = defineComponent({
  name: 'AMenuSubMenu',
  // 根 li 显式合并 attrs（class/style/其他属性）；默认继承会让 class 被应用两次。
  inheritAttrs: false,
  slots: Object as SlotsType<MenuSubMenuSlots>,
  props: {
    eventKey: { type: String, default: undefined },
    /** 文本主导：收窄 String；富内容走 #title slot（优先于 prop）。 */
    title: { type: String, default: undefined },
    disabled: { type: Boolean, default: false },
    danger: { type: Boolean, default: false },
    /** 该弹层的独立主题（antd SubMenuType.theme）。 */
    theme: { type: String as PropType<MenuTheme>, default: undefined },
    popupClassName: { type: String, default: undefined },
    popupOffset: {
      type: Object as PropType<[number, number]>,
      validator: (value: unknown) =>
        Array.isArray(value) &&
        value.length === 2 &&
        typeof value[0] === 'number' &&
        typeof value[1] === 'number',
      default: undefined,
    },
    popupStyle: {
      type: Object as PropType<SubMenuType['popupStyle']>,
      default: undefined,
    },
    overflowDisabled: { type: Boolean, default: false },
    overflowCls: { type: String, default: undefined },
    internalPopupClose: { type: Boolean, default: false },
    /** items 模式：子节点由 Menu 解析后经 props 下发（Vue 无 cloneElement）。 */
    childrenNodes: { type: Array as PropType<ParsedNode[]>, default: () => [] },
    itemData: { type: Object as PropType<SubMenuType & { key: string }>, default: undefined },
  },
  emits: {
    mouseEnter: (_info: { key: string; domEvent: MouseEvent }) => true,
    mouseLeave: (_info: { key: string; domEvent: MouseEvent }) => true,
    titleMouseEnter: (_info: { key: string; domEvent: MouseEvent }) => true,
    titleMouseLeave: (_info: { key: string; domEvent: MouseEvent }) => true,
    titleClick: (_info: { key: string; domEvent: MouseEvent }) => true,
    click: (_info: MenuInfo) => true,
  },
  setup(props, { attrs, slots, emit }) {
    const measure = useMeasure();
    const connectedPath = useFullPath(props.eventKey);

    if (measure) {
      // ⚠️ 登记与注销必须对称（Issue #22.8），见 `usePathRegister` 的注释。
      usePathRegister(measure, props.eventKey, connectedPath);
      // rc SubMenu 的 measure 分支返回 **childList**（不是 null）：子项（含嵌套
      // SubMenu）必须继续挂载，才能把 `sub1 >>> child` 这类完整路径登记进
      // useKeyRecords。只登记自身会让 `isSubPathKey` 永远查不到子项 ⇒ 选中子项后
      // 父级 `.apollo-menu-submenu-selected` 不出现（2026-10-21 修复）。
      // PathTrackerContext 同样必须提供，否则嵌套层级会被拍平。
      provide(pathTrackerKey, connectedPath);
      const ctx = useMenuContext();
      return () => props.childrenNodes.map((node) => ctx.renderNode(node, connectedPath.value));
    }

    const ctx = useMenuContext();
    // 子级 context 继承（rc InheritableContextProvider：popup 内容恒 vertical）
    const subCtx: MenuContextData = inheritMenuContext(ctx, {
      mode: computed(() => (ctx.mode.value === 'horizontal' ? 'vertical' : ctx.mode.value)),
      firstLevel: false,
      overflowDisabled: false,
      get theme() {
        return props.theme ?? ctx.theme;
      },
      get itemIcon() {
        return props.itemData?.itemIcon ?? ctx.itemIcon;
      },
      onItemClick: (info) => {
        emit('click', info);
        ctx.onItemClick(info);
      },
    });
    provide(menuContextKey, subCtx);
    // 子项 keyPath = [...connectedPath, childKey]（rc PathTrackerContext 同构）
    provide(pathTrackerKey, connectedPath);

    const theme = useMenuTheme();
    const semantic = useMergeSemantic<
      SubMenuType,
      NonNullable<SubMenuSemanticType['classNames']>,
      NonNullable<SubMenuSemanticType['styles']>
    >(
      [() => ctx.semanticClassNames?.value, () => ctx.semanticClassNames?.value.subMenu],
      [() => ctx.semanticStyles?.value, () => ctx.semanticStyles?.value.subMenu],
      () => props.itemData ?? { key: props.eventKey, children: [] },
    );
    const mergedDisabled = computed(() => ctx.disabled || props.disabled);
    const originOpen = computed(() => ctx.openKeys.value.includes(props.eventKey ?? ''));
    const open = computed(
      () => !props.overflowDisabled && !props.internalPopupClose && originOpen.value,
    );
    const directActive = computed(
      () => ctx.activeKey.value === props.eventKey && !mergedDisabled.value,
    );
    const isSubPathKey = inject(isSubPathKeyKey, null);
    // rc：childrenSelected = selectedKeys 中某项的祖先路径含本 key
    const childrenSelected = computed(
      () => isSubPathKey?.(ctx.selectedKeys.value, props.eventKey ?? '') ?? false,
    );
    // rc 的 childrenActive：非 inline 时指针停在弹层/子项区域也算 active。
    const childrenActive = ref(false);
    const mergedActive = computed(() => {
      if (directActive.value) return true;
      if (ctx.mode.value === 'inline') return false;
      if (childrenActive.value) return true;
      return (
        isSubPathKey?.(ctx.activeKey.value ? [ctx.activeKey.value] : [], props.eventKey ?? '') ??
        false
      );
    });

    // ---------------------- popup（Trigger） ----------------------
    const isRtl = computed(() => ctx.direction === 'rtl');
    const mergedTheme = computed(() => props.theme ?? ctx.theme);
    const popupPlacement = computed(() => {
      if (ctx.mode.value === 'horizontal') return 'bottomLeft';
      return isRtl.value ? 'leftTop' : 'rightTop';
    });
    const builtinPlacements = computed(() => (isRtl.value ? MENU_PLACEMENTS_RTL : MENU_PLACEMENTS));
    const popupAlign = computed<TriggerAlign | undefined>(() =>
      props.popupOffset ? { offset: props.popupOffset } : undefined,
    );
    /**
     * antd menu.js:109 的 defaultMotions：
     *   horizontal → `{rootPrefixCls}-slide-up`；其余（vertical / 折叠）→ `{rootPrefixCls}-zoom-big`。
     * inline 不渲染 popup，因此只在这两种形态下生效。
     */
    const popupMotion = computed(() => ({
      motionName: `${ctx.rootPrefixCls}-${
        ctx.mode.value === 'horizontal' ? 'slide-up' : 'zoom-big'
      }`,
    }));
    const popupOpen = computed(
      () =>
        ctx.mode.value !== 'inline' &&
        !props.overflowDisabled &&
        !props.internalPopupClose &&
        originOpen.value,
    );

    // ---------------- hover / click 开合（rc PopupTrigger 的计时器语义） ------------
    let openTimer: ReturnType<typeof setTimeout> | null = null;
    let closeTimer: ReturnType<typeof setTimeout> | null = null;
    const clearTimers = (): void => {
      if (openTimer) clearTimeout(openTimer);
      if (closeTimer) clearTimeout(closeTimer);
      openTimer = null;
      closeTimer = null;
    };
    watch(
      () => [
        ctx.mode.value,
        mergedDisabled.value,
        ctx.triggerSubMenuAction,
        props.overflowDisabled,
      ],
      clearTimers,
    );
    onUnmounted(clearTimers);
    /**
     * ⭐ inline 模式**只**通过 click / 键盘展开（rc `onPopupVisibleChange` 的
     * `if (mode !== 'inline')` 判据）。这是 M-03 的根因判据，不要退回「看
     * triggerSubMenuAction 不看 mode」。
     */
    const canHoverToggle = (): boolean =>
      ctx.mode.value !== 'inline' &&
      ctx.triggerSubMenuAction === 'hover' &&
      !props.overflowDisabled;

    const onTitleMouseEnter = (e: MouseEvent): void => {
      clearTimers();
      if (canHoverToggle() && !mergedDisabled.value) {
        openTimer = setTimeout(
          () => ctx.onOpenChange(props.eventKey ?? '', true),
          ctx.subMenuOpenDelay * 1000,
        );
      }
      if (!mergedDisabled.value) ctx.onActive(props.eventKey ?? '');
      emit('titleMouseEnter', { key: props.eventKey ?? '', domEvent: e });
    };
    const onTitleMouseLeave = (e: MouseEvent): void => {
      clearTimers();
      if (canHoverToggle()) {
        closeTimer = setTimeout(
          () => ctx.onOpenChange(props.eventKey ?? '', false),
          ctx.subMenuCloseDelay * 1000,
        );
      }
      ctx.onInactive(props.eventKey ?? '');
      emit('titleMouseLeave', { key: props.eventKey ?? '', domEvent: e });
    };
    const onInternalTitleClick = (e: MouseEvent): void => {
      if (mergedDisabled.value) return;
      emit('titleClick', { key: props.eventKey ?? '', domEvent: e });
      // rc：只有 inline 由 click 切换；非 inline 的 click 触发由 Trigger 的
      // `action: ['click']` 负责（overflowDisabled 时没有 Trigger，也不切换）。
      if (props.overflowDisabled) return;
      if (ctx.mode.value === 'inline' || ctx.triggerSubMenuAction === 'click') {
        ctx.onOpenChange(props.eventKey ?? '', !originOpen.value);
      }
    };
    /**
     * 弹层 hover 的跨层级联动。
     *
     * 嵌套弹层 Teleport 到 body，DOM 上并不在父弹层里：从父弹层移入三级弹层时，
     * 父弹层先收到 mouseleave，若照常启动 closeTimer，100ms 后父弹层连同三级弹层
     * 一起消失（真实浏览器复现）。进入**后代**弹层时，取消所有祖先弹层的关闭计时器；
     * 兄弟弹层不会互相取消，父层该收仍然收。
     */
    const onPopupMouseEnter = (): void => {
      ctx.cancelAncestorPopupClose?.(connectedPath.value);
      clearTimers();
    };
    const onPopupMouseLeave = (): void => {
      clearTimers();
      if (canHoverToggle()) {
        closeTimer = setTimeout(
          () => ctx.onOpenChange(props.eventKey ?? '', false),
          ctx.subMenuCloseDelay * 1000,
        );
      }
    };
    // 登记「取消本层关闭计时器」的句柄（Menu 在任意后代弹层 mouseenter 时调用）。
    onUnmounted(ctx.registerPopupClose?.(() => connectedPath.value, clearTimers) ?? (() => {}));

    const renderChildren = (): VNodeChild[] =>
      props.childrenNodes.map((node) => ctx.renderNode(node, connectedPath.value));

    return () => {
      const { class: nativeClass, style: nativeStyle, ...nativeAttrs } = attrs;
      const eventKey = props.eventKey ?? '';
      const subMenuPrefixCls = `${ctx.prefixCls}-submenu`;
      const popupId = getMenuId(ctx.menuId, `${eventKey}-popup`);
      const mode = ctx.mode.value;
      const isInline = mode === 'inline';

      const itemClsOf = semantic.classNames.value;
      const itemStyleOf = semantic.styles.value;
      const popupSemCls = ctx.semanticClassNames?.value.popup ?? {};
      const popupSemStyle = ctx.semanticStyles?.value.popup ?? {};
      const iconInfo = {
        isSelected: childrenSelected.value,
        isOpen: open.value,
        isSubMenu: true,
        disabled: mergedDisabled.value,
      };
      const icon = props.itemData?.icon ?? props.itemData?.itemIcon ?? ctx.itemIcon;
      const hasIcon = slots.icon !== undefined || icon != null;
      const iconContent = slots.icon
        ? slots.icon(iconInfo)
        : typeof icon === 'function'
          ? icon(iconInfo)
          : icon;
      const expandIcon =
        props.itemData?.expandIcon !== undefined ? props.itemData.expandIcon : ctx.expandIcon;
      const customExpandIcon =
        slots.expandIcon ??
        (props.itemData?.expandIcon === undefined ? ctx.renderExpandIcon : undefined);
      const hasExpandIcon = customExpandIcon !== undefined || expandIcon !== undefined;
      const expandContent = customExpandIcon
        ? customExpandIcon(iconInfo)
        : typeof expandIcon === 'function'
          ? expandIcon(iconInfo)
          : expandIcon;
      const titleNodes = slots.title?.();
      const single =
        Array.isArray(titleNodes) && titleNodes.length === 1 ? titleNodes[0] : undefined;
      const rawTitle =
        single && isVNode(single) && single.type === Text && typeof single.children === 'string'
          ? single.children
          : (single ?? titleNodes ?? props.title);
      const titleContent =
        ctx.inlineCollapsed && !hasIcon && typeof rawTitle === 'string'
          ? h('div', { class: `${ctx.prefixCls}-inline-collapsed-noicon` }, rawTitle.charAt(0))
          : isVNode(rawTitle)
            ? cloneVNode(rawTitle, { class: itemClsOf.itemContent, style: itemStyleOf.itemContent })
            : h(
                'span',
                {
                  class: [`${ctx.prefixCls}-title-content`, itemClsOf.itemContent],
                  style: itemStyleOf.itemContent,
                },
                [rawTitle],
              );

      /** rc `@rc-component/menu` 的 Icon：图标必须在标题文字之前（CSS 依赖 `+ span`）。 */
      const iconNode = hasIcon
        ? h(
            'span',
            {
              class: [`${ctx.prefixCls}-item-icon`, itemClsOf.itemIcon],
              style: itemStyleOf.itemIcon,
            },
            [iconContent],
          )
        : null;

      const titleNode = h(
        'div',
        {
          // rc useDirectionStyle：仅 inline 模式缩进（vertical 的弹出子菜单无内联缩进）
          style: [
            mode === 'inline'
              ? { paddingLeft: `${connectedPath.value.length * ctx.inlineIndent}px` }
              : undefined,
            itemStyleOf.itemTitle,
          ],
          class: [`${subMenuPrefixCls}-title`, itemClsOf.itemTitle],
          role: 'menuitem',
          'data-menu-id': props.overflowDisabled ? undefined : getMenuId(ctx.menuId, eventKey),
          tabindex: mergedDisabled.value ? undefined : -1,
          'aria-expanded': open.value,
          'aria-haspopup': true,
          'aria-controls': popupId,
          'aria-disabled': mergedDisabled.value ? true : undefined,
          onFocus: () => {
            if (!mergedDisabled.value) ctx.onActive(eventKey);
          },
          onClick: onInternalTitleClick,
          onMouseenter: onTitleMouseEnter,
          onMouseleave: onTitleMouseLeave,
        },
        [
          iconNode,
          titleContent,
          // rc：expandIcon 覆盖（dropdown 的 OverrideProvider 注入 arrow icon）
          hasExpandIcon
            ? h(
                'span',
                {
                  class: [`${subMenuPrefixCls}-expand-icon`, itemClsOf.itemIcon],
                  style: itemStyleOf.itemIcon,
                },
                [expandContent],
              )
            : h('i', { class: `${subMenuPrefixCls}-arrow` }),
        ].filter((n) => n !== null && n !== undefined),
      );

      /** popup 内容：外层 Trigger 负责 portal / 定位 / 动画，这里只负责列表本身。 */
      const renderPopupContent = (): VNode =>
        h(
          'ul',
          {
            id: popupId,
            // 🚨 必须带 mode 类（`{p}-vertical`）：item 的尺寸/内边距/行高规则
            //    都挂在 `.apollo-menu-{mode} .apollo-menu-item` 下，缺了它
            //    popup 里的 li 全是 0 高。horizontal 的子菜单弹出来也是**竖直列表**。
            class: [
              ctx.prefixCls,
              `${ctx.prefixCls}-sub`,
              `${ctx.prefixCls}-${mode === 'horizontal' ? 'vertical' : mode}`,
              itemClsOf.list,
            ],
            style: [theme.style.value, itemStyleOf.list],
            role: 'menu',
            'data-menu-list': true,
            onMouseenter: onPopupMouseEnter,
            onMouseleave: onPopupMouseLeave,
          },
          renderChildren(),
        );

      // popup 走 Trigger（rc PopupTrigger 的 Trigger 语义）：portal / 定位 / 翻转 /
      // 进出场全部复用 `_internal/trigger`，DOM 不进 menu 的 ul 子树。
      // overflowDisabled ⇒ 上游不渲染 PopupTrigger（溢出区子项只做测量/展示）。
      const wrappedTitle =
        !isInline && !props.overflowDisabled
          ? h(
              PopupTrigger,
              {
                prefixCls: subMenuPrefixCls,
                popup: renderPopupContent,
                open: popupOpen.value,
                // 开合计时器由本组件管理（inline 判据 + 嵌套弹层取消逻辑都在这里）。
                placement: popupPlacement.value,
                builtinPlacements: builtinPlacements.value,
                popupAlign: popupAlign.value,
                popupClassName: normalizeClass([
                  `${subMenuPrefixCls}-popup`,
                  props.popupClassName,
                  `${ctx.prefixCls}-${mergedTheme.value}`,
                  isRtl.value ? `${subMenuPrefixCls}-rtl` : undefined,
                  popupSemCls.root,
                ]),
                popupStyle: {
                  ...theme.style.value,
                  ...props.popupStyle,
                  ...popupSemStyle.root,
                },
                getPopupContainer: ctx.getPopupContainer,
                motion: popupMotion.value,
                forceRender: ctx.forceSubMenuRender,
                // antd PopupTrigger：关闭后保留节点（离场动画结束由 -hidden 隐藏），
                // 这样快速 hover 重开时不会重新挂 DOM 导致 motion 丢失。
              },
              { default: () => titleNode },
            )
          : titleNode;

      const inlineListNode = h(
        InlineSubMenuList,
        {
          id: popupId,
          open: open.value,
          mode,
          depth: connectedPath.value.length,
          class: itemClsOf.list,
          style: itemStyleOf.list,
        },
        { default: renderChildren },
      );

      return h(
        'li',
        mergeProps(nativeAttrs, {
          role: 'none',
          class: [
            props.overflowCls,
            subMenuPrefixCls,
            `${subMenuPrefixCls}-${mode}`,
            open.value ? `${subMenuPrefixCls}-open` : undefined,
            mergedActive.value ? `${subMenuPrefixCls}-active` : undefined,
            childrenSelected.value ? `${subMenuPrefixCls}-selected` : undefined,
            mergedDisabled.value ? `${subMenuPrefixCls}-disabled` : undefined,
            props.danger ? `${subMenuPrefixCls}-danger` : undefined,
            itemClsOf.item,
            nativeClass,
          ],
          style: [itemStyleOf.item, nativeStyle],
          onMouseenter: (e: MouseEvent) => {
            if (!mergedDisabled.value) childrenActive.value = true;
            emit('mouseEnter', { key: eventKey, domEvent: e });
          },
          onMouseleave: (e: MouseEvent) => {
            if (!mergedDisabled.value) childrenActive.value = false;
            emit('mouseLeave', { key: eventKey, domEvent: e });
          },
        }),
        [wrappedTitle, inlineListNode].filter((n) => n !== null),
      );
    };
  },
});

export default SubMenu;
