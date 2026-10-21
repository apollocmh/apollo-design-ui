/**
 * MenuItem —— rc-menu `MenuItem.js`（221 行）的 Vue 版。
 *
 * 双渲染协议（rc MenuItem 函数壳）：measure 模式（PathRegister 非空）⇒ 只
 * registerPath 并渲染 null；正常模式渲染 li[role=menuitem]。Menu 主体渲染
 * 两棵子树实现（rc 的 measureChildList 同构）。
 */

import { isEmptyVNode } from '@apollo-design/utils';
import { computed, defineComponent, h, isVNode, type PropType, Text, type VNodeChild } from 'vue';

import { styleAttrs } from '../_internal/use-merge-semantic';
import Tooltip from '../tooltip';
import { useFullPath, useMeasure, useMenuContext, usePathRegister } from './context';
import { getEventKeyCode, getMenuId, KeyCode } from './engine/use-accessibility';
import type { MenuClickEventHandler, MenuHoverEventHandler, RenderIconType } from './interface';

/** 解包 Vue slot 归一结果：单元素数组 ⇒ 元素；Text VNode（string slot 归一产物）⇒ 字符串。 */
function unwrapSlotResult(nodes: unknown): unknown {
  let r = nodes;
  if (Array.isArray(r) && r.length === 1) r = r[0];
  if (isVNode(r) && r.type === Text) r = (r.children as string) ?? '';
  return r;
}

