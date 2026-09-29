/**
 * `Handle` —— rc-slider `Handles/Handle.js`（173 行）的 Vue 等价物。
 *
 * 判据（`docs/analysis/slider.md` §5/§8）：
 *   1. 位置：`getDirectionStyle(direction, value, min, max)`（四方向 + translate）；
 *   2. 类名：`{p}-handle[-{i+1}][-dragging][-dragging-delete][-disabled]`
 *      （⚠️ 序号类**只在 range 模式**加）；
 *   3. ARIA 全套：`role=slider` + `aria-valuemin/max/now/disabled/label/labelledby/required/valuetext/orientation`
 *      （除 `role` / `aria-valuemin|max|now` / `aria-orientation` 外都**逐把手取值**，走 `getIndex`）；
 *   4. 键盘表（**Up is plus**，纵向 ttb 反转；Home/End 到端点；PageUp/PageDown 走 ±2 个候选步；
 *      Backspace/Delete 触发删除）；`preventDefault` **只在有 offset 时**调用；
 *   5. `keyup` 才 `changeComplete`（移动类按键）；
 *   6. `valueIndex === null` ⇒ 「活动把手替身」（range 的 tooltip 锚点）：
 *      **不挂任何 a11y 与事件**，只画位置；
 *   7. **`#wrapper` 槽最后应用**（rc 的 `render(handleNode, info)` 语义）：
 *      默认实现由 Slider 传入（加 Tooltip 包装）；`#handle` 槽替换**节点本身** ——
 *      rc 的 `handleRender` 是「包 node」，Vue 侧扩展成「可包可换」（槽参数给出
 *      `nodeProps` / `className` / `style`，想完全复刻默认节点也能做到）。这是**加强**而非放宽。
 */

import type { CSSProperties } from 'vue';
import { computed, defineComponent, h, inject, type PropType, ref, type VNodeChild } from 'vue';
import type { SliderContextValue } from '../context';
import { sliderContextKey } from '../context';
import type { SliderHandleInfo } from '../interface';
import { getDirectionStyle, getIndex } from '../util';

/** 与 rc 的 KeyCode 对齐（只列用到的）。 */
const KEY = {
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  PAGE_UP: 33,
  PAGE_DOWN: 34,
  HOME: 36,
  END: 35,
  BACKSPACE: 8,
  DELETE: 46,
} as const;

/** `#handle` 槽拿到的额外「节点级」信息（想自己搭节点时用）。 */
export interface HandleSlotNodeInfo {
  nodeProps: Record<string, unknown>;
  className: string;
  style: CSSProperties;
}

