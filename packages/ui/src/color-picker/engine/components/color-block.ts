/**
 * `ColorBlock` —— 色块（rc `components/ColorBlock.js`）。
 *
 * ```html
 * <div class="{p}-color-block [className]">
 *   <div class="{p}-color-block-inner [innerClassName]" style="background:{color}">
 * </div>
 * ```
 *
 * ⚠️ **两处 style 的落点不同**：`style` 落**外层**、`innerStyle` 落**内层**
 * （与 `background` 合并）。`ColorTrigger` 用它承载语义槽 `body`（外层）与
 * `content`（内层）—— 别把两者合并。
 *
 * `.ts` 而非 `.vue` 的理由：`COMPONENT-RULES.md` §2 条件 1（**纯渲染函数型内部件**）。
 */

import { type CSSProperties, defineComponent, h, type PropType } from 'vue';

/** 内联样式的值面。⚠️ 数字**不会**被补 `px`（Vue 的 `patchStyle` 不做转换）——
 *  调用方一律传字符串；需要补单位时用 `_internal/to-css-size.ts` 的 `toCssSize`。 */

export const ColorBlock = defineComponent({
  name: 'AColorBlock',
  props: {
    /** 内层背景（CSS 颜色串，渐变也是串）。 */
    color: { type: String, required: true },
    prefixCls: { type: String, required: true },
    className: { type: String, default: undefined },
    style: { type: Object as PropType<CSSProperties>, default: undefined },
    innerClassName: { type: String, default: undefined },
    innerStyle: { type: Object as PropType<CSSProperties>, default: undefined },
    interactive: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    label: { type: String, default: undefined },
  },
  emits: { click: (_event: MouseEvent) => true },
  setup(props, { emit }) {
    return () => {
      const colorBlockCls = `${props.prefixCls}-color-block`;
      return h(
        props.interactive ? 'button' : 'div',
        {
          class: [colorBlockCls, props.className],
          style: props.style,
          type: props.interactive ? 'button' : undefined,
          disabled: props.interactive ? props.disabled : undefined,
          'aria-label': props.interactive ? (props.label ?? props.color) : undefined,
          onClick: (event: MouseEvent) => emit('click', event),
        },
        [
          h('div', {
            class: [`${colorBlockCls}-inner`, props.innerClassName],
            style: { background: props.color, ...props.innerStyle },
          }),
        ],
      );
    };
  },
});

export default ColorBlock;
