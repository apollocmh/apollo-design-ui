/**
 * TreeNode —— 树节点渲染（rc `TreeNode.js` 的逐段移植）。
 *
 * 判据（行号对 rc-tree 1.4.0 产物）：
 *   - `role="treeitem"` + aria-expanded/selected/checked/disabled（:332-345）
 *   - 状态类：`-treenode-disabled/-switcher-open|close/-checkbox-checked/
 *     -checkbox-indeterminate/-selected/-loading/-active/-leaf-last/-draggable/
 *     -leaf` + dragging / drop-target / drop-container / drag-over(-gap-top|bottom) /
 *     filter-node（:346-367）
 *   - 拖拽事件按 `isDraggable` 分流（draggableWithoutDisabled 只控 dragstart，:390-403）
 *   - switcher：叶子 `-switcher-noop`；可展开 `-switcher_{open|close}` + onClick=onExpand
 *   - checkbox：**自定义元素**（checkable 的 VNode 形态放进 span），role=checkbox +
 *     aria-checked=mixed/true/false + aria-labelledby=nodeId
 *   - loadData effect（rc useEffect）：expanded && 非叶子 && 未 loaded && 非 loading
 *     ⇒ onNodeLoad —— Vue 侧用 watch 实现（依赖集等价）
 */

import { computed, defineComponent, h, inject, type PropType, type VNodeChild, watch } from 'vue';
import { clsx } from '../notification/engine/util';
import Indent from './Indent';
import type { TreeKey } from './interface';
import { treeContextKey } from './TreeContext';
import getEntity from './utils/keyUtil';
import { convertNodePropsToEventData, isLeafNode } from './utils/treeUtil';

const ICON_OPEN = 'open';
const ICON_CLOSE = 'close';
const defaultTitle = '---';

/** rc `getId(treeId, eventKey)`：节点 DOM id（checkbox 的 aria-labelledby 用）。 */
export function getNodeId(treeId: string, eventKey: TreeKey | null | undefined): string {
  return `${treeId}_${String(eventKey ?? '')}`;
}