/** 读具名 slot；无 slot 返回 undefined，空 slot 归一成 comment ⇒ 返回 null（隐藏）。 */
function readSlot(slots: Record<string, unknown>, name: string): unknown {
  const fn = (slots as Record<string, (() => unknown) | undefined>)[name];
  if (typeof fn !== 'function') return undefined;
  const nodes = fn();
  if (nodes === undefined) return undefined;
  const resolved = unwrapSlotResult(nodes);
  return isEmptyVNode(resolved as never) ? null : resolved;
}

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
    /** 文本主导：收窄 String；富内容走 #title slot（优先于 prop）。 */
    title: { type: String, default: undefined },
    /** items 的 string label（collapsed 态 noicon 首字符用；rc 的 label 判定）。 */
    labelText: { type: String, default: undefined },
    overflowDisabled: { type: Boolean, default: undefined },
    overflowCls: { type: String, default: undefined },
    // extra 为 VNode 主导 —— 已删除 prop，改 #extra slot（见 render 中 readSlot）。
    itemData: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    onMouseEnter: { type: Function as PropType<MenuHoverEventHandler>, default: undefined },
    onMouseLeave: { type: Function as PropType<MenuHoverEventHandler>, default: undefined },
    onClick: { type: Function as PropType<MenuClickEventHandler>, default: undefined },
  },
  setup(props, { slots, attrs }) {
    const mergedTitle = (): unknown => readSlot(slots, 'title') ?? props.title;
    const mergedExtra = (): unknown => readSlot(slots, 'extra');
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
      const children = slots.default?.();
      // 语义槽（Issue #22.6）：item / itemContent / itemIcon
      const semCls = (ctx.semanticClassNames?.value ?? {}) as Record<string, string | undefined>;
      const semStyle = (ctx.semanticStyles?.value ?? {}) as Record<
        string,
        Record<string, string | number> | undefined
      >;

      const getEventInfo = (e: Event) => {
        const itemData = props.itemData ?? {
          key: eventKey,
          label: children,
          itemIcon: props.icon,
          extra: mergedExtra(),
          title: mergedTitle(),
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
        if (getEventKeyCode(e) === KeyCode.ENTER && !mergedDisabled.value) {
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

      // ⚠️ `role` 可被覆盖（与 rc 的 `role: role === null ? 'none' : role || 'menuitem'` 同判）。
      //    antd 的 Tabs 溢出下拉把菜单当 listbox 用：`<MenuItem role="option">`，
      //    并且 rc 在 `role === 'option'` 时**补一个 `aria-selected`**。
      //    本仓原先硬编码 `'menuitem'`（且写在 `...attrs` **之后**，连 attrs 都盖掉）
      //    ⇒ 那个用法无法表达、且多出错误的 `aria-selected` 语义（2026-09-30 修）。
      const { role: roleAttr, ...restAttrs } = attrs as { role?: string | null };
      const itemRole = roleAttr === null ? 'none' : roleAttr || 'menuitem';

      const node = h(
        'li',
        {
          ...restAttrs,
          role: itemRole,
          ...(itemRole === 'option' ? { 'aria-selected': isSelected.value } : {}),
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
            semCls.item,
          ],
          ...styleAttrs({
            // rc useDirectionStyle：inline 模式的缩进（level × inlineIndent，内联；
            // ⚠️ Vue 的 style 值必须是带单位字符串 —— 数字会被静默丢弃）
            ...(ctx.mode.value === 'inline'
              ? { paddingLeft: `${connectedKeys.length * ctx.inlineIndent}px` }
              : {}),
            ...(attrs.style as Record<string, string | number> | undefined),
            ...(semStyle.item ?? {}),
          }),
          onClick: onInternalClick,
          onKeydown: onInternalKeyDown,
          onFocus: onInternalFocus,
          onMouseenter: onInternalMouseEnter,
          onMouseleave: onInternalMouseLeave,
        },
        collapsedNoIcon !== null
          ? [h('div', { class: `${ctx.prefixCls}-inline-collapsed-noicon` }, collapsedNoIcon)]
          : [
              h(
                'span',
                {
                  class: [`${ctx.prefixCls}-title-content`, semCls.itemContent],
                  ...styleAttrs(semStyle.itemContent),
                },
                [
                  children,
                  (() => {
                    const extra = mergedExtra();
                    return extra !== undefined && extra !== null
                      ? h('span', { class: `${ctx.prefixCls}-item-extra` }, [extra as VNodeChild])
                      : null;
                  })(),
                ],
              ),
              mergedItemIcon
                ? h(
                    'span',
                    {
                      class: [`${ctx.prefixCls}-item-icon`, semCls.itemIcon],
                      ...styleAttrs(semStyle.itemIcon),
                    },
                    typeof mergedItemIcon === 'function'
                      ? [mergedItemIcon({ isSelected: isSelected.value })].filter(
                          (c) => c !== null && c !== undefined,
                        )
                      : [mergedItemIcon].filter((c) => c !== null && c !== undefined),
                  )
                : null,
            ].filter((n) => n !== null),
      );

      // antd `MenuItem.tsx`：折叠态（inlineCollapsed / Sider 折叠）用 Tooltip 展示标题。
      // 未展开时 `title` 为 null ⇒ Tooltip 不显示；`tooltip === false` 完全关闭。
      if (!ctx.inlineCollapsed || ctx.tooltip === false) return node;
      const tooltipConfig = (ctx.tooltip ?? {}) as Record<string, unknown>;
      const cfgClassNames = tooltipConfig.classNames as Record<string, string> | undefined;
      const tooltipTitle =
        tooltipConfig.title !== undefined
          ? tooltipConfig.title
          : typeof props.title === 'string'
            ? props.title
            : ctx.firstLevel
              ? props.labelText
              : undefined;
      return h(
        Tooltip,
        {
          ...tooltipConfig,
          title: tooltipTitle ?? null,
          placement:
            (tooltipConfig.placement as string | undefined) ??
            (ctx.direction === 'rtl' ? 'left' : 'right'),
          classNames: {
            ...(cfgClassNames ?? {}),
            root: [`${ctx.prefixCls}-inline-collapsed-tooltip`, cfgClassNames?.root]
              .filter(Boolean)
              .join(' '),
          },
        } as never,
        { default: () => node },
      );
    };
  },
});

export default MenuItem;
