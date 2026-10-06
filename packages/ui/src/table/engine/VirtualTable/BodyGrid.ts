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

import { type ExtraRenderInfo, VirtualList } from '@apollo-design/virtual-list';
import { computed, defineComponent, h, inject, type PropType, ref, watch } from 'vue';
import type { ColumnType } from '../../interface';
import { tableContextKey } from '../context';
import { type FlattenRecord, flattenRecords } from '../hooks/use-table';
import BodyLine from './BodyLine';

export interface BodyGridExposed {
  scrollTo: (config: unknown) => void;
  nativeElement: HTMLElement | null;
  getScrollInfo: () => { x: number; y: number };
}

export default defineComponent({
  name: 'TableBodyGrid',
  props: {
    data: { type: Array as PropType<Record<string, unknown>[]>, required: true },
    /** 视口高度（= `scroll.y`，已数值化）。 */
    height: { type: Number, required: true },
    /** 内容宽度（= `scroll.x`，已数值化）。 */
    scrollWidth: { type: Number, required: true },
    listItemHeight: { type: Number, default: undefined },
    onScroll: {
      type: Function as PropType<
        ((e: { currentTarget?: HTMLElement; scrollLeft: number }) => void) | undefined
      >,
      default: undefined,
    },
  },
  setup(props, { expose }) {
    const ctx = inject(tableContextKey)!;
    const listRef = ref<{
      scrollTo?: (c: unknown) => void;
      nativeElement?: HTMLElement | null;
      getScrollInfo?: () => { x: number; y: number };
    } | null>(null);

    // =========================== Data ===========================
    const flattenData = computed(() =>
      flattenRecords(
        props.data,
        ctx.childrenColumnName,
        ctx.expandedKeys as never,
        ctx.getRowKey as never,
      ),
    );
    const rowKeys = computed(() => flattenData.value.map((item) => item.rowKey));

    // ========================== Column ==========================
    // 列宽前缀和：[key, width, total] ⇒ columnsOffset = 各列 total
    const columnsWidth = computed<[string | number | undefined, number, number][]>(() => {
      let total = 0;
      return (ctx.flattenColumns as ColumnType[]).map(({ width, minWidth, key }) => {
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
    const getRowSpan = (column: ColumnType, index: number): number => {
      const record = flattenData.value[index]?.record;
      const onCell = column.onCell;
      if (onCell) {
        const cellProps = onCell(record as never, index);
        return (cellProps?.rowSpan as number) ?? 1;
      }
      return 1;
    };

    /** rowSpan 的补行（逐字上游 `BodyGrid.js:113-199`）。 */
    const extraRender = (info: ExtraRenderInfo) => {
      const { start, end, getSize, offsetY } = info;
      if (end < 0) return null;

      const columns = ctx.flattenColumns as ColumnType[];

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
        const rowKey = ctx.getRowKey(item.record as never, index);
        const getHeight = (rowSpan: number): number => {
          const endItemIndex = index + rowSpan - 1;
          const endItem = flattenData.value[endItemIndex];
          // clamp 到当前可用的最后一行（上游注释：正常不会走到）
          if (!endItem?.record) {
            const safeEndIndex = Math.min(endItemIndex, flattenData.value.length - 1);
            const safeEndItem = flattenData.value[safeEndIndex];
            if (!safeEndItem) return 0;
            const endItemKey = ctx.getRowKey(safeEndItem.record as never, safeEndIndex);
            const sizeInfo = getSize(rowKey, endItemKey);
            return sizeInfo.bottom - sizeInfo.top;
          }
          const endItemKey = ctx.getRowKey(endItem.record as never, endItemIndex);
          const sizeInfo = getSize(rowKey, endItemKey);
          return sizeInfo.bottom - sizeInfo.top;
        };
        const sizeInfo = getSize(rowKey);
        return h(BodyLine, {
          key: String(index),
          data: item,
          rowKey,
          index,
          rowKeys: rowKeys.value,
          columnsOffset: columnsOffset.value,
          style: { top: `${-(offsetY ?? 0) + sizeInfo.top}px` },
          extra: true,
          getHeight,
        } as never);
      });
    };

    // ========================== Expose ==========================
    expose({
      scrollTo: (config: unknown) => listRef.value?.scrollTo?.(config),
      get nativeElement() {
        return listRef.value?.nativeElement ?? null;
      },
      getScrollInfo: () => listRef.value?.getScrollInfo?.() ?? { x: 0, y: 0 },
    } satisfies BodyGridExposed);

    // ========================== Render ==========================
    return () => {
      const { prefixCls } = ctx;
      // ⚠️ 本仓 virtual-list 的 `component` 只收 String
      const wrapper = ctx.getComponent(['body', 'wrapper'], 'div');
      const wrapperComponent = typeof wrapper === 'string' ? wrapper : 'div';

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
          itemKey: (item: FlattenRecord<Record<string, unknown>>) =>
            ctx.getRowKey(item.record as never),
          component: wrapperComponent,
          scrollWidth: props.scrollWidth,
          direction: ctx.direction,
          onVirtualScroll: (info: { x: number }) =>
            props.onScroll?.({
              currentTarget: listRef.value?.nativeElement ?? undefined,
              scrollLeft: info.x,
            }),
          onScroll: (event: Event) => {
            const target = event.currentTarget as HTMLElement;
            props.onScroll?.({ currentTarget: target, scrollLeft: target.scrollLeft });
          },
        } as never,
        {
          default: (slotProps: {
            item: FlattenRecord<Record<string, unknown>>;
            index: number;
            style: Record<string, unknown>;
          }) =>
            h(BodyLine, {
              data: slotProps.item,
              rowKey: ctx.getRowKey(slotProps.item.record as never, slotProps.index),
              index: slotProps.index,
              rowKeys: rowKeys.value,
              columnsOffset: columnsOffset.value,
              style: slotProps.style,
            } as never),
          extra: (info: ExtraRenderInfo) => extraRender(info),
        },
      );
    };
  },
});
