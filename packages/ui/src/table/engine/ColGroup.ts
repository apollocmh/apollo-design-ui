/**
 * rc `ColGroup.js`（50 行）—— Vue 移植。
 * 只渲染「有宽度 / 有附加属性 / 已开始渲染」的 col（尾列省略）。
 */

import { defineComponent, h, inject, type PropType } from 'vue';
import type { ColumnsType } from '../interface';
import { tableContextKey } from './context';
import { INTERNAL_COL_DEFINE } from './utils/legacyUtil';

const ColGroup = defineComponent({
  name: 'TableColGroup',
  props: {
    colWidths: { type: Array as PropType<(number | string | undefined)[]>, required: true },
    columns: { type: Array as PropType<ColumnsType>, required: true },
    columCount: { type: Number, default: undefined },
  },
  setup(props) {
    const ctx = inject(tableContextKey)!;
    return () => {
      const cols: unknown[] = [];
      const len = props.columCount ?? props.columns.length;
      let mustInsert = false;
      for (let i = len - 1; i >= 0; i -= 1) {
        const width = props.colWidths[i];
        const column = props.columns[i] as Record<string, unknown> | undefined;
        let additionalProps: Record<string, unknown> | undefined;
        let minWidth: number | string | undefined;
        if (column) {
          additionalProps = column[INTERNAL_COL_DEFINE] as Record<string, unknown>;
          if (ctx.tableLayout === 'auto') {
            minWidth = column.minWidth as number | string | undefined;
          }
        }
        if (width || minWidth || additionalProps || mustInsert) {
          const { columnType, ...restAdditionalProps } = additionalProps ?? {};
          void columnType;
          cols.unshift(
            h('col', {
              key: i,
              style: {
                // ⚠️ React 自动加 px，Vue 不加（无单位 width 会被丢弃，见 scrollTableStyle）
                width: typeof width === 'number' ? `${width}px` : (width as string | undefined),
                minWidth,
              },
              ...restAdditionalProps,
            }),
          );
          mustInsert = true;
        }
      }
      return cols.length > 0 ? h('colgroup', cols as never) : null;
    };
  },
});

export default ColGroup;
