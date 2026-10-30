/**
 * rc `Cell/index.js`（201 行）+ `useCellRender.js`（56 行）+ `useHoverState.js`（12 行）
 * —— Vue 移植。
 *
 * ⚠️ T0.2 PoC 硬规则：`hovering` 从 **行级 provide**（`rowContextKey`）inject，
 * 不读表级的 hover 区间（否则一次 hover 全表重渲，实测 500/500 → 5/500）。
 * 固定列阴影读表级 `scrollInfo` 是有意豁免 —— 只有固定列单元格会订阅它。
 */

import {
  computed,
  defineComponent,
  h,
  inject,
  isVNode,
  mergeProps,
  normalizeStyle,
  type SetupContext,
  type SlotsType,
  type StyleValue,
  toDisplayString,
  type VNodeChild,
} from 'vue';
import type {
  ColumnType,
  TableComponent,
  TableKey,
  TableRenderedCell,
  TableSlots,
} from '../interface';
import {
  perfContextKey,
  type RowContextValue,
  rowContextKey,
  type TableContextValue,
  tableContextKey,
} from './context';
import { renderElement } from './element';
import { validateValue } from './utils/valueUtil';

function isRenderCell(data: VNodeChild | TableRenderedCell): data is TableRenderedCell {
  return !!data && typeof data === 'object' && !Array.isArray(data) && !isVNode(data);
}

/** Match Vue text interpolation for values without a column renderer. */
function renderValue(value: unknown): VNodeChild {
  if (
    value == null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    isVNode(value)
  )
    return value;
  if (Array.isArray(value)) return value.map(renderValue);
  return toDisplayString(value);
}

