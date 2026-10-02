/**
 * `Handler` —— 取色手柄（rc `components/Handler.js`）。
 *
 * ```html
 * <div class="{p}-handler [-handler-sm]" style="background-color:{color}">
 * ```
 *
 * ⚠️ `size === 'small'` 时才加 `-handler-sm`（默认档**不加**类）。
 *
 * `.ts` 而非 `.vue` 的理由：`COMPONENT-RULES.md` §2 条件 1（纯渲染函数型内部件）。
 */

import { defineComponent, h } from 'vue';

export const ColorHandler = defineComponent({
  name: 'AColorHandler',
  props: {
    /** 手柄底色（CSS 颜色串）。 */
    color: { type: String, required: true },
    prefixCls: { type: String, required: true },
    /** `'default'`（16px，面板）/ `'small'`（12px，滑块）。 */
    size: { type: String, default: 'default' },
  },
  setup(props) {
    return () =>
      h('div', {
        class: [
          `${props.prefixCls}-handler`,
          { [`${props.prefixCls}-handler-sm`]: props.size === 'small' },
        ],
        style: { backgroundColor: props.color },
      });
  },
});

export default ColorHandler;
