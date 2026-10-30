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

import {
  computed,
  defineComponent,
  h,
  nextTick,
  type PropType,
  type SlotsType,
  shallowRef,
  type VNodeChild,
  watch,
} from 'vue';
import { isSame } from './date-util';
import { buildPanelCells, type PanelGeometry } from './panel';
import { type PanelDateType, type PanelSlots, usePanelHack, usePanelInfo } from './panel-context';
import type { DisabledDate } from './types';

export interface PanelBodySlots extends PanelSlots {
  prefixColumn?: (scope: { date: PanelDateType }) => VNodeChild;
}
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
  emits: { navigate: (_date: PanelDateType) => true },
  slots: Object as SlotsType<PanelBodySlots>,
  setup(props, { slots, expose, emit }) {
    const info = usePanelInfo();
    const hack = usePanelHack();
    const elements: (HTMLTableCellElement | null)[] = [];
    const activeDate = shallowRef<PanelDateType>();
    const rows = computed(() => {
      const ctx = info.value;
      return buildPanelCells(props.geometry, {
        generateConfig: ctx.generateConfig,
        locale: ctx.locale,
        mode: ctx.panelType,
        now: ctx.now,
        values: ctx.values,
        hoverValue: ctx.hoverValue,
        hoverRangeValue: ctx.hoverRangeValue,
        disabledDate: props.disabledDate ?? ctx.disabledDate,
      });
    });
    const cells = computed(() => rows.value.flat());
    const same = (left: PanelDateType, right: PanelDateType) => {
      const ctx = info.value;
      return isSame(ctx.generateConfig, ctx.locale, left, right, ctx.panelType);
    };
    const activeIndex = computed(() => {
      const target = activeDate.value ?? info.value.pickerValue;
      const found = cells.value.findIndex((cell) => !cell.disabled && same(cell.date, target));
      if (found >= 0) return found;
      const selected = cells.value.findIndex((cell) => !cell.disabled && cell.selected);
      return selected >= 0
        ? selected
        : cells.value.findIndex((cell) => !cell.disabled && cell.inView);
    });
    const focusCell = (index: number) => {
      const cell = cells.value[index];
      if (!cell || cell.disabled) return;
      activeDate.value = cell.date;
      elements[index]?.focus({ preventScroll: true });
    };
    expose({
      focus: (date?: PanelDateType) => {
        activeDate.value = date;
        focusCell(activeIndex.value);
      },
    });
    watch(
      () => info.value.pickerValue,
      () => {
        activeDate.value = undefined;
      },
    );
    watch(
      cells,
      () => {
        const focused = elements.findIndex(
          (element) => element && element.ownerDocument.activeElement === element,
        );
        if (focused >= 0 && cells.value[focused]?.disabled) focusCell(activeIndex.value);
      },
      { flush: 'post' },
    );
    const onKeydown = async (event: KeyboardEvent, index: number) => {
      if (event.defaultPrevented || event.isComposing) return;
      const cell = cells.value[index];
      if (!cell || cell.disabled) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        info.value.onSelect(cell.date);
        return;
      }
      const horizontal = info.value.direction === 'rtl' ? -1 : 1;
      const offset =
        event.key === 'ArrowLeft'
          ? -horizontal
          : event.key === 'ArrowRight'
            ? horizontal
            : event.key === 'ArrowUp'
              ? -props.geometry.colNum
              : event.key === 'ArrowDown'
                ? props.geometry.colNum
                : 0;
      if (!offset) return;
      event.preventDefault();
      let nextIndex = index + offset;
      for (let count = 0; count < cells.value.length; count += 1, nextIndex += offset) {
        const nextCell = cells.value[nextIndex];
        if (nextCell) {
          if (!nextCell.disabled) {
            focusCell(nextIndex);
            return;
          }
        } else {
          const ctx = info.value;
          const date = props.geometry.getCellDate(props.geometry.baseDate, nextIndex);
          if ((props.disabledDate ?? ctx.disabledDate)?.(date, { type: ctx.panelType })) continue;
          activeDate.value = date;
          emit('navigate', date);
          await nextTick();
          const next = cells.value.findIndex((item) => same(item.date, date));
          if (next >= 0) focusCell(next);
          return;
        }
      }
    };
    return () => {
      const ctx = info.value;
      const {
        prefixCls,
        classNames,
        styles,
        panelType: type,
        now,
        locale,
        onSelect,
        onHover,
      } = ctx;

      const cellPrefixCls = `${prefixCls}-cell`;

      const renderCell = (
        cell: (typeof rows.value)[number][number],
        col: number,
        index: number,
      ): VNodeChild => {
        const inner = h('div', { class: `${cellPrefixCls}-inner` }, [cell.text]);

        return h(
          'td',
          {
            key: col,
            ref: (element) => {
              elements[index] = element instanceof HTMLTableCellElement ? element : null;
            },
            tabindex: !cell.disabled && index === activeIndex.value ? 0 : -1,
            'aria-disabled': cell.disabled || undefined,
            onFocus: () => {
              activeDate.value = cell.date;
            },
            onKeydown: (event: KeyboardEvent) => onKeydown(event, index),
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
            slots.cellRender
              ? slots.cellRender({
                  current: cell.date,
                  info: {
                    prefixCls,
                    originNode: inner,
                    today: now,
                    type,
                    locale,
                  },
                })
              : inner,
          ],
        );
      };

      const bodyRows = rows.value.map((rowCells, row) => {
        const rowStartDate = props.geometry.getCellDate(
          props.geometry.baseDate,
          row * props.geometry.colNum,
        );

        const tds: VNodeChild[] = [];
        if (slots.prefixColumn) {
          tds.push(slots.prefixColumn({ date: rowStartDate }));
        }
        rowCells.forEach((cell, col) => {
          tds.push(renderCell(cell, col, row * props.geometry.colNum + col));
        });

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
