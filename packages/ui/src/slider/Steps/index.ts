/**
 * `Steps` / `Dot` —— rc-slider `Steps/{index,Dot}.js`（44 + 40 行）的 Vue 等价物。
 *
 * 判据（`docs/analysis/slider.md` §8）：
 *   1. 点集合 = **marks 的值 ∪ （`dots` 且 `step !== null` 时的 min..max 步长序列）**，
 *      用 `Set` 去重（⚠️ 浮点步长累加可能与 mark 值差 1e-16 而**不去重** —— rc 同判，不修）；
 *   2. 容器：`div.{p}-step`（**恒渲染**，无点时为空）；
 *   3. 单个点：`span.{p}-dot[-active]`，位置 `getDirectionStyle`；
 *      `active = included && includedStart <= value <= includedEnd`；
 *   4. `style` / `activeStyle` 可以是**函数**（按值求值）。
 */

import type { CSSProperties, VNode } from 'vue';
import { computed, defineComponent, h, inject, type PropType } from 'vue';
import { sliderContextKey } from '../context';
import type { SliderDotStyle } from '../interface';
import { getDirectionStyle } from '../util';

const Dot = defineComponent({
  name: 'ASliderDot',
  props: {
    prefixCls: { type: String, required: true },
    value: { type: Number, required: true },
    style: { type: [Object, Function] as PropType<SliderDotStyle>, default: undefined },
    activeStyle: { type: [Object, Function] as PropType<SliderDotStyle>, default: undefined },
  },
  setup(props) {
    const context = inject(sliderContextKey) as import('../context').SliderContextValue;
    const dotClassName = computed(() => `${props.prefixCls}-dot`);

    return () => {
      const active =
        context.included &&
        context.includedStart <= props.value &&
        props.value <= context.includedEnd;

      let mergedStyle: CSSProperties = {
        ...getDirectionStyle(context.direction, props.value, context.min, context.max),
        ...(typeof props.style === 'function' ? props.style(props.value) : props.style),
      };
      if (active) {
        mergedStyle = {
          ...mergedStyle,
          ...(typeof props.activeStyle === 'function'
            ? props.activeStyle(props.value)
            : props.activeStyle),
        };
      }

      return h('span', {
        class: [dotClassName.value, active ? `${dotClassName.value}-active` : '']
          .filter(Boolean)
          .join(' '),
        style: mergedStyle,
      });
    };
  },
});

export default defineComponent({
  name: 'ASliderSteps',
  props: {
    prefixCls: { type: String, required: true },
    marks: {
      type: Array as PropType<import('../context').NormalizedMark[]>,
      default: () => [],
    },
    dots: { type: Boolean, default: false },
    style: { type: [Object, Function] as PropType<SliderDotStyle>, default: undefined },
    activeStyle: { type: [Object, Function] as PropType<SliderDotStyle>, default: undefined },
  },
  setup(props) {
    const context = inject(sliderContextKey) as import('../context').SliderContextValue;

    const stepDots = computed<number[]>(() => {
      const dotSet = new Set<number>();
      for (const mark of props.marks) dotSet.add(mark.value);
      if (props.dots && context.step !== null) {
        let current = context.min;
        while (current <= context.max) {
          dotSet.add(current);
          current += context.step;
        }
      }
      return Array.from(dotSet);
    });

    return () => {
      const nodes: VNode[] = stepDots.value.map((dotValue) =>
        h(Dot, {
          key: dotValue,
          prefixCls: props.prefixCls,
          value: dotValue,
          style: props.style,
          activeStyle: props.activeStyle,
        }),
      );
      return h('div', { class: `${props.prefixCls}-step` }, nodes);
    };
  },
});
