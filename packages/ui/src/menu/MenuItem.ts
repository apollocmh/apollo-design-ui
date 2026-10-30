/**
 * MenuItem —— rc-menu `MenuItem.js`（221 行）的 Vue 版。
 *
 * 双渲染协议（rc MenuItem 函数壳）：measure 模式（PathRegister 非空）⇒ 只
 * registerPath 并渲染 null；正常模式渲染 li[role=menuitem]。Menu 主体渲染
 * 两棵子树实现（rc 的 measureChildList 同构）。
 */

import { computed, defineComponent, h, mergeProps, type PropType, type SlotsType } from 'vue';

import Tooltip from '../tooltip';
import { useFullPath, useMeasure, useMenuContext, usePathRegister } from './context';
import { ownedMenuActions } from './engine/native-actions';
import { getEventKeyCode, getMenuId, KeyCode } from './engine/use-accessibility';
import type { ItemData, MenuInfo, MenuItemSlots, MenuItemType } from './interface';

const MenuItem = defineComponent({
  name: 'AMenuItem',
  // 根 li 显式合并 attrs（restAttrs / class / style）；默认继承会把 class 应用两次。
  inheritAttrs: false,
  slots: Object as SlotsType<MenuItemSlots>,
  props: {
    eventKey: { type: String, default: undefined },
    disabled: { type: Boolean, default: false },
    danger: { type: Boolean, default: false },
    /** 文本主导：收窄 String；富内容走 #title slot（优先于 prop）。 */
    title: { type: String, default: undefined },
    /** items 的 string label（collapsed 态 noicon 首字符用；rc 的 label 判定）。 */
    labelText: { type: String, default: undefined },
    overflowDisabled: { type: Boolean, default: undefined },
    overflowCls: { type: String, default: undefined },
    // extra 为 VNode 主导 —— 已删除 prop，改 #extra slot（见 render 中 readSlot）。
    itemData: { type: Object as PropType<MenuItemType & { key: string }>, default: undefined },
  },
  emits: {
    click: (_info: MenuInfo) => true,
    mouseEnter: (_info: { key: string; domEvent: MouseEvent }) => true,
    mouseLeave: (_info: { key: string; domEvent: MouseEvent }) => true,
  },
  setup(props, { slots, attrs, emit }) {
    const mergedTitle = () => (slots.title ? slots.title() : props.title);
    const mergedExtra = () => slots.extra?.();
    const measure = useMeasure();
    const connectedKeyPath = useFullPath(props.eventKey);

    if (measure) {
      // ⚠️ 登记与注销必须对称（Issue #22.8）：动态移除 items / key 变化时，
      //    旧的 key→keyPath 映射不删会让键盘导航指向已不存在的节点。
      usePathRegister(measure, props.eventKey, connectedKeyPath);
      return () => null;
    }

    const ctx = useMenuContext();
    const isActive = computed(
      () => ctx.activeKey.value === props.eventKey && !(ctx.disabled || props.disabled),
    );
    const isSelected = computed(() => ctx.selectedKeys.value.includes(props.eventKey ?? ''));
    const mergedDisabled = computed(() => ctx.disabled || props.disabled);

    return () => {
      const eventKey = props.eventKey ?? '';
      const connectedKeys = connectedKeyPath.value;
      const itemCls = `${ctx.prefixCls}-item`;
      const children = slots.default ? slots.default() : mergedTitle();
      // 语义槽（Issue #22.6）：item / itemContent / itemIcon
      const semCls = ctx.semanticClassNames?.value ?? {};
      const semStyle = ctx.semanticStyles?.value ?? {};
      const getEventInfo = (e: Event): MenuInfo => {
        const itemData: ItemData = props.itemData ?? {
          key: eventKey,
          label: children,
          itemIcon: ctx.itemIcon,
          extra: mergedExtra(),
          title: props.title,
        };
        return {
          key: eventKey,
          // rc：Note: For legacy code is reversed which not like other antd component
          keyPath: [...connectedKeys].reverse(),
          item: null,
          domEvent: e,
          itemData,
        };
      };

      const onInternalClick = (e: MouseEvent): void => {
        if (mergedDisabled.value) return;
        const info = getEventInfo(e);
        emit('click', info);
        ctx.onItemClick(info);
      };
      const onClickCapture = (e: MouseEvent): void => {
        if (mergedDisabled.value) {
          e.preventDefault();
          e.stopPropagation();
        }
      };
      const onInternalKeyDown = (e: KeyboardEvent): void => {
        const code = getEventKeyCode(e);
        if (
          e.defaultPrevented ||
          mergedDisabled.value ||
          (code !== KeyCode.ENTER && code !== KeyCode.SPACE) ||
          e.target !== e.currentTarget ||
          !(e.currentTarget instanceof HTMLElement)
        )
          return;
        e.preventDefault();
        const controls = ownedMenuActions(e.currentTarget);
        if (controls.length === 1) {
          const control = controls[0];
          if (
            control &&
            !control.matches(':disabled') &&
            control.getAttribute('aria-disabled') !== 'true'
          )
            control.click();
          return;
        }
        const info = getEventInfo(e);
        emit('click', info);
        ctx.onItemClick(info);
      };
      const onInternalFocus = (): void => {
        ctx.onActive(eventKey);
      };
      const onInternalMouseEnter = (e: MouseEvent): void => {
        if (!mergedDisabled.value) ctx.onActive(eventKey);
        emit('mouseEnter', { key: eventKey, domEvent: e });
      };
      const onInternalMouseLeave = (e: MouseEvent): void => {
        ctx.onInactive(eventKey);
        emit('mouseLeave', { key: eventKey, domEvent: e });
      };

      const icon = props.itemData?.icon ?? props.itemData?.itemIcon ?? ctx.itemIcon;
      const info = {
        isSelected: isSelected.value,
        disabled: mergedDisabled.value,
        isSubMenu: false,
      };
      const iconNode = slots.icon
        ? slots.icon(info)
        : typeof icon === 'function'
          ? icon(info)
          : icon;
      const hasIcon = slots.icon !== undefined || icon != null;
      // rc renderItemChildren：折叠态 + firstLevel + 无 icon + 字符串 label ⇒
      // 渲染首字符的 {p}-inline-collapsed-noicon 块
      const collapsedNoIcon =
        ctx.inlineCollapsed && ctx.firstLevel && !hasIcon && props.labelText
          ? props.labelText.charAt(0)
          : null;

      // ⚠️ `role` 可被覆盖（与 rc 的 `role: role === null ? 'none' : role || 'menuitem'` 同判）。
      //    antd 的 Tabs 溢出下拉把菜单当 listbox 用：`<MenuItem role="option">`，
      //    并且 rc 在 `role === 'option'` 时**补一个 `aria-selected`**。
      //    本仓原先硬编码 `'menuitem'`（且写在 `...attrs` **之后**，连 attrs 都盖掉）
      //    ⇒ 那个用法无法表达、且多出错误的 `aria-selected` 语义（2026-09-30 修）。
      const { role: roleAttr, class: nativeClass, style: nativeStyle, ...restAttrs } = attrs;
      const itemRole = roleAttr === null ? 'none' : roleAttr || 'menuitem';

      const node = h(
        'li',
        mergeProps(restAttrs, {
          role: itemRole,
          ...(itemRole === 'option' ? { 'aria-selected': isSelected.value } : {}),
          // rc：tabIndex disabled? null : -1（roving tabindex 的 -1 基线）
          tabindex: mergedDisabled.value ? undefined : -1,
          'data-menu-id':
            (props.overflowDisabled ?? ctx.overflowDisabled)
              ? undefined
              : getMenuId(ctx.menuId, eventKey),
          'aria-disabled': mergedDisabled.value ? true : undefined,
          class: [
            itemCls,
            isActive.value ? `${itemCls}-active` : undefined,
            isSelected.value ? `${itemCls}-selected` : undefined,
            mergedDisabled.value ? `${itemCls}-disabled` : undefined,
            props.danger ? `${itemCls}-danger` : undefined,
            !hasIcon ? `${itemCls}-only-child` : undefined,
            props.overflowCls,
            semCls.item,
            nativeClass,
          ],
          style: [
            ctx.mode.value === 'inline'
              ? { paddingLeft: `${connectedKeys.length * ctx.inlineIndent}px` }
              : undefined,
            semStyle.item,
            nativeStyle,
          ],
          onClickCapture: mergedDisabled.value ? onClickCapture : undefined,
          onClick: onInternalClick,
          onKeydown: onInternalKeyDown,
          onFocus: onInternalFocus,
          onFocusin: onInternalFocus,
          onMouseenter: onInternalMouseEnter,
          onMouseleave: onInternalMouseLeave,
        }),
        collapsedNoIcon !== null
          ? [h('div', { class: `${ctx.prefixCls}-inline-collapsed-noicon` }, collapsedNoIcon)]
          : [
              // ⚠️ antd `MenuItem.tsx`：icon 在 title-content **之前**（cloneElement 的
              //    icon 是第一个 child）。本仓原先写反了 ⇒ `.apollo-menu-item-icon + span`
              //    的 margin-inline-start 永不命中，图标跑到文字右侧。
              hasIcon
                ? h(
                    'span',
                    {
                      class: [`${ctx.prefixCls}-item-icon`, semCls.itemIcon],
                      style: semStyle.itemIcon,
                    },
                    [iconNode],
                  )
                : null,
              h(
                'span',
                {
                  class: [`${ctx.prefixCls}-title-content`, semCls.itemContent],
                  style: semStyle.itemContent,
                },
                [
                  children,
                  (() => {
                    const extra = mergedExtra();
                    return extra !== undefined && extra !== null
                      ? h('span', { class: `${ctx.prefixCls}-item-extra` }, [extra])
                      : null;
                  })(),
                ],
              ),
            ].filter((n) => n !== null),
      );

      // antd `MenuItem.tsx`：折叠态（inlineCollapsed / Sider 折叠）用 Tooltip 展示标题。
      // 未展开时 `title` 为 null ⇒ Tooltip 不显示；`tooltip === false` 完全关闭。
      if (!ctx.inlineCollapsed || ctx.tooltip === false) return node;
      const tooltipConfig = ctx.tooltip ?? {};
      const tooltipTitle =
        tooltipConfig.title !== undefined
          ? tooltipConfig.title
          : slots.title
            ? mergedTitle()
            : (props.title ?? (ctx.firstLevel ? props.labelText : undefined));
      return h(
        Tooltip,
        {
          ...tooltipConfig,
          title: tooltipTitle ?? null,
          placement: tooltipConfig.placement ?? (ctx.direction === 'rtl' ? 'left' : 'right'),
          classNames: (info) => {
            const names =
              typeof tooltipConfig.classNames === 'function'
                ? tooltipConfig.classNames(info)
                : tooltipConfig.classNames;
            return {
              ...names,
              root: [`${ctx.prefixCls}-inline-collapsed-tooltip`, names?.root]
                .filter(Boolean)
                .join(' '),
            };
          },
        },
        { default: () => node },
      );
    };
  },
});

export default MenuItem;
