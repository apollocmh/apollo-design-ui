/**
 * `Mask` —— `@rc-component/dialog@1.10.0` `es/Dialog/Mask.js` 的 Vue 版。
 *
 * ```
 * CSSMotion(key='mask', visible, motionName, leavedClassName='{p}-mask-hidden')
 *   └─ <div class="{p}-mask [motion] [className]" style={{...motion, ...style}} {...maskProps} />
 * ```
 *
 * 判据：
 *   1. `leavedClassName` 是 **`{p}-mask-hidden`**（CSS 里 `display: none`）；
 *   2. 遮罩的可见性由 `Dialog` 传 `mask && visible`（**比 content 多一个 `mask` 门**）；
 *   3. `maskProps` 原样透传到遮罩 div（antd 用它挂 `data-*`）。
 */
import { CSSMotion } from '@apollo-design/motion';
import { defineComponent, h, type PropType } from 'vue';

export default defineComponent({
  name: 'ADialogMask',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, required: true },
    visible: { type: Boolean, default: false },
    motionName: { type: String, default: undefined },
    className: { type: String, default: undefined },
    style: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    maskProps: { type: Object as PropType<Record<string, unknown>>, default: undefined },
  },
  setup(props) {
    return () =>
      h(
        CSSMotion,
        {
          key: 'mask',
          visible: props.visible,
          motionName: props.motionName,
          leavedClassName: `${props.prefixCls}-mask-hidden`,
        },
        {
          default: (motion: { className?: string; style?: Record<string, unknown> | null }) =>
            h('div', {
              class: [motion.className, `${props.prefixCls}-mask`, props.className]
                .filter(Boolean)
                .join(' '),
              style: { ...(motion.style ?? {}), ...props.style },
              ...props.maskProps,
            }),
        },
      );
  },
});
