/**
 * `Palette` —— 相对定位的画布容器（rc `components/Palette.js`）。
 *
 * ```html
 * <div class="{p}-palette" style="position:relative;…style">
 * ```
 *
 * ⚠️ `position: relative` 是**兜底**：调用方传的 `style` 可以覆盖它
 * （上游是 `{ position: 'relative', ...style }`，顺序不能反）。
 *
 * `.ts` 而非 `.vue` 的理由：`COMPONENT-RULES.md` §2 条件 1（纯渲染函数型内部件）。
 */

import { defineComponent, h, type PropType } from 'vue';

type StyleLike = Record<string, string | number>;

export const ColorPalette = defineComponent({
  name: 'AColorPalette',
  props: {
    prefixCls: { type: String, required: true },
    style: { type: Object as PropType<StyleLike>, default: undefined },
  },
  setup(props, { slots }) {
    return () =>
      h(
        'div',
        {
          class: `${props.prefixCls}-palette`,
          style: { position: 'relative', ...props.style },
        },
        slots.default?.(),
      );
  },
});

export default ColorPalette;
