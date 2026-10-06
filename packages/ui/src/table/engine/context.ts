/**
 * Table 的运行时上下文（rc `context/TableContext.js` + `PerfContext` 的等价物）。
 *
 * 约定同 tree/TreeContext：`provide(tableContextKey, reactive({...}))`，
 * 字段是 computed/函数/普通值 —— `reactive` 自动解包 ref，消费侧读到的是值
 * 且响应式追踪保留。
 *
 * ⚠️ **T0.2 PoC 的硬规则**（docs/analysis/table.md §4.3）：
 * `Cell` 不能直接 `inject` 表级 reactive 里「每次 hover 都会变的字段」
 * （hover 区间、scrollInfo 除外——固定列单元格才读），一律走 BodyRow
 * 的**行级 provide**（`rowContextKey`）。粒度与上游 selector 订阅同构。
 */

import { type ComputedRef, type InjectionKey, inject } from 'vue';
import type {
  ColumnsType,
  ExpandableConfig,
  GetRowKey,
  RenderExpandIcon,
  TableComponents,
  TableScrollConfig,
  TableSemanticClassNames,
  TableSemanticStyles,
} from '../interface';
import type { CellFixedInfo, StickyOffsets } from './utils/fixUtil';

/** 行级上下文（BodyRow provide ⇒ Cell inject）。字段全部是**值**（reactive 解包）。 */
export interface RowContextValue {
  record: Record<string, unknown> | undefined;
  /** 展平后的渲染序号（≠ 展平序号）。 */
  renderIndex: number;
  /** 展平序号。 */
  index: number;
  indent: number;
  rowKey: string | number;
  rowKeys: (string | number)[];
  columnsKey: (string | number)[];
  expanded: boolean;
  hasNestChildren: boolean;
  nestExpandable: boolean;
  rowSupportExpand: boolean;
  /** = rowSupportExpand || nestExpandable。 */
  expandable: boolean;
  /** 展平后的行 span 基准（expandedRowOffset 场景的 originRowSpan）。 */
  rowKeysExpandedCount: (start: number, count: number) => number;
  rowProps: Record<string, unknown>;
  expandedRowInfo: { offset: number; colSpan: number; sticky: number } | undefined;
  hovering: boolean;
  // ---- 供 VirtualCell 复用 getCellProps（BodyRow / BodyLine 都提供这些 getter）----
  prefixCls: string;
  expandIconColumnIndex: number;
  indentSize: number;
  expandIcon: ExpandableConfig['expandIcon'];
  fixedInfoList: CellFixedInfo[];
  expandedKeys: Set<string | number>;
  onTriggerExpand: (record: Record<string, unknown>, event?: Event) => void;
  hoveringBySpan: (rowSpan: number) => boolean;
}

