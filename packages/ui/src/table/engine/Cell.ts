/**
 * rc `Cell/index.js`（201 行）+ `useCellRender.js`（56 行）+ `useHoverState.js`（12 行）
 * —— Vue 移植。
 *
 * ⚠️ T0.2 PoC 硬规则：`hovering` 从 **行级 provide**（`rowContextKey`）inject，
 * 不读表级的 hover 区间（否则一次 hover 全表重渲，实测 500/500 → 5/500）。
 * 固定列阴影读表级 `scrollInfo` 是有意豁免 —— 只有固定列单元格会订阅它。
 */

import { computed, defineComponent, h, inject, type PropType } from 'vue';
import type { ColumnType, TableKey } from '../interface';
import { perfContextKey, rowContextKey, tableContextKey } from './context';
import { validateValue } from './utils/valueUtil';

/** legacy `render` 返回 `{ children, props }` 的对象形态（rc `isRenderCell`）。 */
function isRenderCell(data: unknown): data is { children: unknown; props: unknown } {
  return !!data && typeof data === 'object' && !Array.isArray(data) && !isVNodeLike(data);
}

/** 判断一个值是不是本仓 render 函数产出的「元素形态」（数组 [tag, props, ...] 或 VNode）。 */
function isVNodeLike(data: unknown): boolean {
  if (Array.isArray(data) && typeof data[0] === 'string' && typeof data[1] === 'object') {
    return true;
  }
  return !!data && typeof data === 'object' && '__v_isVNode' in (data as Record<string, unknown>);
}

function getValueByPath(
  record: Record<string, unknown> | undefined,
  dataIndex: ColumnType['dataIndex'],
): unknown {
  if (!record) return undefined;
  const path =
    dataIndex === null || dataIndex === undefined || dataIndex === ''
      ? []
      : Array.isArray(dataIndex)
        ? [...dataIndex]
        : [dataIndex];
  let current: unknown = record;
  for (const key of path as (string | number)[]) {
    if (current && typeof current === 'object') {
      current = (current as Record<string, unknown>)[key as string];
    } else {
      return undefined;
    }
  }
  return current;
}

/** antd `getTitleFromCellRenderChildren`：ellipsis/header 的 title 兜底。 */
function getTitleFromCellRenderChildren(params: {
  ellipsis: ColumnType['ellipsis'];
  rowType?: string;
  children: unknown;
}): string | undefined {
  const { ellipsis, rowType, children } = params;
  let title: string | undefined;
  const ellipsisConfig = ellipsis === true ? { showTitle: true } : ellipsis;
  if (ellipsisConfig && (ellipsisConfig.showTitle || rowType === 'header')) {
    if (typeof children === 'string' || typeof children === 'number') {
      title = children.toString();
    } else if (
      Array.isArray(children) &&
      children.length === 3 &&
      typeof children[2] === 'string'
    ) {
      // 文本子节点形态 [tag, props, text]
      title = children[2];
    }
  }
  return title;
}

export interface CellProps {
  component?: string;
  prefixCls: string;
  className?: unknown;
  style?: Record<string, unknown>;
  align?: ColumnType['align'];
  ellipsis?: ColumnType['ellipsis'];
  scope?: string | null;
  // ---- Value ----
  record?: Record<string, unknown> | null;
  render?: ((...args: unknown[]) => unknown) | null;
  dataIndex?: ColumnType['dataIndex'];
  renderIndex?: number;
  shouldCellUpdate?: ColumnType['shouldCellUpdate'];
  children?: unknown;
  // ---- Row ----
  index?: number;
  rowType?: 'header' | 'body' | 'footer';
  // ---- Span ----
  colSpan?: number;
  rowSpan?: number;
  // ---- Fixed ----
  fixStart?: number;
  fixEnd?: number;
  fixedStartShadow?: boolean;
  fixedEndShadow?: boolean;
  offsetFixedStartShadow?: number;
  offsetFixedEndShadow?: number;
  zIndex?: number;
  zIndexReverse?: number;
  isSticky?: boolean;
  // ---- Private ----
  appendNode?: unknown;
  additionalProps?: Record<string, unknown> | null;
  originRowSpan?: number;
}

