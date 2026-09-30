/**
 * 面板表头：四个方向键 + 中间的「标题槽」。
 *
 * 上游：`@rc-component/picker@1.12.2` 的 `es/PickerPanel/PanelHeader.js`（129 行）。
 *
 * ── 三处照抄的细节（上游都是有意的）──────────────────────────────────────────
 *
 * 1. **四个按钮的 `tabIndex` 恒为 `-1`** —— 表头不参与 Tab 序，键盘可达性由输入框的
 *    mask 字段承担（契约 §3.5）。写 `-1` 而不是省略：省略会让 `<button>` 默认可达。
 * 2. **`hidePrev` / `hideNext` 用 `visibility: hidden`**，不是 `display: none` ——
 *    双面板（RangePicker）时**保留占位**，两张面板的宽度才对得上。
 * 3. **`aria-label` 取的是「方向 + 粒度」的文案**（`locale.previousYear` 等），与视觉上的
 *    `‹` / `«` 无关 —— 粒度由**哪个按钮**决定，不由箭头形状决定。
 */

import { defineComponent, h, type PropType, type VNodeChild } from 'vue';
import { hiddenStyleWhen, type PanelDateType, usePanelHack, usePanelInfo } from './panel-context';
import { getHeaderDisabled, type PanelHeaderLimits } from './panel-header-limit';

/** `offset` / `superOffset`：给一个距离，返回目标 `pickerValue`。 */
type OffsetFn = (distance: number, base: PanelDateType) => PanelDateType;
/** `getStart` / `getEnd`：给一个日期，返回它所在区间的端点。 */
type LimitFn = (date: PanelDateType) => PanelDateType;

/**
 * 表头的默认图标（上游用 `'\u2039'` 这类**字符**而不是图标组件）。
 *
 * ⚠️ 它们是**字符**，`aria-label` 才是可访问名 —— 所以 `ui` 层换成图标组件
 * 不影响可达性，也不影响 L4 的 ARIA 比对。
 */
export const DEFAULT_HEADER_ICONS = {
  prev: '\u2039',
  next: '\u203A',
  superPrev: '\u00AB',
  superNext: '\u00BB',
} as const;

function renderHeaderButton(
  cls: string,
  ariaLabel: string | undefined,
  onClick: () => void,
  isDisabled: boolean,
  content: VNodeChild,
  style: Record<string, string>,
): VNodeChild {
  return h(
    'button',
    {
      type: 'button',
      'aria-label': ariaLabel,
      onClick,
      tabIndex: -1,
      class: [cls, isDisabled ? `${cls}-disabled` : undefined],
      disabled: isDisabled,
      style,
    },
    // ⚠️ 数组形态（`VNodeChild` 含 `null`，直传不满足 `RawChildren`）
    [content],
  );
}

export const PanelHeader = defineComponent({
  name: 'ApolloPickerPanelHeader',
  props: {
    /** 翻一格；`undefined` ⇒ 不渲染 `prev` / `next`（月/季面板就是这种形态） */
    offset: { type: Function as PropType<OffsetFn | undefined>, default: undefined },
    /** 翻一屏 */
    superOffset: { type: Function as PropType<OffsetFn | undefined>, default: undefined },
    getStart: { type: Function as PropType<LimitFn | undefined>, default: undefined },
    getEnd: { type: Function as PropType<LimitFn | undefined>, default: undefined },
    /** 翻页后把新的 `pickerValue` 交回去（受控/非受控与 `onPanelChange` 由面板负责） */
    onChange: {
      type: Function as PropType<((next: PanelDateType) => void) | undefined>,
      default: undefined,
    },
  },
  setup(props, { slots }) {
    return () => {
      const hack = usePanelHack();

      // 逃生通道先于一切：整块表头都不要时直接返回 `null`（上游在 render 前 return null）
      if (hack.hideHeader) {
        return null;
      }

      const ctx = usePanelInfo().value;
      const { prefixCls, locale, generateConfig: g, pickerValue } = ctx;

      const limits: PanelHeaderLimits<PanelDateType> = {
        offset: props.offset,
        superOffset: props.superOffset,
        getStart: props.getStart,
        getEnd: props.getEnd,
      };
      const disabled = getHeaderDisabled(
        {
          generateConfig: g,
          locale,
          panelType: ctx.panelType,
          pickerValue,
          minDate: ctx.minDate,
          maxDate: ctx.maxDate,
        },
        limits,
      );

      const onOffset = (distance: number): void => {
        if (props.offset) {
          props.onChange?.(props.offset(distance, pickerValue));
        }
      };
      const onSuperOffset = (distance: number): void => {
        if (props.superOffset) {
          props.onChange?.(props.superOffset(distance, pickerValue));
        }
      };

      const headerPrefixCls = `${prefixCls}-header`;
      const prevBtnCls = `${headerPrefixCls}-prev-btn`;
      const nextBtnCls = `${headerPrefixCls}-next-btn`;
      const superPrevBtnCls = `${headerPrefixCls}-super-prev-btn`;
      const superNextBtnCls = `${headerPrefixCls}-super-next-btn`;

      return h(
        'div',
        { class: [headerPrefixCls, ctx.classNames.header], style: ctx.styles.header },
        [
          props.superOffset
            ? renderHeaderButton(
                superPrevBtnCls,
                locale.previousYear,
                () => onSuperOffset(-1),
                disabled.superPrev,
                ctx.superPrevIcon ?? DEFAULT_HEADER_ICONS.superPrev,
                hiddenStyleWhen(hack.hidePrev),
              )
            : null,
          props.offset
            ? renderHeaderButton(
                prevBtnCls,
                locale.previousMonth,
                () => onOffset(-1),
                disabled.prev,
                ctx.prevIcon ?? DEFAULT_HEADER_ICONS.prev,
                hiddenStyleWhen(hack.hidePrev),
              )
            : null,
          h('div', { class: `${headerPrefixCls}-view` }, [slots.default?.()]),
          props.offset
            ? renderHeaderButton(
                nextBtnCls,
                locale.nextMonth,
                () => onOffset(1),
                disabled.next,
                ctx.nextIcon ?? DEFAULT_HEADER_ICONS.next,
                hiddenStyleWhen(hack.hideNext),
              )
            : null,
          props.superOffset
            ? renderHeaderButton(
                superNextBtnCls,
                locale.nextYear,
                () => onSuperOffset(1),
                disabled.superNext,
                ctx.superNextIcon ?? DEFAULT_HEADER_ICONS.superNext,
                hiddenStyleWhen(hack.hideNext),
              )
            : null,
        ],
      );
    };
  },
});