function getValueByPath(record: object | undefined, dataIndex: ColumnType['dataIndex']): unknown {
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

export interface CellProps<RecordType extends object = Record<string, unknown>> {
  component?: TableComponent;
  prefixCls: string;
  className?: unknown;
  style?: StyleValue;
  align?: ColumnType['align'];
  ellipsis?: ColumnType['ellipsis'];
  scope?: string | null;
  // ---- Value ----
  record?: RecordType | null;
  column?: ColumnType<RecordType>;
  bodyCell?: TableSlots<RecordType>['bodyCell'];
  render?: ColumnType<RecordType>['render'] | null;
  dataIndex?: ColumnType['dataIndex'];
  renderIndex?: number;
  shouldCellUpdate?: ColumnType<RecordType>['shouldCellUpdate'];
  children?: VNodeChild;
  // ---- Row ----
  index?: number;
  rowType?: 'header' | 'body' | 'footer';
  // ---- Span ----
  colSpan?: number;
  rowSpan?: number;
  // ---- Fixed ----
  fixStart?: number | null;
  fixEnd?: number | null;
  fixedStartShadow?: boolean;
  fixedEndShadow?: boolean;
  offsetFixedStartShadow?: number;
  offsetFixedEndShadow?: number;
  zIndex?: number;
  zIndexReverse?: number;
  isSticky?: boolean;
  // ---- Private ----
  appendNode?: VNodeChild;
  additionalProps?: Record<string, unknown> | null;
  originRowSpan?: number;
}

const NativeCell = defineComponent(
  <RecordType extends object>(
    props: CellProps<RecordType>,
    { attrs: nativeAttrs, slots }: SetupContext<[], SlotsType<{ default?: () => VNodeChild }>>,
  ) => {
    const ctx = inject<TableContextValue<RecordType> | null>(tableContextKey, null);
    const rowCtx = inject<RowContextValue<RecordType> | null>(rowContextKey, null);
    const perf = inject(perfContextKey, null);

    // ====================== Value（useCellRender） ======================
    type RenderResult = [VNodeChild, TableRenderedCell['props']];
    let previous:
      | {
          record: RecordType;
          render: CellProps<RecordType>['render'];
          dataIndex: CellProps<RecordType>['dataIndex'];
          renderIndex: number | undefined;
          shouldCellUpdate: CellProps<RecordType>['shouldCellUpdate'];
          result: RenderResult;
        }
      | undefined;
    const cellRender = computed<RenderResult>(() => {
      if (validateValue(props.children)) return [props.children, undefined];
      const { record, render, dataIndex, renderIndex, shouldCellUpdate } = props;
      if (
        record &&
        previous &&
        render === previous.render &&
        dataIndex === previous.dataIndex &&
        renderIndex === previous.renderIndex &&
        shouldCellUpdate === previous.shouldCellUpdate &&
        shouldCellUpdate &&
        !shouldCellUpdate(record, previous.record)
      ) {
        return previous.result;
      }
      const value = getValueByPath(record ?? undefined, dataIndex);
      let result: RenderResult = [renderValue(value), undefined];
      if (render && record) {
        const rendered = render(value, record, renderIndex ?? props.index ?? 0);
        result = isRenderCell(rendered)
          ? [rendered.children, rendered.props]
          : [rendered, undefined];
        if (isRenderCell(rendered) && perf) perf.renderWithProps = true;
      }
      if (record) previous = { record, render, dataIndex, renderIndex, shouldCellUpdate, result };
      return result;
    });
    const childNode = () => {
      const base = cellRender.value[0];
      if (props.bodyCell && props.column && props.record)
        return props.bodyCell({
          text: getValueByPath(props.record, props.dataIndex),
          record: props.record,
          index: props.renderIndex ?? props.index ?? 0,
          column: props.column,
          originNode: base,
        });
      return slots.default ? slots.default() : base;
    };
    const legacyCellProps = computed(() => cellRender.value[1]);

    // ====================== Fixed ======================
    const isFixStart = computed(
      () => typeof props.fixStart === 'number' && !ctx?.allColumnsFixedLeft,
    );
    const isFixEnd = computed(() => typeof props.fixEnd === 'number' && !ctx?.allColumnsFixedLeft);
    const shadowState = computed<[boolean, boolean]>(() => {
      if (!isFixStart.value && !isFixEnd.value) return [false, false];
      const [absScroll, scrollWidth] = ctx?.scrollInfo ?? [0, 0];
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

    const onMouseEnter = (_event: MouseEvent) => {
      if (props.record && ctx) {
        ctx.onHover(props.index ?? -1, (props.index ?? -1) + mergedHoverRowSpan.value - 1);
      }
    };
    const onMouseLeave = (_event: MouseEvent) => {
      if (props.record && ctx) {
        ctx.onHover(-1, -1);
      }
    };

    // ====================== Render ======================
    const visible = computed(() => mergedColSpan.value !== 0 && mergedRowSpan.value !== 0);

    const title = (child: unknown) => {
      const fromAdditional = props.additionalProps?.title;
      if (fromAdditional !== undefined) return fromAdditional;
      return getTitleFromCellRenderChildren({
        rowType: props.rowType,
        ellipsis: props.ellipsis,
        children: child,
      });
    };

    const mergedClassName = () => {
      const cellPrefixCls = `${props.prefixCls}-cell`;
      const [showFixStartShadow, showFixEndShadow] = shadowState.value;
      return [
        cellPrefixCls,
        nativeAttrs.class,
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
        props.additionalProps?.class,
        props.additionalProps?.className,
        legacyCellProps.value?.class,
        legacyCellProps.value?.className,
      ];
    };

    const mergedStyle = computed(() => {
      const fixedStyle: Record<string, unknown> = {};
      if (isFixStart.value) {
        // ⚠️ React 自动加 px；Vue 不加 ⇒ 无单位值被丢弃（固定列吸边失效）
        fixedStyle.insetInlineStart = `${props.fixStart}px`;
        fixedStyle['--z-offset'] = props.zIndex;
        fixedStyle['--z-offset-reverse'] = props.zIndexReverse;
      }
      if (isFixEnd.value) {
        fixedStyle.insetInlineEnd = `${props.fixEnd}px`;
        fixedStyle['--z-offset'] = props.zIndex;
        fixedStyle['--z-offset-reverse'] = props.zIndexReverse;
      }
      const alignStyle: Record<string, unknown> = {};
      if (props.align) {
        alignStyle.textAlign = props.align;
      }
      return normalizeStyle([
        legacyCellProps.value?.style,
        fixedStyle,
        alignStyle,
        props.additionalProps?.style,
        props.style,
      ]);
    });

    // 固定阴影 + ellipsis 时内容要包一层 span（rc 同判）
    return () => {
      if (!visible.value) return null;
      const Component = props.component ?? 'td';
      const child = childNode();
      const wrappedChild =
        props.ellipsis && (props.fixedStartShadow || props.fixedEndShadow)
          ? h('span', { class: `${props.prefixCls}-cell-content` }, [child])
          : child;
      const { additionalProps } = props;
      const attrs = mergeProps(nativeAttrs, legacyCellProps.value ?? {}, additionalProps ?? {});
      Object.assign(attrs, {
        class: mergedClassName(),
        style: mergedStyle.value,
        // A11y
        title: title(child),
        scope: props.scope ?? undefined,
        // Span（1 不写属性）
        colSpan: mergedColSpan.value !== 1 ? mergedColSpan.value : undefined,
        rowSpan: mergedRowSpan.value !== 1 ? mergedRowSpan.value : undefined,
      });
      if (props.record && ctx?.rowHoverable !== false) {
        Object.assign(
          attrs,
          mergeProps(attrs, { onMouseenter: onMouseEnter, onMouseleave: onMouseLeave }),
        );
      }
      const kids: VNodeChild[] =
        props.appendNode !== undefined ? [props.appendNode, wrappedChild] : [wrappedChild];
      return renderElement(Component, attrs, kids);
    };
  },
  {
    name: 'TableCell',
    inheritAttrs: false,
    emits: [],
    props: [
      'component',
      'prefixCls',
      'style',
      'align',
      'ellipsis',
      'scope',
      'record',
      'column',
      'bodyCell',
      'render',
      'dataIndex',
      'renderIndex',
      'shouldCellUpdate',
      'children',
      'index',
      'rowType',
      'colSpan',
      'rowSpan',
      'fixStart',
      'fixEnd',
      'fixedStartShadow',
      'fixedEndShadow',
      'offsetFixedStartShadow',
      'offsetFixedEndShadow',
      'zIndex',
      'zIndexReverse',
      'isSticky',
      'appendNode',
      'additionalProps',
      'originRowSpan',
    ],
  },
);
const Cell: typeof NativeCell = Object.assign(NativeCell, {
  props: {
    component: { type: [String, Object, Function], default: undefined },
    prefixCls: { type: String, required: true },
    style: { type: [String, Array, Object], default: undefined },
    align: { type: String, default: undefined },
    ellipsis: { type: null, default: undefined },
    scope: { type: String, default: null },
    record: { type: null, default: null },
    column: { type: Object, default: undefined },
    bodyCell: { type: Function, default: undefined },
    render: { type: Function, default: undefined },
    dataIndex: { type: null, default: undefined },
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
    additionalProps: { type: Object, default: undefined },
    originRowSpan: { type: Number, default: undefined },
  },
});

export default Cell;
export type { TableKey };