export default defineComponent({
  name: 'ASliderHandle',
  props: {
    prefixCls: { type: String, required: true },
    value: { type: Number, required: true },
    /** `null` ⇒ 活动把手替身（无事件/a11y）。 */
    valueIndex: { type: Number as PropType<number | null>, default: null },
    style: { type: Object as PropType<CSSProperties>, default: undefined },
    dragging: { type: Boolean, default: false },
    draggingDelete: { type: Boolean, default: false },
    onStartMove: {
      type: Function as PropType<(e: MouseEvent | TouchEvent, index: number) => void>,
      default: undefined,
    },
    onOffsetChange: {
      type: Function as PropType<(offset: number | 'min' | 'max', index: number) => void>,
      default: undefined,
    },
    onChangeComplete: { type: Function as PropType<() => void>, default: undefined },
    onDelete: { type: Function as PropType<(index: number) => void>, default: undefined },
    onFocus: {
      type: Function as PropType<(e: FocusEvent, index: number) => void>,
      default: undefined,
    },
    onMouseEnter: {
      type: Function as PropType<(e: MouseEvent, index: number) => void>,
      default: undefined,
    },
    onMouseLeave: {
      type: Function as PropType<(e: MouseEvent, index: number) => void>,
      default: undefined,
    },
    /** 按下把手时（antd 层用它开 tooltip + 置 dragging）。 */
    onMouseDownChange: {
      type: Function as PropType<(e: MouseEvent | TouchEvent, index: number) => void>,
      default: undefined,
    },
    onBlurChange: {
      type: Function as PropType<(e: FocusEvent, index: number) => void>,
      default: undefined,
    },
  },
  setup(props, { slots, expose }) {
    const context = inject(sliderContextKey) as SliderContextValue;
    const elRef = ref<HTMLElement | null>(null);

    const mergedDisabled = computed(() =>
      props.valueIndex === null ? false : context.isHandleDisabled(props.valueIndex),
    );
    const handlePrefixCls = computed(() => `${props.prefixCls}-handle`);

    const onInternalStartMove = (e: MouseEvent | TouchEvent): void => {
      if (mergedDisabled.value) {
        e.stopPropagation();
        return;
      }
      props.onMouseDownChange?.(e, props.valueIndex as number);
      props.onStartMove?.(e, props.valueIndex as number);
    };

    const onInternalFocus = (e: FocusEvent): void => {
      if (props.valueIndex === null) return;
      props.onFocus?.(e, props.valueIndex);
    };

    const onInternalBlur = (e: FocusEvent): void => {
      if (props.valueIndex === null) return;
      props.onBlurChange?.(e, props.valueIndex);
    };

    const onInternalMouseEnter = (e: MouseEvent): void => {
      if (props.valueIndex === null) return;
      props.onMouseEnter?.(e, props.valueIndex);
    };

    const onInternalMouseLeave = (e: MouseEvent): void => {
      if (props.valueIndex === null) return;
      props.onMouseLeave?.(e, props.valueIndex);
    };

    const onKeyDown = (e: KeyboardEvent): void => {
      if (mergedDisabled.value || !context.keyboard || props.valueIndex === null) return;
      const index = props.valueIndex;
      const dir = context.direction;
      let offset: number | 'min' | 'max' | undefined;

      switch (e.which || e.keyCode) {
        case KEY.LEFT:
          offset = dir === 'ltr' || dir === 'btt' ? -1 : 1;
          break;
        case KEY.RIGHT:
          offset = dir === 'ltr' || dir === 'btt' ? 1 : -1;
          break;
        // Up is plus
        case KEY.UP:
          offset = dir !== 'ttb' ? 1 : -1;
          break;
        // Down is minus
        case KEY.DOWN:
          offset = dir !== 'ttb' ? -1 : 1;
          break;
        case KEY.HOME:
          offset = 'min';
          break;
        case KEY.END:
          offset = 'max';
          break;
        case KEY.PAGE_UP:
          offset = 2;
          break;
        case KEY.PAGE_DOWN:
          offset = -2;
          break;
        case KEY.BACKSPACE:
        case KEY.DELETE:
          props.onDelete?.(index);
          break;
        default:
          break;
      }
      if (offset !== undefined) {
        e.preventDefault();
        props.onOffsetChange?.(offset, index);
      }
    };

    const onKeyUp = (e: KeyboardEvent): void => {
      switch (e.which || e.keyCode) {
        case KEY.LEFT:
        case KEY.RIGHT:
        case KEY.UP:
        case KEY.DOWN:
        case KEY.HOME:
        case KEY.END:
        case KEY.PAGE_UP:
        case KEY.PAGE_DOWN:
          props.onChangeComplete?.();
          break;
        default:
          break;
      }
    };

    expose({ focus: () => elRef.value?.focus?.(), element: () => elRef.value });

    return () => {
      const index = props.valueIndex;
      const positionStyle = getDirectionStyle(
        context.direction,
        props.value,
        context.min,
        context.max,
      );

      const divProps: Record<string, unknown> = {};
      if (index !== null) {
        divProps.tabIndex =
          (mergedDisabled.value ? undefined : getIndex(context.tabIndex, index)) ?? undefined;
        divProps.role = 'slider';
        divProps['aria-valuemin'] = context.min;
        divProps['aria-valuemax'] = context.max;
        divProps['aria-valuenow'] = props.value;
        divProps['aria-disabled'] = mergedDisabled.value;
        divProps['aria-label'] = getIndex(context.ariaLabelForHandle, index);
        divProps['aria-labelledby'] = getIndex(context.ariaLabelledByForHandle, index);
        divProps['aria-required'] = getIndex(context.ariaRequired, index);
        const formatter = getIndex(context.ariaValueTextFormatterForHandle, index);
        divProps['aria-valuetext'] = formatter?.(props.value);
        divProps['aria-orientation'] =
          context.direction === 'ltr' || context.direction === 'rtl' ? 'horizontal' : 'vertical';
        divProps.onMousedown = onInternalStartMove;
        divProps.onTouchstart = onInternalStartMove;
        divProps.onFocus = onInternalFocus;
        divProps.onBlur = onInternalBlur;
        divProps.onMouseenter = onInternalMouseEnter;
        divProps.onMouseleave = onInternalMouseLeave;
        divProps.onKeydown = onKeyDown;
        divProps.onKeyup = onKeyUp;
      }

      const className = [
        handlePrefixCls.value,
        index !== null && context.range ? `${handlePrefixCls.value}-${index + 1}` : '',
        props.dragging ? `${handlePrefixCls.value}-dragging` : '',
        props.draggingDelete ? `${handlePrefixCls.value}-dragging-delete` : '',
        mergedDisabled.value ? `${handlePrefixCls.value}-disabled` : '',
        context.classNames.handle,
      ]
        .filter(Boolean)
        .join(' ');

      const nodeStyle: CSSProperties = {
        ...positionStyle,
        ...props.style,
        ...context.styles.handle,
      };

      const info: SliderHandleInfo = {
        index: index ?? -1,
        prefixCls: props.prefixCls,
        value: props.value,
        dragging: props.dragging,
        draggingDelete: props.draggingDelete,
      };

      const node = slots.default
        ? (slots.default({
            ...info,
            nodeProps: divProps,
            className,
            style: nodeStyle,
          } as never) as VNodeChild)
        : h('div', { ...divProps, class: className, style: nodeStyle, ref: elRef }, []);

      //  槽 = rc 的 `render(handleNode, info)`：拿到**已建好的节点**再包一层
      // （默认实现由 Slider 传入：包 SliderTooltip）。见文件头判据 7。
      if (slots.wrapper && node) {
        return slots.wrapper({ ...info, node } as never);
      }
      return node;
    };
  },
});