export default defineComponent({
  name: 'ATreeTreeNode',
  props: {
    eventKey: { type: [String, Number] as PropType<TreeKey>, default: undefined },
    className: { type: String, default: undefined },
    style: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    // ---- 节点态投影（getTreeNodeProps 产物，NodeList 下发）----
    dragOver: { type: Boolean, default: false },
    dragOverGapTop: { type: Boolean, default: false },
    dragOverGapBottom: { type: Boolean, default: false },
    // ⚠️ default undefined —— rc 判据 `isLeaf === false 恒否决`，缺省必须保持 undefined
    isLeaf: { type: Boolean, default: undefined },
    isStart: { type: Array as unknown as () => boolean[], required: true },
    isEnd: { type: Array as unknown as () => boolean[], required: true },
    expanded: { type: Boolean, default: false },
    selected: { type: Boolean, default: false },
    checked: { type: Boolean, default: false },
    halfChecked: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    loaded: { type: Boolean, default: false },
    active: { type: Boolean, default: false },
    selectable: { type: Boolean, default: undefined },
    disabled: { type: Boolean, default: false },
    checkable: { type: Boolean, default: undefined },
    disableCheckbox: { type: Boolean, default: false },
    // ---- 数据 ----
    data: { type: Object as PropType<Record<string, unknown>>, required: true },
    title: { type: [String, Object, Function] as PropType<unknown>, default: undefined },
    icon: { type: [String, Object, Function] as PropType<unknown>, default: undefined },
    switcherIcon: { type: [String, Object, Function] as PropType<unknown>, default: undefined },
    pos: { type: String, default: undefined },
    treeId: { type: String, required: true },
  },
  setup(props, { attrs }) {
    const ctx = inject(treeContextKey);
    if (!ctx) {
      // TreeNode 只由 Tree/NodeList 渲染（不单独公开），无 Provider 属编程错误
      throw new Error('[ATree] TreeNode must be rendered inside a Tree.');
    }

    // ======= Disabled =======
    const isDisabled = computed(() => !!(ctx.disabled || props.disabled));

    // ======= Checkable =======
    const isCheckable = computed(() => {
      // tree 或 treeNode 任一不可勾 ⇒ false；checkable 的 VNode 形态原样透传
      if (!ctx.checkable || props.checkable === false) {
        return false;
      }
      return ctx.checkable;
    });

    // ======= Selectable =======
    const isSelectable = computed(() => {
      if (typeof props.selectable === 'boolean') {
        return props.selectable;
      }
      return ctx.selectable;
    });

    // ======= Has children / Leaf =======
    const hasChildren = computed(() => {
      const entity = getEntity(ctx.keyEntities as never, props.eventKey as TreeKey) as
        | { children?: unknown[] }
        | undefined;
      return Boolean((entity?.children ?? []).length);
    });
    const memoizedIsLeaf = computed(() =>
      isLeafNode(props.isLeaf, ctx.loadData, hasChildren.value, props.loaded),
    );

    // ======= Node state（open/close/docu）=======
    const nodeState = computed(() => {
      if (memoizedIsLeaf.value) return null;
      return props.expanded ? ICON_OPEN : ICON_CLOSE;
    });

    /** rc 的 `props` 全集（含节点态投影）——convertNodePropsToEventData 的入参。 */
    function allProps(): Record<string, unknown> {
      return {
        eventKey: props.eventKey,
        expanded: props.expanded,
        selected: props.selected,
        checked: props.checked,
        halfChecked: props.halfChecked,
        loading: props.loading,
        loaded: props.loaded,
        active: props.active,
        disabled: props.disabled,
        checkable: props.checkable,
        selectable: props.selectable,
        disableCheckbox: props.disableCheckbox,
        isLeaf: props.isLeaf,
        data: props.data,
        title: props.title,
        pos: props.pos,
      };
    }

    // ======= Handlers =======
    const onSelect = (e: MouseEvent) => {
      if (isDisabled.value) return;
      ctx.onNodeSelect(e, convertNodePropsToEventData(allProps() as never) as never);
    };
    const onCheck = (e: MouseEvent) => {
      if (isDisabled.value) return;
      if (!isCheckable.value || props.disableCheckbox) return;
      ctx.onNodeCheck(e, convertNodePropsToEventData(allProps() as never) as never, !props.checked);
    };
    const onSelectorClick = (e: MouseEvent) => {
      // 点击先于选中/勾选（rc 判据：onNodeClick 在前）
      ctx.onNodeClick(e, convertNodePropsToEventData(allProps() as never) as never);
      if (isSelectable.value) {
        onSelect(e);
      } else {
        onCheck(e);
      }
    };
    const onSelectorDoubleClick = (e: MouseEvent) => {
      ctx.onNodeDoubleClick(e, convertNodePropsToEventData(allProps() as never) as never);
    };
    const onExpand = (e: MouseEvent) => {
      if (props.loading) return;
      ctx.onNodeExpand(e, convertNodePropsToEventData(allProps() as never) as never);
    };

    // ======= Drag =======
    const isDraggable = computed(() => {
      return !!(
        ctx.draggable &&
        (!ctx.draggable.nodeDraggable || ctx.draggable.nodeDraggable(props.data as never))
      );
    });
    const draggableWithoutDisabled = computed(() => !isDisabled.value && isDraggable.value);

    const onDragStart = (e: DragEvent) => {
      e.stopPropagation();
      ctx.onNodeDragStart(e, allProps() as never);
      try {
        e.dataTransfer?.setData('text/plain', '');
      } catch {
        // ie throws
      }
    };
    const onDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      ctx.onNodeDragEnter(e, allProps() as never);
    };
    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      ctx.onNodeDragOver(e, allProps() as never);
    };
    const onDragLeave = (e: DragEvent) => {
      e.stopPropagation();
      ctx.onNodeDragLeave(e, allProps() as never);
    };
    const onDragEnd = (e: DragEvent) => {
      e.stopPropagation();
      ctx.onNodeDragEnd(e, allProps() as never);
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      ctx.onNodeDrop(e, allProps() as never);
    };

    // ======= loadData effect（rc useEffect 依赖集等价）=======
    watch(
      () => [
        props.loading,
        typeof ctx.loadData === 'function',
        props.expanded,
        memoizedIsLeaf.value,
        props.loaded,
      ],
      ([loading, hasLoadData, expanded, isLeafNow, loaded]) => {
        if (loading) return;
        if (hasLoadData && expanded && !isLeafNow && !loaded) {
          ctx.onNodeLoad(convertNodePropsToEventData(allProps() as never) as never);
        }
      },
      { immediate: true },
    );

    return () => {
      const p = props;
      const prefixCls = ctx.prefixCls;
      const { styles, classNames: treeClassNames } = ctx;
      const dragging = ctx.draggingNodeKey === p.eventKey;

      // ---- Switcher ----
      const renderSwitcherIconDom = (isInternalLeaf: boolean): VNodeChild => {
        // 上游 antd 壳传下来的是渲染函数（iconUtil）；rc 兼容 fn/vnode
        const switcherIcon = p.switcherIcon ?? ctx.switcherIcon;
        if (typeof switcherIcon === 'function') {
          return (switcherIcon as (n: Record<string, unknown>) => VNodeChild)({
            ...allProps(),
            isLeaf: isInternalLeaf,
          });
        }
        return switcherIcon as VNodeChild;
      };
      const renderSwitcher = () => {
        if (memoizedIsLeaf.value) {
          const switcherIconDom = renderSwitcherIconDom(true);
          // rc 判据：只查 `!== false` —— null 也渲染空 noop span
          return switcherIconDom !== false
            ? h(
                'span',
                {
                  class: clsx(
                    `${prefixCls}-switcher`,
                    `${prefixCls}-switcher-noop`,
                    treeClassNames?.itemSwitcher,
                  ),
                  style: styles?.itemSwitcher,
                },
                switcherIconDom as never,
              )
            : null;
        }
        const switcherIconDom = renderSwitcherIconDom(false);
        // rc 判据：只查 `!== false` —— null 也渲染空 switcher span
        return switcherIconDom !== false
          ? h(
              'span',
              {
                onClick: onExpand,
                class: clsx(
                  `${prefixCls}-switcher`,
                  `${prefixCls}-switcher_${p.expanded ? ICON_OPEN : ICON_CLOSE}`,
                  treeClassNames?.itemSwitcher,
                ),
                style: styles?.itemSwitcher,
              },
              switcherIconDom as never,
            )
          : null;
      };

      // ---- Checkbox（[Legacy] 自定义元素与 checkable 分离是未来事）----
      const checkboxNode = (() => {
        if (!isCheckable.value) return null;
        const $custom = typeof isCheckable.value !== 'boolean' ? isCheckable.value : null;
        return h(
          'span',
          {
            class: clsx(`${prefixCls}-checkbox`, {
              [`${prefixCls}-checkbox-checked`]: p.checked,
              [`${prefixCls}-checkbox-indeterminate`]: !p.checked && p.halfChecked,
              [`${prefixCls}-checkbox-disabled`]: isDisabled.value || p.disableCheckbox,
            }),
            onClick: onCheck,
            role: 'checkbox',
            'aria-checked': p.halfChecked ? 'mixed' : p.checked,
            'aria-disabled': isDisabled.value || p.disableCheckbox ? 'true' : undefined,
            'aria-labelledby': getNodeId(p.treeId, p.eventKey as TreeKey),
          },
          $custom ? [$custom as never] : [],
        );
      })();

      // ---- Icon（空壳 icon 槽位，`-icon__docu|open|close`）----
      const iconNode = () =>
        h('span', {
          class: clsx(
            treeClassNames?.itemIcon,
            `${prefixCls}-iconEle`,
            `${prefixCls}-icon__${nodeState.value || 'docu'}`,
            {
              [`${prefixCls}-icon_loading`]: p.loading,
            },
          ),
          style: styles?.itemIcon,
        });

      // ---- DropIndicator（allowDrop 在 Tree 侧算好）----
      const dropIndicatorNode = (() => {
        const rootDraggable = Boolean(ctx.draggable);
        const showIndicator = !p.disabled && rootDraggable && ctx.dragOverNodeKey === p.eventKey;
        if (!showIndicator) return null;
        return (ctx.dropIndicatorRender as unknown as (o: Record<string, unknown>) => VNodeChild)({
          dropPosition: ctx.dropPosition,
          dropLevelOffset: ctx.dropLevelOffset,
          indent: ctx.indent,
          prefixCls,
          direction: ctx.direction,
        });
      })();

      // ---- Icon + Title（selector）----
      const selectorNode = (() => {
        const title = (p.title ?? defaultTitle) as unknown;
        const wrapClass = `${prefixCls}-node-content-wrapper`;

        // Icon：showIcon 时用定制 icon（无则默认空壳）；无 showIcon 但 loading 时仍显示
        let $icon: ReturnType<typeof h> | null = null;
        if (ctx.showIcon) {
          const currentIcon = p.icon ?? ctx.icon;
          $icon = currentIcon
            ? h(
                'span',
                {
                  class: clsx(
                    treeClassNames?.itemIcon,
                    `${prefixCls}-iconEle`,
                    `${prefixCls}-icon__customize`,
                  ),
                  style: styles?.itemIcon,
                },
                [
                  typeof currentIcon === 'function'
                    ? (currentIcon as (n: Record<string, unknown>) => VNodeChild)(allProps())
                    : (currentIcon as VNodeChild),
                ],
              )
            : iconNode();
        } else if (ctx.loadData && p.loading) {
          $icon = iconNode();
        }

        // Title：fn(data) > titleRender(data) > title 本体
        let titleNode: unknown;
        if (typeof title === 'function') {
          titleNode = (title as (d: Record<string, unknown>) => unknown)(p.data);
        } else if (ctx.titleRender) {
          titleNode = (ctx.titleRender as unknown as (d: Record<string, unknown>) => unknown)(
            p.data,
          );
        } else {
          titleNode = title;
        }

        return h(
          'span',
          {
            title: typeof title === 'string' ? title : '',
            class: clsx(wrapClass, `${wrapClass}-${nodeState.value || 'normal'}`, {
              [`${prefixCls}-node-selected`]: !isDisabled.value && (p.selected || dragging),
            }),
            onMouseenter: (e: MouseEvent) => {
              ctx.onNodeMouseEnter(e, convertNodePropsToEventData(allProps() as never) as never);
            },
            onMouseleave: (e: MouseEvent) => {
              ctx.onNodeMouseLeave(e, convertNodePropsToEventData(allProps() as never) as never);
            },
            onContextmenu: (e: MouseEvent) => {
              ctx.onNodeContextMenu(e, convertNodePropsToEventData(allProps() as never) as never);
            },
            onClick: onSelectorClick,
            onDblclick: onSelectorDoubleClick,
          },
          [
            $icon,
            h(
              'span',
              {
                class: clsx(`${prefixCls}-title`, treeClassNames?.itemTitle),
                style: styles?.itemTitle,
              },
              titleNode as never,
            ),
            dropIndicatorNode,
          ],
        );
      })();

      // ---- 拖拽把手（draggable.icon）----
      const dragHandlerNode = (() => {
        const dragIcon = ctx.draggable ? ctx.draggable.icon : null;
        if (!dragIcon) return null;
        return h('span', { class: `${prefixCls}-draggable-icon` }, dragIcon as never);
      })();

      // ---- 根节点 aria/data 透传（pickAttrs(aria|data)）----
      const dataOrAriaProps: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(attrs)) {
        if (/^(aria-|data-)/.test(key)) {
          dataOrAriaProps[key] = value;
        }
      }

      const entity = getEntity(ctx.keyEntities as never, p.eventKey as TreeKey) as
        | { level?: number }
        | undefined;
      const level = entity?.level ?? 0;
      const isEndNode = p.isEnd[p.isEnd.length - 1];

      return h(
        'div',
        {
          role: 'treeitem',
          id: getNodeId(p.treeId, p.eventKey as TreeKey),
          'aria-expanded': memoizedIsLeaf.value ? undefined : p.expanded,
          'aria-selected': isSelectable.value && !isDisabled.value ? p.selected : undefined,
          'aria-checked':
            isCheckable.value && !isDisabled.value
              ? p.halfChecked
                ? 'mixed'
                : p.checked
              : undefined,
          // React 对 aria-disabled={false} 不渲染 —— 对齐 DOM 产物
          'aria-disabled': isDisabled.value ? 'true' : undefined,
          class: clsx(p.className, `${prefixCls}-treenode`, treeClassNames?.item, {
            [`${prefixCls}-treenode-disabled`]: isDisabled.value,
            [`${prefixCls}-treenode-disabled`]: isDisabled.value,
            [`${prefixCls}-treenode-switcher-${p.expanded ? 'open' : 'close'}`]:
              !memoizedIsLeaf.value,
            [`${prefixCls}-treenode-checkbox-checked`]: p.checked,
            [`${prefixCls}-treenode-checkbox-indeterminate`]: p.halfChecked,
            [`${prefixCls}-treenode-selected`]: p.selected,
            [`${prefixCls}-treenode-loading`]: p.loading,
            [`${prefixCls}-treenode-active`]: p.active,
            [`${prefixCls}-treenode-leaf-last`]: isEndNode,
            [`${prefixCls}-treenode-draggable`]: isDraggable.value,
            dragging,
            'drop-target': ctx.dropTargetKey === p.eventKey,
            'drop-container': ctx.dropContainerKey === p.eventKey,
            'drag-over': !isDisabled.value && p.dragOver,
            'drag-over-gap-top': !isDisabled.value && p.dragOverGapTop,
            'drag-over-gap-bottom': !isDisabled.value && p.dragOverGapBottom,
            'filter-node': ctx.filterTreeNode?.(
              convertNodePropsToEventData(allProps() as never) as never,
            ),
            [`${prefixCls}-treenode-leaf`]: memoizedIsLeaf.value,
          }),
          style: { ...p.style, ...styles?.item },
          draggable: draggableWithoutDisabled.value,
          onDragstart: draggableWithoutDisabled.value ? onDragStart : undefined,
          onDragenter: isDraggable.value ? onDragEnter : undefined,
          onDragover: isDraggable.value ? onDragOver : undefined,
          onDragleave: isDraggable.value ? onDragLeave : undefined,
          onDrop: isDraggable.value ? onDrop : undefined,
          onDragend: isDraggable.value ? onDragEnd : undefined,
          onMousemove: () => {
            // rc：onMouseMove 来自 NodeList（mouse 移动 ⇒ active 复位）
            ctx.onNodeMouseMove?.(convertNodePropsToEventData(allProps() as never) as never);
          },
          ...dataOrAriaProps,
        },
        [
          h(Indent, { prefixCls, level, isStart: p.isStart, isEnd: p.isEnd }),
          dragHandlerNode,
          renderSwitcher(),
          checkboxNode,
          selectorNode,
        ],
      );
    };
  },
});