const Cell = defineComponent({
  name: 'TableCell',
  inheritAttrs: false,
  props: {
    component: { type: String, default: undefined },
    prefixCls: { type: String, required: true },
    style: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    align: { type: String as PropType<CellProps['align']>, default: undefined },
    ellipsis: { type: null as unknown as PropType<CellProps['ellipsis']>, default: undefined },
    scope: { type: String, default: null },
    record: { type: null as unknown as PropType<CellProps['record']>, default: null },
    render: { type: Function as unknown as PropType<CellProps['render']>, default: undefined },
    dataIndex: { type: null as unknown as PropType<CellProps['dataIndex']>, default: undefined },
    renderIndex: { type: Number, default: undefined },
    shouldCellUpdate: { type: Function, default: undefined },
    children: { type: null, default: undefined },
    index: { type: Number, default: undefined },
    rowType: { type: String, default: undefined },
    colSpan: { type: Number, default: undefined },
    rowSpan: { type: Number, default: undefined },
    fixStart: { type: Number, default: undefined },
    fixEnd: { type: Number, default: undefined },
    fixedStartShadow: { type: Boolean, default: false },
    fixedEndShadow: { type: Boolean, default: false },
    offsetFixedStartShadow: { type: Number, default: 0 },
    offsetFixedEndShadow: { type: Number, default: 0 },
    zIndex: { type: Number, default: undefined },
    zIndexReverse: { type: Number, default: undefined },
    isSticky: { type: Boolean, default: false },
    appendNode: { type: null, default: undefined },
    additionalProps: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    originRowSpan: { type: Number, default: undefined },
  },
  setup(props, { attrs, slots }) {
    const ctx = inject(tableContextKey, null);
    const rowCtx = inject(rowContextKey, null);
    const perf = inject(perfContextKey, null);

    // ====================== Value（useCellRender） ======================
    const cellRender = computed<[unknown, Record<string, unknown> | undefined]>(() => {
      if (validateValue(props.children)) {
        return [props.children, undefined];
      }
      const value = getValueByPath(props.record ?? undefined, props.dataIndex);
      let returnChildNode: unknown = value;
      let returnCellProps: Record<string, unknown> | undefined;
      if (props.render) {
        const renderData = props.render(value, props.record, props.renderIndex);
        if (isRenderCell(renderData)) {
          // legacy `render` 返回 { children, props }
          returnChildNode = renderData.children;
          returnCellProps = renderData.props as Record<string, unknown>;
          if (perf) perf.renderWithProps = true;
        } else {
          returnChildNode = renderData;
        }
      }
      return [returnChildNode, returnCellProps];
    });
    const childNode = computed(() => {
      const base = cellRender.value[0];
      // Cell 也支持 default slot（ExpandedRow / SummaryCell 通道）
      if (base === undefined || base === null) {
        const fromSlot = slots.default?.();
        if (fromSlot !== undefined && fromSlot !== null) return fromSlot;
      }
      return base;
    });
    const legacyCellProps = computed(() => cellRender.value[1]);

    // ====================== Fixed ======================
    const isFixStart = computed(
      () => typeof props.fixStart === 'number' && !ctx?.allColumnsFixedLeft,
    );
    const isFixEnd = computed(() => typeof props.fixEnd === 'number' && !ctx?.allColumnsFixedLeft);
    const shadowState = computed<[boolean, boolean]>(() => {
      if (!isFixStart.value && !isFixEnd.value) return [false, false];
      const [absScroll, scrollWidth] = (ctx?.scrollInfo as [number, number]) ?? [0, 0];
      const showStartShadow =
        Number(isFixStart.value && props.fixedStartShadow && absScroll) -
          (props.offsetFixedStartShadow ?? 0) >=
        1;
      const showEndShadow =
        Number(isFixEnd.value && props.fixedEndShadow && scrollWidth - absScroll) -
          (props.offsetFixedEndShadow ?? 0) >
        1;
      return [showStartShadow, showEndShadow];
    });

    // ================ RowSpan & ColSpan =================
    const mergedColSpan = computed(
      () => legacyCellProps.value?.colSpan ?? props.additionalProps?.colSpan ?? props.colSpan ?? 1,
    );
    const mergedRowSpan = computed<number>(
      () =>
        (legacyCellProps.value?.rowSpan as number | undefined) ??
        (props.additionalProps?.rowSpan as number | undefined) ??
        props.rowSpan ??
        1,
    );
    const mergedHoverRowSpan = computed<number>(
      () =>
        (legacyCellProps.value?.rowSpan as number | undefined) ??
        props.originRowSpan ??
        mergedRowSpan.value,
    );

    // ====================== Hover（行级） ======================
    const hovering = computed(() => rowCtx?.hovering ?? false);

    const onMouseEnter = (event: MouseEvent) => {
      if (props.record && ctx) {
        ctx.onHover(props.index ?? -1, (props.index ?? -1) + mergedHoverRowSpan.value - 1);
      }
      (props.additionalProps?.onMouseEnter as ((e: MouseEvent) => void) | undefined)?.(event);
    };
    const onMouseLeave = (event: MouseEvent) => {
      if (props.record && ctx) {
        ctx.onHover(-1, -1);
      }
      (props.additionalProps?.onMouseLeave as ((e: MouseEvent) => void) | undefined)?.(event);
    };

    // ====================== Render ======================
    const visible = computed(() => mergedColSpan.value !== 0 && mergedRowSpan.value !== 0);

    const title = computed(() => {
      const fromAdditional = props.additionalProps?.title;
      if (fromAdditional !== undefined) return fromAdditional;
      return getTitleFromCellRenderChildren({
        rowType: props.rowType,
        ellipsis: props.ellipsis,
        children: childNode.value,
      });
    });

    const mergedClassName = computed(() => {
      const cellPrefixCls = `${props.prefixCls}-cell`;
      const [showFixStartShadow, showFixEndShadow] = shadowState.value;
      return [
        cellPrefixCls,
        (attrs as { class?: unknown }).class,
        {
          [`${cellPrefixCls}-fix`]: isFixStart.value || isFixEnd.value,
          [`${cellPrefixCls}-fix-start`]: isFixStart.value,
          [`${cellPrefixCls}-fix-end`]: isFixEnd.value,
          [`${cellPrefixCls}-fix-start-shadow`]: props.fixedStartShadow,
          [`${cellPrefixCls}-fix-start-shadow-show`]: props.fixedStartShadow && showFixStartShadow,
          [`${cellPrefixCls}-fix-end-shadow`]: props.fixedEndShadow,
          [`${cellPrefixCls}-fix-end-shadow-show`]: props.fixedEndShadow && showFixEndShadow,
          [`${cellPrefixCls}-ellipsis`]: props.ellipsis,
          [`${cellPrefixCls}-with-append`]: props.appendNode,
          [`${cellPrefixCls}-fix-sticky`]: (isFixStart.value || isFixEnd.value) && props.isSticky,
          [`${cellPrefixCls}-row-hover`]: !legacyCellProps.value && hovering.value,
        },
        props.additionalProps?.className,
        legacyCellProps.value?.className,
      ];
    });

    const mergedStyle = computed<Record<string, unknown>>(() => {
      const fixedStyle: Record<string, unknown> = {};
      if (isFixStart.value) {
        fixedStyle.insetInlineStart = props.fixStart;
        fixedStyle['--z-offset'] = props.zIndex;
        fixedStyle['--z-offset-reverse'] = props.zIndexReverse;
      }
      if (isFixEnd.value) {
        fixedStyle.insetInlineEnd = props.fixEnd;
        fixedStyle['--z-offset'] = props.zIndex;
        fixedStyle['--z-offset-reverse'] = props.zIndexReverse;
      }
      const alignStyle: Record<string, unknown> = {};
      if (props.align) {
        alignStyle.textAlign = props.align;
      }
      return {
        ...(legacyCellProps.value?.style as Record<string, unknown> | undefined),
        ...fixedStyle,
        ...alignStyle,
        ...(props.additionalProps?.style as Record<string, unknown> | undefined),
        ...props.style,
      };
    });

    // 固定阴影 + ellipsis 时内容要包一层 span（rc 同判）
    const wrappedChild = computed(() => {
      if (props.ellipsis && (props.fixedStartShadow || props.fixedEndShadow)) {
        return h('span', { class: `${props.prefixCls}-cell-content` }, childNode.value as never);
      }
      return childNode.value;
    });

    return () => {
      if (!visible.value) return null;
      const Component = (props.component ?? 'td') as string;
      const { additionalProps } = props;
      const attrs: Record<string, unknown> = {
        ...(legacyCellProps.value ?? {}),
        ...additionalProps,
        class: mergedClassName.value,
        style: mergedStyle.value,
        // A11y
        title: title.value,
        scope: props.scope ?? undefined,
        // Span（1 不写属性）
        colSpan: mergedColSpan.value !== 1 ? mergedColSpan.value : undefined,
        rowSpan: mergedRowSpan.value !== 1 ? mergedRowSpan.value : undefined,
      };
      if (props.record && ctx?.rowHoverable !== false) {
        attrs.onMouseenter = onMouseEnter;
        attrs.onMouseleave = onMouseLeave;
      }
      const domProps: Record<string, unknown> = {};
      for (const key of Object.keys(attrs)) {
        if (
          ![
            'class',
            'style',
            'title',
            'scope',
            'colSpan',
            'rowSpan',
            'onMouseenter',
            'onMouseleave',
          ].includes(key) &&
          typeof (attrs as Record<string, unknown>)[key] !== 'function' &&
          !key.startsWith('on')
        ) {
          domProps[key] = (attrs as Record<string, unknown>)[key];
        }
      }
      const kids: unknown[] =
        props.appendNode !== undefined
          ? [props.appendNode as never, wrappedChild.value as never]
          : [wrappedChild.value as never];
      return h(Component, attrs, kids as never);
    };
  },
});

export default Cell;
export type { TableKey };
