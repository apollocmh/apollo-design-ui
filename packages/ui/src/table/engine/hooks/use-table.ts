/**
 * rc `hooks/{useHover,useStickyOffsets,useFixedInfo,useSticky,useFlattenRecords,useFrame}.js`
 * —— 六个小 hook 合并成一个文件（各自都只有 10–55 行，分文件只会稀释注释密度）。
 */

import { type ComputedRef, computed, ref } from 'vue';
import type { ColumnsType, GetRowKey } from '../../interface';
import { type CellFixedInfo, getCellFixedInfo, type StickyOffsets } from '../utils/fixUtil';

// ============================== useHover ==============================

/** 行 hover 区间（rowSpan 联动）：[start, end]，-1 表示不在任何行上。 */
export function useHover(): {
  startRow: ComputedRef<number>;
  endRow: ComputedRef<number>;
  onHover: (start: number, end: number) => void;
} {
  const startRow = ref(-1);
  const endRow = ref(-1);
  const onHover = (start: number, end: number) => {
    startRow.value = start;
    endRow.value = end;
  };
  return {
    startRow: computed(() => startRow.value),
    endRow: computed(() => endRow.value),
    onHover,
  };
}

// ========================== useStickyOffsets ==========================

/** 固定列的粘滞偏移（逐字 rc useStickyOffsets）。 */
export function useStickyOffsets(
  colWidths: ComputedRef<(number | undefined)[]>,
  flattenColumns: ComputedRef<ColumnsType>,
): ComputedRef<StickyOffsets> {
  return computed<StickyOffsets>(() => {
    const columns = flattenColumns.value;
    const widths = colWidths.value;
    const columnCount = columns.length;
    const getOffsets = (startIndex: number, endIndex: number, offset: number): number[] => {
      const offsets: number[] = [];
      let total = 0;
      for (let i = startIndex; i !== endIndex; i += offset) {
        offsets.push(total);
        if ((columns[i] as { fixed?: unknown } | undefined)?.fixed) {
          total += widths[i] || 0;
        }
      }
      return offsets;
    };
    const startOffsets = getOffsets(0, columnCount, 1);
    const endOffsets = getOffsets(columnCount - 1, -1, -1).reverse();
    return { start: startOffsets, end: endOffsets, widths: widths as number[] };
  });
}

// ============================ useFixedInfo ============================

/** 每列的固定信息列表（Cell 渲染 sticky 定位要用）。 */
export function useFixedInfo(
  flattenColumns: ComputedRef<ColumnsType>,
  stickyOffsets: ComputedRef<StickyOffsets>,
): ComputedRef<CellFixedInfo[]> {
  return computed(() => {
    const columns = flattenColumns.value;
    const offsets = stickyOffsets.value;
    return columns.map((_, colIndex) =>
      getCellFixedInfo(colIndex, colIndex, columns as never, offsets as never),
    );
  });
}

// ============================== useSticky ==============================

const canUseDom = () => typeof window !== 'undefined';

/** 粘性表头（`sticky` prop）的配置归并（逐字 rc useSticky）。 */
export function useSticky(
  sticky:
    | boolean
    | {
        offsetHeader?: number;
        offsetSummary?: number;
        offsetScroll?: number;
        getContainer?: () => unknown;
      }
    | undefined,
  prefixCls: string,
): {
  isSticky: boolean;
  stickyClassName: string;
  offsetHeader: number;
  offsetSummary: number;
  offsetScroll: number;
  container: unknown;
} {
  const cfg = typeof sticky === 'object' ? sticky : {};
  const offsetHeader = cfg.offsetHeader ?? 0;
  const offsetSummary = cfg.offsetSummary ?? 0;
  const offsetScroll = cfg.offsetScroll ?? 0;
  const container = cfg.getContainer?.() ?? (canUseDom() ? window : null);
  const isSticky = Boolean(sticky);
  return {
    isSticky,
    stickyClassName: isSticky ? `${prefixCls}-sticky-holder` : '',
    offsetHeader,
    offsetSummary,
    offsetScroll,
    container,
  };
}

// ========================== useFlattenRecords ==========================

export interface FlattenRecord<RecordType> {
  record: RecordType;
  indent: number;
  index: number;
  rowKey: string | number;
}

function fillRecords<RecordType>(
  list: FlattenRecord<RecordType>[],
  record: RecordType,
  indent: number,
  childrenColumnName: string,
  expandedKeys: Set<string | number>,
  getRowKey: GetRowKey<RecordType>,
  index: number,
): void {
  const key = getRowKey(record, index);
  list.push({ record, indent, index, rowKey: key });
  const expanded = expandedKeys?.has(key);
  const children = (record as Record<string, unknown>)[childrenColumnName];
  if (record && Array.isArray(children) && expanded) {
    children.forEach((child: RecordType, i: number) => {
      fillRecords(list, child, indent + 1, childrenColumnName, expandedKeys, getRowKey, i);
    });
  }
}

/** 树形数据按展开态展平（逐字 rc useFlattenRecords）。 */
export function flattenRecords<RecordType>(
  data: RecordType[] | undefined,
  childrenColumnName: string,
  expandedKeys: Set<string | number>,
  getRowKey: GetRowKey<RecordType>,
): FlattenRecord<RecordType>[] {
  if (expandedKeys?.size) {
    const list: FlattenRecord<RecordType>[] = [];
    (data ?? []).forEach((record, i) => {
      fillRecords(list, record, 0, childrenColumnName, expandedKeys, getRowKey, i);
    });
    return list;
  }
  return (data ?? []).map((item, index) => ({
    record: item,
    indent: 0,
    index,
    rowKey: getRowKey(item, index),
  }));
}

// ============================== useFrame ==============================

/** Lock frame：100ms 内的滚动目标去重（rc useTimeoutLock）。 */
export function useTimeoutLock(defaultState: unknown = null): {
  setState: (newState: unknown) => void;
  getState: () => unknown;
  cleanup: () => void;
} {
  let frame = defaultState;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const cleanUp = () => {
    if (timeout !== undefined) clearTimeout(timeout);
    timeout = undefined;
  };
  const setState = (newState: unknown) => {
    frame = newState;
    cleanUp();
    timeout = setTimeout(() => {
      frame = null;
      timeout = undefined;
    }, 100);
  };
  const getState = () => frame;
  return { setState, getState, cleanup: cleanUp };
}
