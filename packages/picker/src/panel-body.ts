/**
 * 面板主体：`rowNum × colNum` 的表格 + 可选的表头行 + 可选的行首列（周号）。
 *
 * 上游：`@rc-component/picker@1.12.2` 的 `es/PickerPanel/PanelBody.js`（146 行）。
 *
 * ── 本仓与上游的**唯一结构差异**：格子状态由 `panel.ts` 的 `buildPanelCells` 一次算出 ──
 *
 * 上游把「取日期 → 判 disabled → 判 range → 判 title → 拼 class」全写在 JSX 里，
 * 于是那段逻辑在 jsdom 里不可测（无布局也就算了，连**状态位**都拿不到）。
 * 本仓把它前置成纯函数（`buildPanelCells`，已有 33 条 L1 用例），
 * 本组件只负责**把状态位映射成 DOM**。映射规则逐条照抄，见下。
 *
 * ── 三个容易写错的判据 ────────────────────────────────────────────────────────
 *
 * 1. **`-cell-selected` 的判据不含 `cellSelection`**：上游写的是
 *    `!hoverRangeValue && type !== 'week' && matchValues(date)`。week 面板靠
 *    `type !== 'week'` 排除，而 `cellSelection` 只影响 range 三态。这两件事**不是**一回事。
 * 2. **`onMouseEnter` 不判 disabled 就调 `onHover`**（反之亦然：disabled 格子不 hover）。
 *    所以 hover 预览时鼠标划过禁用格不会更新预览区间。
 * 3. **`title` 只在 `titleFormat` 存在时渲染**（不是空串），否则属性整个不出现。
 */

import { defineComponent, h, type PropType, type VNodeChild } from 'vue';
import { buildPanelCells, type PanelGeometry } from './panel';
import { type PanelDateType, usePanelHack, usePanelInfo } from './panel-context';
import type { DisabledDate } from './types';

/** 行首列（周号）的渲染函数。 */
type PrefixColumnFn = (rowStartDate: PanelDateType) => VNodeChild;
/** 行级 class（week 面板的 `-row-selected` / range 三态都挂在这里）。 */
type RowClassNameFn = (rowStartDate: PanelDateType) => string | undefined;

export const PanelBody = defineComponent({
  name: 'ApolloPickerPanelBody',
  props: {
    geometry: {
      type: Object as PropType<PanelGeometry<PanelDateType>>,
      required: true,
    },
    /** 面板级的 `disabledDate` **覆盖**（不传则用上下文里的） */
    disabledDate: {
      type: Function as PropType<DisabledDate<PanelDateType> | undefined>,
      default: undefined,
    },
    /** 行首列：week 面板的周号格 */
    prefixColumn: {
      type: Function as PropType<PrefixColumnFn | undefined>,
      default: undefined,
    },
    /** 行级 class：week 面板的整行选中/区间 */
    rowClassName: {
      type: Function as PropType<RowClassNameFn | undefined>,
      default: undefined,
    },
    /** 表头行；`undefined` ⇒ **整块 `<thead>` 不渲染**（与空数组不同） */
    headerCells: {
      type: Array as PropType<VNodeChild[] | undefined>,
      default: undefined,
    },
  },
  setup(props) {
    return () => {
      const ctx = usePanelInfo().value;
      const hack = usePanelHack();
      const {
        prefixCls,
        classNames,
        styles,
        panelType: type,
        now,
        generateConfig,
        values,
        locale,
        onSelect,
        onHover,
      } = ctx;

      const mergedDisabledDate = props.disabledDate ?? ctx.disabledDate;
      const cellPrefixCls = `${prefixCls}-cell`;

      const rows = buildPanelCells(props.geometry, {
        generateConfig,
        locale,
        mode: type,
        now,
        values,
        hoverValue: ctx.hoverValue,
        hoverRangeValue: ctx.hoverRangeValue,
        disabledDate: mergedDisabledDate,
      } as Parameters<typeof buildPanelCells<PanelDateType>>[1]);

      const renderCell = (
        cell: (typeof rows)[number][number],
        rowStartDate: PanelDateType,
        col: number,
      ): VNodeChild => {
        const inner = h('div', { class: `${cellPrefixCls}-inner` }, [cell.text]);

        return h(
          'td',
          {
            key: col,
            title: cell.title,
            class: [
              cellPrefixCls,
              classNames.item,
              {
                [`${cellPrefixCls}-disabled`]: cell.disabled,
                [`${cellPrefixCls}-hover`]: cell.hovered,
                [`${cellPrefixCls}-in-range`]: cell.inRange,
                [`${cellPrefixCls}-range-start`]: cell.rangeStart,
                [`${cellPrefixCls}-range-end`]: cell.rangeEnd,
                // ⚠️ 这一条的判据在 `buildPanelCells` 里（不含 `cellSelection`），见文件头
                [`${cellPrefixCls}-selected`]: cell.selected,
                [`${prefixCls}-cell-in-view`]: cell.inView,
                [`${prefixCls}-cell-today`]: cell.today,
              },
            ],
            style: styles.item,
            onClick: () => {
              if (!cell.disabled) {
                onSelect(cell.date);
              }
            },
            // ⚠️ 事件名**全小写**（Vue 的事件 prop 是 `onDblclick` / `onMouseenter`，
            //    写成 `onDblClick` 会静默不绑定 —— PITFALLS 跨包判据 1）
            onDblclick: () => {
              if (!cell.disabled && hack.onCellDblClick) {
                hack.onCellDblClick();
              }
            },
            onMouseenter: () => {
              if (!cell.disabled) {
                onHover?.(cell.date);
              }
            },
            onMouseleave: () => {
              if (!cell.disabled) {
                onHover?.(null);
              }
            },
          },
          // ⚠️ 用**数组**形态传 children：`VNodeChild` 含 `null` / `boolean`，
          //    直传不满足 `h` 的 `RawChildren`（TS2769）。数组形态是仓内惯例。
          [
            ctx.cellRender
              ? ctx.cellRender(cell.date, {
                  prefixCls,
                  originNode: inner,
                  today: now,
                  type,
                  locale,
                })
              : inner,
          ],
        );
      };

      const bodyRows = rows.map((rowCells, row) => {
        const rowStartDate = props.geometry.getCellDate(
          props.geometry.baseDate,
          row * props.geometry.colNum,
        );

        const tds: VNodeChild[] = [];
        if (props.prefixColumn) {
          tds.push(props.prefixColumn(rowStartDate));
        }
        rowCells.forEach((cell, col) => tds.push(renderCell(cell, rowStartDate, col)));

        return h('tr', { key: row, class: props.rowClassName?.(rowStartDate) }, tds);
      });

      return h(
        'div',
        { class: [`${prefixCls}-body`, classNames.body], style: styles.body },
        h('table', { class: [`${prefixCls}-content`, classNames.content], style: styles.content }, [
          props.headerCells !== undefined && props.headerCells !== null
            ? h('thead', h('tr', props.headerCells))
            : null,
          h('tbody', bodyRows),
        ]),
      );
    };
  },
});

/** 供面板组件复用的「info 里与格子无关的公共字段」类型收窄辅助（仅类型用）。 */
