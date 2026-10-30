/**
 * rc `VirtualTable/BodyGrid.js`（261 行）—— Vue 移植。
 *
 * 虚拟表体的容器：把展平后的行交给 `@apollo-design/virtual-list`，
 * 每行渲染一个 `BodyLine`；`rowSpan` 的**补行**由 `extra` slot 产出。
 *
 * ⚠️ **与上游的三处差异**（见 `docs/analysis/table-virtual.md` §3.1）：
 *   1. 上游用 `styles={{ horizontalScrollBar }}` —— 本仓 virtual-list 用原生滚动条，**丢弃**；
 *   2. 上游 `extraRender` 是 prop —— 本仓是 `#extra` slot（virtual-list 既有契约）；
 *   3. 上游横向用 `margin-left` 模拟 —— 本仓用原生横向滚动（`scrollWidth` 通道）。
 */

import {
  type ExtraRenderInfo,
  VirtualList,
  type VirtualListExposed,
} from '@apollo-design/virtual-list';
import {
  type CSSProperties,
  computed,
  defineComponent,
  h,
  ref,
  type SetupContext,
  watch,
} from 'vue';
import type { ColumnType, TableScrollToConfig, TableSlots } from '../../interface';
import { useTableContext } from '../context';
import { type FlattenRecord, flattenRecords } from '../hooks/use-table';
import BodyLine from './BodyLine';

export interface BodyGridExposed {
  scrollTo: (config: TableScrollToConfig) => void;
  nativeElement: HTMLElement | null;
  getScrollInfo: () => { x: number; y: number };
}

