/**
 * `Marks` / `Mark` —— rc-slider `Marks/{index,Mark}.js`（28 + 40 行）的 Vue 等价物。
 *
 * ⚠️ **DOM 结构以 rc 源码为准**（`docs/analysis/slider.md` §8 已按源码修正）：
 *      `div.{p}-mark` > 每个 `span.{p}-mark-text[-active]`（**没有** `-mark-wrapper` 那层，
 *      那是 antd 早期版本的形态，本仓不跟随）。
 *
 * 判据：
 *   1. `marks` 为空 ⇒ 整体不渲染（而 `{p}-step` 恒渲染 —— 两者不对称是上游行为）；
 *   2. 每个 mark 的 `class` 由 `getDirectionStyle` 定位；
 *   3. `active = included && includedStart <= value <= includedEnd`；
 *   4. `mousedown` **stopPropagation**（避免点标记时触发「点轨道改值」），
 *      `click` 才调 `onClick(value)`（Slider 的 `changeToCloseValue`）。
 */

import type { CSSProperties } from 'vue';
import { computed, defineComponent, h, inject, type PropType, type VNodeChild } from 'vue';
import { sliderContextKey } from '../context';
import { getDirectionStyle } from '../util';

const Mark = defineComponent({
  name: 'ASliderMark',
  props: {
    prefixCls: { type: String, required: true },
    style: { type: Object as PropType<CSSProperties>, default: undefined },
    value: { type: Number, required: true },
    label: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    onClick: {
      type: Function as PropType<(value: number) => void>,
      default: undefined,
    },
  },
  setup(props) {
    const context = inject(sliderContextKey) as import('../context').SliderContextValue;
    const textCls = computed(() => `${props.prefixCls}-text`);

    return () => {
      const active =
        context.included &&
        context.includedStart <= props.value &&
        props.value <= context.includedEnd;
      return h(
        'span',
        {
          class: [textCls.value, active ? `${textCls.value}-active` : ''].filter(Boolean).join(' '),
          style: {
            ...getDirectionStyle(context.direction, props.value, context.min, context.max),
            ...props.style,
          },
          onMousedown: (e: MouseEvent) => {
            e.stopPropagation();
          },
          onClick: () => {
            props.onClick?.(props.value);
          },
        },
        [props.label],
      );
    };
  },
});

export default defineComponent({
  name: 'ASliderMarks',
  props: {
    prefixCls: { type: String, required: true },
    marks: {
      type: Array as PropType<import('../context').NormalizedMark[]>,
      default: () => [],
    },
    onClick: {
      type: Function as PropType<(value: number) => void>,
      default: undefined,
    },
  },
  setup(props) {
    return () => {
      if (!props.marks.length) return null;
      return h(
        'div',
        { class: `${props.prefixCls}-mark` },
        props.marks.map((mark) =>
          h(Mark, {
            key: mark.value,
            prefixCls: `${props.prefixCls}-mark`,
            style: mark.style,
            value: mark.value,
            label: mark.label,
            onClick: props.onClick,
          }),
        ),
      );
    };
  },
});
