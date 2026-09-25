/**
 * `Progress` —— rc `Progress.js` 的 Vue 版。
 *
 * 就是一个原生 `<progress max="100" value={percent}>`（无样式，样式在 notice 的
 * `-notice-progress` 上）。`components.progress` 可整体替换它。
 */
import { defineComponent, h, type PropType } from 'vue';

import type { NotificationProgressProps } from './interface';

export default defineComponent({
  name: 'NotificationProgress',
  props: {
    className: { type: String, default: undefined },
    style: { type: Object as PropType<NotificationProgressProps['style']>, default: undefined },
    percent: { type: Number, required: true },
  },
  setup(props) {
    return () =>
      h('progress', {
        class: props.className,
        max: '100',
        value: props.percent,
        style: props.style,
      });
  },
});