export interface TableContextValue<RecordType = Record<string, unknown>> {
  // ---- Scroll ----
  scrollX: number | string | true | undefined;
  /** [absScrollLeft, scrollWidth - clientWidth]。 */
  scrollInfo: [number, number];
  classNames?: Partial<TableSemanticClassNames>;
  styles?: Partial<TableSemanticStyles>;
  // ---- Table ----
  prefixCls: string;
  getComponent: (path: string[], defaultComponent: unknown) => unknown;
  scrollbarSize: number;
  direction?: 'ltr' | 'rtl';
  fixedInfoList: ComputedRef<CellFixedInfo[]> | CellFixedInfo[];
  isSticky: boolean;
  componentWidth: number;
  fixHeader: boolean;
  fixColumn: boolean;
  horizonScroll: boolean;
  scroll?: TableScrollConfig;
  // ---- Body ----
  tableLayout: 'auto' | 'fixed';
  rowClassName?: string | ((record: RecordType, index: number, indent: number) => string);
  expandedRowClassName?: ExpandableConfig<RecordType>['expandedRowClassName'];
  expandIcon: RenderExpandIcon<RecordType>;
  expandableType: false | 'row' | 'nest';
  expandRowByClick: boolean;
  expandedRowRender?: ExpandableConfig<RecordType>['expandedRowRender'];
  forceRender: boolean;
  expandedRowOffset: number;
  onTriggerExpand: (record: RecordType, event?: Event) => void;
  expandIconColumnIndex: number;
  indentSize: number;
  allColumnsFixedLeft: boolean;
  emptyNode: unknown;
  // ---- Column ----
  columns: ColumnsType<RecordType>;
  flattenColumns: ColumnsType<RecordType>;
  onColumnResize: (columnKey: string | number, width: number | null) => void;
  colWidths: (number | undefined)[];
  // ---- Row ----
  hoverStartRow: number;
  hoverEndRow: number;
  onHover: (start: number, end: number) => void;
  rowExpandable?: ExpandableConfig<RecordType>['rowExpandable'];
  onRow?: (record: RecordType, index?: number) => Record<string, unknown>;
  getRowKey: GetRowKey<RecordType>;
  expandedKeys: Set<string | number>;
  childrenColumnName: string;
  rowHoverable: boolean;
  // ---- Measure ----
  measureRowRender?: (node: unknown) => unknown;
  // ---- 展开（T2）----
  expandableConfig: ComputedRef<ExpandableConfig<RecordType>>;
  // ---- components 自定义 ----
  components?: TableComponents<RecordType>;
  /** 粘性列头的 z-index 基数（--columns-count）。 */
  columnsCount?: number;
  stickyOffsets: StickyOffsets;
  /** 滚动同步（FixedHolder 的 wheel → 表头/表体联动）。 */
  onInternalScroll: (e: { currentTarget?: HTMLElement; scrollLeft: number }) => void;
  /** 三大滚动容器（FixedHolder/StickyScrollBar 回环用）。 */
  scrollHeaderRef: { value: HTMLElement | null };
  scrollBodyRef: { value: HTMLElement | null };
  scrollSummaryRef: { value: HTMLElement | null };
}

export const tableContextKey: InjectionKey<TableContextValue> = Symbol('tableContext');
export const rowContextKey: InjectionKey<RowContextValue> = Symbol('tableRowContext');

/** PerfContext 的对应物（render 里改 props 的 legacy 警告通道，Vue 侧仅保留计数）。 */
export interface PerfContextValue {
  renderWithProps: boolean;
}

export const perfContextKey: InjectionKey<PerfContextValue> = Symbol('tablePerfContext');

/** Summary（tfoot）内部上下文：滚动列 index / 粘滞几何。 */
export interface SummaryContextValue {
  stickyOffsets: StickyOffsets;
  flattenColumns: ColumnsType;
  scrollColumnIndex: number | null;
}

export const summaryContextKey: InjectionKey<SummaryContextValue> = Symbol('tableSummaryContext');

// ============================== 取上下文的助手 ==============================

/**
 * 取表级上下文（引擎件的标准入口）。
 *
 * ⚠️ 为什么不写 `inject(tableContextKey)!`：`inject` 返回 `T | undefined`，而引擎件
 * **必然**渲染在 `<Table>` 内部 ⇒ 用 `!` 只是把「万一不在」变成运行期 `undefined` 解引用
 * （报错信息看不出原因）。这里显式抛一条可读的错，同时消掉 13 处 `!`。
 */
export function useTableContext(): TableContextValue {
  const ctx = inject(tableContextKey);
  if (!ctx) {
    throw new Error('[apollo/table] 缺少 TableContext：引擎件必须在 <Table> 内部渲染');
  }
  return ctx;
}

/** 取行级上下文（`BodyRow` provide ⇒ `Cell` inject）。 */
export function useRowContext(): RowContextValue {
  const ctx = inject(rowContextKey);
  if (!ctx) {
    throw new Error('[apollo/table] 缺少 RowContext：Cell 必须在 BodyRow 内部渲染');
  }
  return ctx;
}
