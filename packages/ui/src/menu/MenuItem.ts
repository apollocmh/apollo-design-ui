/**
 * MenuItem —— rc-menu `MenuItem.js`（221 行）的 Vue 版。
 *
 * 双渲染协议（rc MenuItem 函数壳）：measure 模式（PathRegister 非空）⇒ 只
 * registerPath 并渲染 null；正常模式渲染 li[role=menuitem]。Menu 主体渲染
 * 两棵子树实现（rc 的 measureChildList 同构）。
 */
import { computed, defineComponent, h, type PropType, type VNodeChild } from 'vue';

import { useFullPath, useMeasure, useMenuContext } from './context';
import { getMenuId, KeyCode } from './engine/use-accessibility';
import type { MenuClickEventHandler, MenuHoverEventHandler, RenderIconType } from './interface';

const MenuItem = defineComponent({
  name: 'AMenuItem',
  props: {
    eventKey: { type: String, default: undefined },
    disabled: { type: Boolean, default: false },
    danger: { type: Boolean, default: false },
    icon: {
      type: [Object, String, Number, Function] as PropType<RenderIconType>,
      default: undefined,
    },
    title: { type: [String, Object, Number] as PropType<VNodeChild>, default: undefined },
    /** items 的 string label（collapsed 态 noicon 首字符用；rc 的 label 判定）。 */
    labelText: { type: String, default: undefined },
    overflowDisabled: { type: Boolean, default: undefined },
    overflowCls: { type: String, default: undefined },
    extra: { type: [Object, String, Number] as PropType<VNodeChild>, default: undefined },
    itemData: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    onMouseEnter: { type: Function as PropType<MenuHoverEventHandler>, default: undefined },
    onMouseLeave: { type: Function as PropType<MenuHoverEventHandler>, default: undefined },
    onClick: { type: Function as PropType<MenuClickEventHandler>, default: undefined },
  },
  setup(props, { slots, attrs }) {
    const measure = useMeasure();
    const connectedKeyPath = useFullPath(props.eventKey);

    if (measure) {
      measure.registerPath(props.eventKey ?? '', connectedKeyPath.value);
      // measure 子树是静态登记（Menu 每次渲染整树重建）—— 无需卸载钩子
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
      const children = slots.default?.();

      const getEventInfo = (e: Event) => {
        const itemData = props.itemData ?? {
          key: eventKey,
          label: children,
          itemIcon: props.icon,
          extra: props.extra,
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
        props.onClick?.(info as never);
        ctx.onItemClick(info);
      };
      const onInternalKeyDown = (e: KeyboardEvent): void => {
        if (e.which === KeyCode.ENTER && !mergedDisabled.value) {
          const info = getEventInfo(e);
          props.onClick?.(info as never);
          ctx.onItemClick(info);
        }
      };
      const onInternalFocus = (): void => {
        ctx.onActive(eventKey);
      };
      const onInternalMouseEnter = (e: MouseEvent): void => {
        if (!mergedDisabled.value) ctx.onActive(eventKey);
        props.onMouseEnter?.({ key: eventKey, domEvent: e });
      };
      const onInternalMouseLeave = (e: MouseEvent): void => {
        ctx.onInactive(eventKey);
        props.onMouseLeave?.({ key: eventKey, domEvent: e });
      };

      const mergedItemIcon = props.icon ?? ctx.itemIcon;
      // rc renderItemChildren：折叠态 + firstLevel + 无 icon + 字符串 label ⇒
      // 渲染首字符的 {p}-inline-collapsed-noicon 块
      const collapsedNoIcon =
        ctx.inlineCollapsed && ctx.firstLevel && !props.icon && props.labelText
          ? props.labelText.charAt(0)
          : null;

      return h(
        'li',
        {
          ...attrs,
          role: 'menuitem',
          // rc：tabIndex disabled? null : -1（roving tabindex 的 -1 基线）
          tabindex: mergedDisabled.value ? undefined : -1,
          'data-menu-id':
            (props.overflowDisabled ?? ctx.overflowDisabled)
              ? undefined
              : getMenuId(ctx.menuId, eventKey),
          'aria-disabled': props.disabled ? true : undefined,
          class: [
            itemCls,
            isActive.value ? `${itemCls}-active` : undefined,
            isSelected.value ? `${itemCls}-selected` : undefined,
            mergedDisabled.value ? `${itemCls}-disabled` : undefined,
            props.danger ? `${itemCls}-danger` : undefined,
            !mergedItemIcon ? `${itemCls}-only-child` : undefined,
            props.overflowCls,
          ],
          style: attrs.style as Record<string, string | number> | undefined,
          onClick: onInternalClick,
          onKeydown: onInternalKeyDown,
          onFocus: onInternalFocus,
          onMouseenter: onInternalMouseEnter,
          onMouseleave: onInternalMouseLeave,
        },
        collapsedNoIcon !== null
          ? [h('div', { class: `${ctx.prefixCls}-inline-collapsed-noicon` }, collapsedNoIcon)]
          : [
              h('span', { class: `${ctx.prefixCls}-title-content` }, [
                children,
                props.extra !== undefined && props.extra !== null
                  ? h('span', { class: `${ctx.prefixCls}-item-extra` }, props.extra)
                  : null,
              ]),
              mergedItemIcon
                ? h(
                    'span',
                    { class: `${ctx.prefixCls}-item-icon` },
                    typeof mergedItemIcon === 'function'
                      ? [mergedItemIcon({ isSelected: isSelected.value })].filter(
                          (c) => c !== null && c !== undefined,
                        )
                      : [mergedItemIcon].filter((c) => c !== null && c !== undefined),
                  )
                : null,
            ].filter((n) => n !== null),
      );
    };
  },
});

export default MenuItem;