interface BodyGridProps<RecordType extends object> {
  data: RecordType[];
  bodyCell?: TableSlots<RecordType>['bodyCell'];
  height: number;
  scrollWidth: number;
  listItemHeight?: number;
  onInternalScroll?: (info: { currentTarget?: HTMLElement; scrollLeft: number }) => void;
  onScroll?: (event: Event) => void;
}
const NativeBodyGrid = defineComponent(
  <RecordType extends object>(props: BodyGridProps<RecordType>, { expose }: SetupContext<[]>) => {
    const ctx = useTableContext<RecordType>();
    const listRef = ref<VirtualListExposed | null>(null);
    // The shared list transports the exact entries supplied by flattenData.
    const sourceItem = (item: unknown) => item as FlattenRecord<RecordType>;

    // =========================== Data ===========================
    const flattenData = computed(() =>
      flattenRecords(props.data, ctx.childrenColumnName, ctx.expandedKeys, ctx.getRowKey),
    );
    const rowKeys = computed(() => flattenData.value.map((item) => item.rowKey));

    // ========================== Column ==========================
    // 列宽前缀和：[key, width, total] ⇒ columnsOffset = 各列 total
    const columnsWidth = computed<[string | number | undefined, number, number][]>(() => {
      let total = 0;
      return ctx.flattenColumns.map(({ width, minWidth, key }) => {
        const finalWidth = Math.max((width as number) || 0, (minWidth as number) || 0);
        total += finalWidth;
        return [key, finalWidth, total] as [string | number | undefined, number, number];
      });
    });
    const columnsOffset = computed(() => columnsWidth.value.map((col) => col[2]));

    // 上报列宽（供 Header 的 stickyOffsets / MeasureRow）
    watch(
      columnsWidth,
      () => {
        columnsWidth.value.forEach(([key, width]) => {
          if (key !== undefined) ctx.onColumnResize(key, width);
        });
      },
      { immediate: true },
    );

    // ======================= Col/Row Span =======================
    const getRowSpan = (column: ColumnType<RecordType>, index: number): number => {
      const record = flattenData.value[index]?.record;
      const onCell = column.onCell;
      if (onCell && record) {
        const cellProps = onCell(record, index);
        return (cellProps?.rowSpan as number) ?? 1;
      }
      return 1;
    };

    /** rowSpan 的补行（逐字上游 `BodyGrid.js:113-199`）。 */
    const extraRender = (info: ExtraRenderInfo) => {
      const { start, end, getSize, offsetY } = info;
      if (end < 0) return null;

      const columns = ctx.flattenColumns;

      // ① 向前找「第一个没有 rowSpan=0 的行」⇒ startIndex
      let firstRowSpanColumns = columns.filter((column) => getRowSpan(column, start) === 0);
      let startIndex = start;
      for (let i = start; i >= 0; i -= 1) {
        firstRowSpanColumns = firstRowSpanColumns.filter((column) => getRowSpan(column, i) === 0);
        if (!firstRowSpanColumns.length) {
          startIndex = i;
          break;
        }
      }

      // ② 向后找「最后一个 rowSpan 全为 1 的行」⇒ endIndex
      let lastRowSpanColumns = columns.filter((column) => getRowSpan(column, end) !== 1);
      let endIndex = end;
      for (let i = end; i < flattenData.value.length; i += 1) {
        lastRowSpanColumns = lastRowSpanColumns.filter((column) => getRowSpan(column, i) !== 1);
        if (!lastRowSpanColumns.length) {
          endIndex = Math.max(i - 1, end);
          break;
        }
      }

      // ③ 收集区间内「任一列 rowSpan > 1」的行
      const spanLines: number[] = [];
      for (let i = startIndex; i <= endIndex; i += 1) {
        if (flattenData.value[i] && columns.some((column) => getRowSpan(column, i) > 1)) {
          spanLines.push(i);
        }
      }

      // ④ 每行产出一个补行
      return spanLines.map((index) => {
        const item = flattenData.value[index];
        if (!item) return null;
        const rowKey = ctx.getRowKey(item.record, index);
        const getHeight = (rowSpan: number): number => {
          const endItemIndex = index + rowSpan - 1;
          const endItem = flattenData.value[endItemIndex];
          // clamp 到当前可用的最后一行（上游注释：正常不会走到）
          if (!endItem?.record) {
            const safeEndIndex = Math.min(endItemIndex, flattenData.value.length - 1);
            const safeEndItem = flattenData.value[safeEndIndex];
            if (!safeEndItem) return 0;
            const endItemKey = ctx.getRowKey(safeEndItem.record, safeEndIndex);
            const sizeInfo = getSize(rowKey, endItemKey);
            return sizeInfo.bottom - sizeInfo.top;
          }
          const endItemKey = ctx.getRowKey(endItem.record, endItemIndex);
          const sizeInfo = getSize(rowKey, endItemKey);
          return sizeInfo.bottom - sizeInfo.top;
        };
        const sizeInfo = getSize(rowKey);
        return h(BodyLine<RecordType>, {
          key: String(index),
          data: item,
          bodyCell: props.bodyCell,
          rowKey,
          index,
          rowKeys: rowKeys.value,
          columnsOffset: columnsOffset.value,
          style: { top: `${-(offsetY ?? 0) + sizeInfo.top}px` },
          extra: true,
          getHeight,
        });
      });
    };

    // ========================== Expose ==========================
    expose({
      scrollTo: (config: TableScrollToConfig) => {
        const list = listRef.value;
        if (!list) return;
        if (config.top !== undefined) {
          list.scrollTo(config.top);
          return;
        }
        const index =
          config.index ?? flattenData.value.findIndex((item) => item.rowKey === config.key);
        const key = config.key ?? flattenData.value[index]?.rowKey;
        if (index < 0 && key === undefined) return;
        list.scrollTo({
          index,
          key,
          align:
            config.align === 'end'
              ? 'bottom'
              : config.align === 'start' || config.align === 'center'
                ? 'top'
                : undefined,
          offset: ({ getSize, align }) => {
            const offset = config.offset ?? 0;
            if (config.align === 'center' && key !== undefined) {
              const size = getSize(key);
              return (
                ((list.nativeElement?.clientHeight ?? props.height) - (size.bottom - size.top)) /
                  2 -
                offset
              );
            }
            return align === 'bottom' ? offset : -offset;
          },
        });
      },
      get nativeElement() {
        return listRef.value?.nativeElement ?? null;
      },
      getScrollInfo: () => listRef.value?.getScrollInfo?.() ?? { x: 0, y: 0 },
    } satisfies BodyGridExposed);

    // ========================== Render ==========================
    return () => {
      const { prefixCls } = ctx;
      const wrapperComponent = ctx.getComponent(['body', 'wrapper'], 'div');

      return h(
        VirtualList,
        {
          ref: listRef,
          fullHeight: false,
          prefixCls: `${prefixCls}-tbody-virtual`,
          class: `${prefixCls}-tbody`,
          height: props.height,
          itemHeight: props.listItemHeight || 24,
          data: flattenData.value,
          itemKey: (item: unknown) => sourceItem(item).rowKey,
          component: wrapperComponent,
          scrollWidth: props.scrollWidth,
          direction: ctx.direction,
          onVirtualScroll: (info: { x: number }) =>
            props.onInternalScroll?.({
              currentTarget: listRef.value?.nativeElement ?? undefined,
              scrollLeft: info.x,
            }),
          onScroll: (event: Event) => {
            props.onScroll?.(event);
          },
        },
        {
          default: (slotProps: { item: unknown; index: number; style: CSSProperties }) =>
            h(BodyLine<RecordType>, {
              data: sourceItem(slotProps.item),
              bodyCell: props.bodyCell,
              rowKey: sourceItem(slotProps.item).rowKey,
              index: slotProps.index,
              rowKeys: rowKeys.value,
              columnsOffset: columnsOffset.value,
              style: slotProps.style,
            }),
          extra: (info: ExtraRenderInfo) => extraRender(info),
        },
      );
    };
  },
  {
    name: 'TableBodyGrid',
    emits: [],
    props: [
      'data',
      'bodyCell',
      'height',
      'scrollWidth',
      'listItemHeight',
      'onInternalScroll',
      'onScroll',
    ],
  },
);
const BodyGrid: typeof NativeBodyGrid = Object.assign(NativeBodyGrid, {
  props: {
    data: { type: Array, required: true },
    bodyCell: { type: Function, default: undefined },
    /** 视口高度（= `scroll.y`，已数值化）。 */
    height: { type: Number, required: true },
    /** 内容宽度（= `scroll.x`，已数值化）。 */
    scrollWidth: { type: Number, required: true },
    listItemHeight: { type: Number, default: undefined },
    onInternalScroll: { type: Function, default: undefined },
    onScroll: { type: Function, default: undefined },
  },
});
export default BodyGrid;
